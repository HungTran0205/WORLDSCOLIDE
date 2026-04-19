/**
 * CombatEngine — real-time combat driver for the auto-battler arena.
 * Mutable state, tick(dt) advances combat, activateSkill(id) for player input.
 * Reuses all existing formulas/effects/passives — zero duplication with simulateCombat.
 */

import type { Member, InventoryState } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';
import type { CombatEvent, CombatTick, CombatResult, CombatOutcome } from './combat-types';
import type { ArenaEntity, Formation } from './combat-arena-types';
import { getFormationPosition, isRangedArchetype } from './combat-arena-types';
import { calcAutoAttackDamage, calcSkillDamage, rollCrit } from './combat-formulas';
import { applyEffectTick } from './combat-effects';
import {
  applyPassiveTick, onDamageDealt,
  consumeShock, activateTeamBuff, isTeamBuffActive,
  resolveThienLuTimers, isCloneActive,
} from './combat-passives';
import { findTarget, stepForwardToAttack, returnToHome, processAbilities } from './combat-ai';
import { memberToArenaEntity, enemyToArenaEntity } from './combat-entity-factory';

const LOGIC_TICK_MS = 100;
const MAX_COMBAT_MS = 120_000; // 2 min hard cap
// 8 frames @ 12fps = 667ms. With strict-> expiry check, animState persists one
// extra tick (100ms) past this value, so effective display = 600 + 100 = 700ms.
const ANIM_ATTACK_DURATION = 600;

export class CombatEngine {
  entities: ArenaEntity[] = [];
  time = 0;
  /** Called when all enemies are dead — return true if more waves exist */
  onWaveCheck?: () => boolean;
  /** Manual mode: allies wait for player input before attacking */
  manualMode = false;
  private accumulator = 0;
  private eventQueue: CombatEvent[] = [];
  private ticks: CombatTick[] = [];
  private totalDamageDealt = 0;
  private finished = false;
  private pendingSkills: Set<string> = new Set();
  private pendingAttacks: Set<string> = new Set();
  private nextEnemyIndex = 0;
  /** Total syringes loaded across all ally entities at init — for inventory deduction by caller */
  totalSyringesLoaded = 0;

  /** Initialize combat from formation + enemies */
  init(
    members: Member[],
    formation: Formation,
    enemyTemplates: EnemyTemplate[],
    hpMultiplier = 1,
    inventory?: InventoryState,
  ): void {
    this.entities = [];
    this.time = 0;
    this.accumulator = 0;
    this.ticks = [];
    this.totalDamageDealt = 0;
    this.finished = false;
    this.pendingSkills.clear();
    this.pendingAttacks.clear();
    this.manualMode = false;
    this.eventQueue = [];
    this.nextEnemyIndex = 0;
    this.totalSyringesLoaded = 0;

    // Distribute available syringes evenly among formation members who have loadout configured
    const formationMembers = formation
      .filter(Boolean)
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is Member => !!m && !!m.syringeLoadout);
    const totalSyringes = inventory?.items.HEALING_SYRINGE ?? 0;
    const syringeShare = formationMembers.length > 0
      ? Math.floor(totalSyringes / formationMembers.length)
      : 0;
    const syringeMap = new Map<string, number>(
      formationMembers.map((m) => [m.id, syringeShare]),
    );
    this.totalSyringesLoaded = syringeShare * formationMembers.length;

    // Place allies from formation
    formation.forEach((memberId, slotIndex) => {
      if (!memberId) return;
      const member = members.find(m => m.id === memberId);
      if (!member) return;
      const pos = getFormationPosition(slotIndex, 'ally');
      this.entities.push(memberToArenaEntity(member, pos, syringeMap.get(member.id) ?? 0));
    });

    // Place enemies with optional hp scaling
    enemyTemplates.forEach((tmpl, i) => {
      const slotIndex = i % 6;
      const pos = getFormationPosition(slotIndex, 'enemy');
      this.entities.push(enemyToArenaEntity(tmpl, this.nextEnemyIndex++, pos, hpMultiplier));
    });
  }

  /** Spawn new enemies mid-combat (wave transition) */
  addEnemies(templates: EnemyTemplate[], xOffset: number, hpMultiplier: number): void {
    templates.forEach((tmpl, i) => {
      const slotIndex = i % 6;
      const pos = getFormationPosition(slotIndex, 'enemy');
      pos.x += xOffset;
      this.entities.push(enemyToArenaEntity(tmpl, this.nextEnemyIndex++, pos, hpMultiplier));
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
      this.checkVictoryCondition();

      if (this.eventQueue.length > 0) {
        this.ticks.push({ time: this.time, events: [...this.eventQueue] });
        frameEvents.push(...this.eventQueue);
      }

      if (this.time >= MAX_COMBAT_MS) this.finished = true;
    }

    return frameEvents;
  }

  /** Player activates a member's skill — queued for next logic tick */
  activateSkill(memberId: string): void {
    this.pendingSkills.add(memberId);
  }

  /** Toggle manual mode — allies wait for player input each attack cycle */
  setManualMode(on: boolean): void { this.manualMode = on; }

  /** Queue a basic attack for a waiting ally (manual mode) */
  queueAttack(memberId: string): void { this.pendingAttacks.add(memberId); }

  /** Set a specific manual target for an ally (manual mode) */
  setManualTarget(allyId: string, enemyId: string | null): void {
    const ally = this.entities.find(e => e.id === allyId && e.isAlly);
    if (ally) ally.manualTargetId = enemyId;
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

      // Revert animState if duration expired.
      // Use strict > (not >=) to avoid same-tick collision: if attack expires at T=800
      // and enemy also attacks at T=800, the ally stays 'attacking' for that tick,
      // preventing hit-state from overriding right as the animation finishes.
      if (entity.animStateUntil > 0 && this.time > entity.animStateUntil) {
        entity.animState = 'battle-idle';
        entity.animStateUntil = 0;
      }

      this.processEntityTick(entity);
    }
  }

  /** Resolve attack target: manual target first (if valid), else findTarget */
  private resolveTarget(entity: ArenaEntity): ArenaEntity | null {
    if (entity.isAlly && this.manualMode && entity.manualTargetId) {
      const manual = this.entities.find(e => e.id === entity.manualTargetId);
      if (manual && manual.currentHp > 0 && manual.isAlly !== entity.isAlly) return manual;
      entity.manualTargetId = null;
    }
    return findTarget(entity, this.entities);
  }

  private processEntityTick(entity: ArenaEntity): void {
    // Refresh conditional passive buffs
    if (entity.passiveState) applyPassiveTick(entity);

    // DeQuoc team buff flag — set by nearby alive ally with active buff
    const deQuocAlly = this.entities.find(e =>
      e.isAlly === entity.isAlly &&
      e.passiveState?.civId === 'DeQuoc' &&
      isTeamBuffActive(e.passiveState, this.time) &&
      e.currentHp > 0,
    );
    entity._hasDeQuocBuff = !!(deQuocAlly && entity.id !== deQuocAlly.id);

    // Syringe auto-use: fire when HP < threshold and syringes remain
    if (
      entity.isAlly &&
      entity.syringesLoaded !== undefined && entity.syringesLoaded > 0 &&
      entity.syringeThresholdPct !== undefined &&
      entity.currentHp / entity.maxHp < entity.syringeThresholdPct
    ) {
      const healAmt = Math.floor(entity.maxHp * 0.30);
      entity.currentHp = Math.min(entity.maxHp, entity.currentHp + healAmt);
      entity.syringesLoaded -= 1;
      this.eventQueue.push({ type: 'syringe-used', entityId: entity.id, healAmount: healAmt });
    }

    // HP regen tick
    if (entity.hpRegenPerSec > 0) {
      const regen = Math.round(entity.hpRegenPerSec * LOGIC_TICK_MS / 1000);
      if (regen > 0 && entity.currentHp < entity.maxHp) {
        const healed = Math.min(regen, entity.maxHp - entity.currentHp);
        entity.currentHp += healed;
        this.eventQueue.push({ type: 'heal', healerId: entity.id, targetId: entity.id, amount: healed });
      }
    }

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
    if (effectResult.skipTurn) {
      // Snap to home on stun to prevent freezing mid-lerp
      entity.position.x = entity.homeX;
      entity.position.z = entity.homeZ;
      entity.attackMoveState = 'home';
      return;
    }

    // Find target (respects manual target in manual mode)
    const target = this.resolveTarget(entity);
    if (!target) {
      entity.animState = 'battle-idle';
      return;
    }
    entity.targetId = target.id;

    const dtSeconds = LOGIC_TICK_MS / 1000;

    if (isRangedArchetype(entity.archetype)) {
      // Ranged: attack from home — no movement
      if (this.time >= entity.nextAttackAt) {
        if (entity.isAlly && this.manualMode) {
          if (this.pendingAttacks.has(entity.id)) {
            this.pendingAttacks.delete(entity.id);
            entity.waitingForInput = false;
            this.tryAttack(entity, target);
          } else if (this.pendingSkills.has(entity.id)) {
            entity.waitingForInput = false;
            // skill fires in the skill section below
          } else {
            entity.waitingForInput = true;
            entity.animState = 'battle-idle';
          }
        } else {
          entity.waitingForInput = false;
          this.tryAttack(entity, target);
        }
      } else {
        entity.waitingForInput = false;
      }
    } else {
      // Melee: formation step-attack state machine
      switch (entity.attackMoveState) {
        case 'home': {
          if (this.time >= entity.nextAttackAt) {
            if (entity.isAlly && this.manualMode) {
              if (this.pendingAttacks.has(entity.id)) {
                this.pendingAttacks.delete(entity.id);
                entity.waitingForInput = false;
                entity.stepTargetX = target.position.x + (entity.isAlly ? -1 : 1) * entity.attackRange * 0.8;
                entity.stepTargetZ = target.position.z;
                entity.attackMoveState = 'step-forward';
                entity.animState = 'walking';
              } else if (this.pendingSkills.has(entity.id)) {
                entity.waitingForInput = false;
                // skill fires below; stay at home
              } else {
                entity.waitingForInput = true;
                entity.animState = 'battle-idle';
              }
            } else {
              entity.waitingForInput = false;
              entity.stepTargetX = target.position.x + (entity.isAlly ? -1 : 1) * entity.attackRange * 0.8;
              entity.stepTargetZ = target.position.z;
              entity.attackMoveState = 'step-forward';
              entity.animState = 'walking';
            }
          } else {
            entity.waitingForInput = false;
          }
          break;
        }
        case 'step-forward': {
          const arrived = stepForwardToAttack(entity, dtSeconds);
          if (arrived) {
            this.tryAttack(entity, target);
            entity.attackMoveState = 'returning';
          }
          break;
        }
        case 'returning': {
          const atHome = returnToHome(entity, dtSeconds);
          if (atHome) {
            entity.attackMoveState = 'home';
            entity.animState = 'battle-idle';
          }
          break;
        }
      }
    }

    // Skill activation (all entity types)
    if (entity.isAlly && this.pendingSkills.has(entity.id)) {
      this.trySkill(entity, target);
      this.pendingSkills.delete(entity.id);
    } else if (!entity.isAlly && entity.skill && entity.skill.autoEnabled && this.time >= entity.skillCooldownUntil) {
      this.trySkill(entity, target);
    }

    // ThienLu Tinh Lo clone hit — extra auto-attack each tick while clone is active
    if (entity.passiveState && isCloneActive(entity.passiveState, this.time)) {
      const cloneTarget = findTarget(entity, this.entities);
      if (cloneTarget && cloneTarget.currentHp > 0) {
        let cloneDmg = calcAutoAttackDamage(entity.stats.STR, cloneTarget.stats.END);
        const cloneCrit = rollCrit(entity.stats.LCK);
        if (cloneCrit) cloneDmg = Math.floor(cloneDmg * entity.critDmg);
        cloneTarget.currentHp -= cloneDmg;
        this.totalDamageDealt += entity.isAlly ? cloneDmg : 0;
        this.eventQueue.push({
          type: 'auto-attack',
          attackerId: `${entity.id}-clone`,
          targetId: cloneTarget.id,
          damage: cloneDmg,
          isCrit: cloneCrit,
        });
        if (cloneTarget.currentHp <= 0) {
          cloneTarget.animState = 'dead';
          this.eventQueue.push({ type: 'death', entityId: cloneTarget.id });
        }
      }
    }
  }

  private tryAttack(entity: ArenaEntity, target: ArenaEntity): void {
    // Generic stat-derived dodge check
    if (target.dodgeRate > 0 && Math.random() < target.dodgeRate) {
      this.eventQueue.push({ type: 'dodge', attackerId: entity.id, targetId: target.id });
      entity.nextAttackAt = this.time + entity.attackIntervalMs;
      return;
    }

    let damage = calcAutoAttackDamage(entity.stats.STR, target.stats.END);
    // Boosted status gives +20% damage
    if (entity.statusEffects.some(e => e.type === 'boosted')) {
      damage = Math.floor(damage * 1.2);
    }
    let isCrit = rollCrit(entity.stats.LCK);
    // ThienLu Tinh Lo crit bonus (+15% when tier 1 active)
    if (!isCrit && (entity.passiveState?.critBonus ?? 0) > 0) {
      isCrit = Math.random() < entity.passiveState!.critBonus;
    }
    // DeQuoc team buff crit bonus (+5%)
    if (!isCrit && entity._hasDeQuocBuff) {
      isCrit = Math.random() < 0.05;
    }
    if (isCrit) damage = Math.floor(damage * entity.critDmg);
    // DeQuoc team buff damage bonus (+5%)
    if (entity._hasDeQuocBuff) damage = Math.floor(damage * 1.05);

    // Block check (50% damage reduction on proc)
    let blocked = false;
    if (target.blockRate > 0 && Math.random() < target.blockRate) {
      const reducedDamage = Math.max(1, Math.floor(damage * 0.5));
      this.eventQueue.push({ type: 'block', attackerId: entity.id, targetId: target.id, reducedDamage });
      damage = reducedDamage;
      blocked = true;
    }

    target.currentHp -= damage;
    this.totalDamageDealt += entity.isAlly ? damage : 0;
    this.eventQueue.push({ type: 'auto-attack', attackerId: entity.id, targetId: target.id, damage, isCrit });
    entity.nextAttackAt = this.time + entity.attackIntervalMs;

    // Anim states
    entity.animState = 'attacking';
    entity.animStateUntil = this.time + ANIM_ATTACK_DURATION;
    // Block animation has highest priority — overrides attacking/skill so the
    // player actually sees the defensive reaction. Hit still defers to ongoing
    // attack/skill swings to avoid interrupting player animations.
    if (target.currentHp > 0 && target.animState !== 'dead') {
      if (blocked) {
        target.animState = 'blocking';
        target.animStateUntil = this.time + 400;
      } else if (
        target.animState !== 'blocking' &&
        target.animState !== 'attacking' &&
        target.animState !== 'skill'
      ) {
        target.animState = 'hit';
        target.animStateUntil = this.time + 200;
      }
    }

    // Track passive stacks
    if (entity.passiveState) onDamageDealt(entity.passiveState);

    // DeQuoc Shock application — apply shocked debuff to target + activate team buff
    if (entity.passiveState && consumeShock(entity.passiveState)) {
      if (!target.statusEffects.some(e => e.type === 'shocked')) {
        target.statusEffects.push({ type: 'shocked', ticksRemaining: 1 });
        this.eventQueue.push({ type: 'effect-applied', targetId: target.id, effect: 'shocked' });
      }
      activateTeamBuff(entity.passiveState, this.time);
      this.eventQueue.push({ type: 'effect-applied', targetId: entity.id, effect: 'team-buff' });
    }

    // ThienLu timer resolution (crit bonus + clone activation/expiry)
    if (entity.passiveState?.civId === 'ThienLu') {
      const result = resolveThienLuTimers(entity.passiveState, this.time);
      if (result.cloneActivated) {
        this.eventQueue.push({ type: 'effect-applied', targetId: entity.id, effect: 'clone-activated' });
      }
      if (result.critActivated) {
        this.eventQueue.push({ type: 'effect-applied', targetId: entity.id, effect: 'crit-boost' });
      }
    }

    if (target.currentHp <= 0) {
      target.animState = 'dead';
      this.eventQueue.push({ type: 'death', entityId: target.id });
      // Clear manual target references to this dead entity
      for (const e of this.entities) {
        if (e.manualTargetId === target.id) e.manualTargetId = null;
      }
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
    const isCrit2 = rollCrit(entity.stats.LCK);
    let skillDmg = calcSkillDamage(baseDmg, entity.skill.damageMultiplier, entity.stats.DEX);
    if (isCrit2) skillDmg = Math.floor(skillDmg * entity.critDmg);

    target.currentHp -= skillDmg;
    this.totalDamageDealt += entity.isAlly ? skillDmg : 0;
    this.eventQueue.push({ type: 'skill-use', attackerId: entity.id, targetId: target.id, damage: skillDmg, skillName: entity.skill.name, isCrit: isCrit2 });
    entity.skillCooldownUntil = this.time + entity.skill.cooldownMs;

    // Anim
    entity.animState = 'skill';
    entity.animStateUntil = this.time + ANIM_ATTACK_DURATION;

    if (entity.passiveState) {
      onDamageDealt(entity.passiveState);
      if (entity.passiveState.civId === 'ThienLu') {
        resolveThienLuTimers(entity.passiveState, this.time);
      }
    }

    if (target.currentHp <= 0) {
      target.animState = 'dead';
      this.eventQueue.push({ type: 'death', entityId: target.id });
    }
  }

  private checkVictoryCondition(): void {
    const alliesAlive = this.entities.some(e => e.isAlly && e.currentHp > 0);
    const enemiesAlive = this.entities.some(e => !e.isAlly && e.currentHp > 0);

    if (!enemiesAlive) {
      if (this.onWaveCheck?.()) {
        // More waves pending — emit wave-cleared, controller handles spawn
        this.eventQueue.push({ type: 'wave-cleared', waveIndex: -1 });
        return;
      }
      this.eventQueue.push({ type: 'victory' });
      this.finished = true;
    } else if (!alliesAlive) {
      this.eventQueue.push({ type: 'wipe' });
      this.finished = true;
    }
  }

}
