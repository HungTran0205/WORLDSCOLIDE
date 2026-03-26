/**
 * CombatEngine — real-time combat driver for the auto-battler arena.
 * Mutable state, tick(dt) advances combat, activateSkill(id) for player input.
 * Reuses all existing formulas/effects/passives — zero duplication with simulateCombat.
 */

import type { Member } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';
import type { CombatEvent, CombatTick, CombatResult, CombatOutcome } from './combat-types';
import type { ArenaEntity, Formation } from './combat-arena-types';
import { getFormationPosition } from './combat-arena-types';
import { calcAutoAttackDamage, calcSkillDamage, rollCrit, CRIT_MULTIPLIER } from './combat-formulas';
import { applyEffectTick } from './combat-effects';
import { applyPassiveTick, onDamageDealt, rollPassiveDodge } from './combat-passives';
import { findTarget, getDistance, moveToward, processAbilities } from './combat-ai';
import { memberToArenaEntity, enemyToArenaEntity } from './combat-entity-factory';

const LOGIC_TICK_MS = 100;
const MAX_COMBAT_MS = 120_000; // 2 min hard cap
const ANIM_ATTACK_DURATION = 300; // ms before reverting to idle

export class CombatEngine {
  entities: ArenaEntity[] = [];
  time = 0;
  private accumulator = 0;
  private eventQueue: CombatEvent[] = [];
  private ticks: CombatTick[] = [];
  private totalDamageDealt = 0;
  private finished = false;
  private pendingSkills: Set<string> = new Set();

  /** Initialize combat from formation + enemies */
  init(members: Member[], formation: Formation, enemyTemplates: EnemyTemplate[]): void {
    this.entities = [];
    this.time = 0;
    this.accumulator = 0;
    this.ticks = [];
    this.totalDamageDealt = 0;
    this.finished = false;
    this.pendingSkills.clear();
    this.eventQueue = [];

    // Place allies from formation
    formation.forEach((memberId, slotIndex) => {
      if (!memberId) return;
      const member = members.find(m => m.id === memberId);
      if (!member) return;
      const pos = getFormationPosition(slotIndex, 'ally');
      this.entities.push(memberToArenaEntity(member, pos));
    });

    // Place enemies in mirror formation
    enemyTemplates.forEach((tmpl, i) => {
      const slotIndex = i % 6;
      const pos = getFormationPosition(slotIndex, 'enemy');
      this.entities.push(enemyToArenaEntity(tmpl, i, pos));
    });
  }

  /** Advance combat by dt milliseconds. Call from useFrame. */
  tick(dt: number): CombatEvent[] {
    if (this.finished) return [];
    this.accumulator += dt;
    const frameEvents: CombatEvent[] = [];

    while (this.accumulator >= LOGIC_TICK_MS && !this.finished) {
      this.accumulator -= LOGIC_TICK_MS;
      this.time += LOGIC_TICK_MS;
      this.eventQueue = [];

      this.processLogicTick();

      if (this.eventQueue.length > 0) {
        this.ticks.push({ time: this.time, events: [...this.eventQueue] });
        frameEvents.push(...this.eventQueue);
      }

      this.checkVictoryCondition();
      if (this.time >= MAX_COMBAT_MS) this.finished = true;
    }

    return frameEvents;
  }

  /** Player activates a member's skill — queued for next logic tick */
  activateSkill(memberId: string): void {
    this.pendingSkills.add(memberId);
  }

  isFinished(): boolean { return this.finished; }

  getResult(): CombatResult {
    const alliesAlive = this.entities.filter(e => e.isAlly && e.currentHp > 0);
    const enemiesAlive = this.entities.filter(e => !e.isAlly && e.currentHp > 0);
    const injured = this.entities.filter(e => e.isAlly && e.currentHp <= 0).map(e => e.id);

    let outcome: CombatOutcome;
    if (enemiesAlive.length === 0) {
      outcome = injured.length === 0 ? 'victory' : 'partial-victory';
    } else {
      outcome = 'full-wipe';
    }

    return {
      outcome,
      ticks: this.ticks,
      survivors: alliesAlive.map(e => e.id),
      injured,
      totalDamageDealt: this.totalDamageDealt,
      durationMs: this.time,
    };
  }

  // --- Private methods ---

  private processLogicTick(): void {
    for (const entity of this.entities) {
      if (entity.currentHp <= 0) continue;

      // Revert animState if duration expired
      if (entity.animStateUntil > 0 && this.time >= entity.animStateUntil) {
        entity.animState = 'idle';
        entity.animStateUntil = 0;
      }

      this.processEntityTick(entity);
    }
  }

  private processEntityTick(entity: ArenaEntity): void {
    // Refresh conditional passive buffs
    if (entity.passiveState) applyPassiveTick(entity);

    // Apply status effects (poison, stun)
    const effectResult = applyEffectTick(entity);
    if (effectResult.damage > 0) {
      entity.currentHp -= effectResult.damage;
      this.eventQueue.push({ type: 'effect-tick', targetId: entity.id, effect: 'poison', damage: effectResult.damage });
      if (entity.currentHp <= 0) {
        entity.animState = 'dead';
        this.eventQueue.push({ type: 'death', entityId: entity.id });
        return;
      }
    }
    if (effectResult.skipTurn) return;

    // Find target
    const target = findTarget(entity, this.entities);
    if (!target) {
      entity.animState = 'idle';
      return;
    }
    entity.targetId = target.id;

    // Check distance vs attack range
    const dist = getDistance(entity, target);
    if (dist > entity.attackRange) {
      // Move toward target
      moveToward(entity, target.position, entity.attackRange * 0.9, LOGIC_TICK_MS / 1000);
      if (entity.animState !== 'attacking' && entity.animState !== 'skill') {
        entity.animState = 'walking';
      }
      return;
    }

    // In range — auto-attack if ready
    if (this.time >= entity.nextAttackAt) {
      this.tryAttack(entity, target);
    }

    // Skill activation
    if (entity.isAlly && this.pendingSkills.has(entity.id)) {
      this.trySkill(entity, target);
      this.pendingSkills.delete(entity.id);
    } else if (!entity.isAlly && entity.skill && entity.skill.autoEnabled && this.time >= entity.skillCooldownUntil) {
      this.trySkill(entity, target);
    }
  }

  private tryAttack(entity: ArenaEntity, target: ArenaEntity): void {
    // Dodge check (ThienLu passive)
    if (rollPassiveDodge(target.civilization)) {
      this.eventQueue.push({ type: 'dodge', attackerId: entity.id, targetId: target.id });
      entity.nextAttackAt = this.time + entity.attackIntervalMs;
      return;
    }

    let damage = calcAutoAttackDamage(entity.stats.STR, target.stats.END);
    // Boosted status gives +20% damage
    if (entity.statusEffects.some(e => e.type === 'boosted')) {
      damage = Math.floor(damage * 1.2);
    }
    const isCrit = rollCrit(entity.stats.LCK);
    if (isCrit) damage = Math.floor(damage * CRIT_MULTIPLIER);

    target.currentHp -= damage;
    this.totalDamageDealt += entity.isAlly ? damage : 0;
    this.eventQueue.push({ type: 'auto-attack', attackerId: entity.id, targetId: target.id, damage, isCrit });
    entity.nextAttackAt = this.time + entity.attackIntervalMs;

    // Anim states
    entity.animState = 'attacking';
    entity.animStateUntil = this.time + ANIM_ATTACK_DURATION;
    if (target.currentHp > 0) {
      target.animState = 'hit';
      target.animStateUntil = this.time + 200;
    }

    // Track passive stacks
    if (entity.passiveState) onDamageDealt(entity.passiveState);

    if (target.currentHp <= 0) {
      target.animState = 'dead';
      this.eventQueue.push({ type: 'death', entityId: target.id });
    }

    // Process enemy abilities (poison, stun, enrage, heal) — only if target survived
    if (target.currentHp > 0) {
      processAbilities(entity, this.entities, this.eventQueue);
    }
  }

  private trySkill(entity: ArenaEntity, target: ArenaEntity): void {
    if (!entity.skill) return;
    if (entity.level < 5) return;
    if (this.time < entity.skillCooldownUntil) return;

    const baseDmg = calcAutoAttackDamage(entity.stats.STR, target.stats.END);
    const isCrit = rollCrit(entity.stats.LCK);
    let skillDmg = calcSkillDamage(baseDmg, entity.skill.damageMultiplier, entity.stats.DEX);
    if (isCrit) skillDmg = Math.floor(skillDmg * CRIT_MULTIPLIER);

    target.currentHp -= skillDmg;
    this.totalDamageDealt += entity.isAlly ? skillDmg : 0;
    this.eventQueue.push({ type: 'skill-use', attackerId: entity.id, targetId: target.id, damage: skillDmg, skillName: entity.skill.name, isCrit });
    entity.skillCooldownUntil = this.time + entity.skill.cooldownMs;

    // Anim
    entity.animState = 'skill';
    entity.animStateUntil = this.time + 400;

    if (entity.passiveState) onDamageDealt(entity.passiveState);

    if (target.currentHp <= 0) {
      target.animState = 'dead';
      this.eventQueue.push({ type: 'death', entityId: target.id });
    }
  }

  private checkVictoryCondition(): void {
    const alliesAlive = this.entities.some(e => e.isAlly && e.currentHp > 0);
    const enemiesAlive = this.entities.some(e => !e.isAlly && e.currentHp > 0);

    if (!enemiesAlive) {
      this.eventQueue.push({ type: 'victory' });
      this.finished = true;
    } else if (!alliesAlive) {
      this.eventQueue.push({ type: 'wipe' });
      this.finished = true;
    }
  }

}
