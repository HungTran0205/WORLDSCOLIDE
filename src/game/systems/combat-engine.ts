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

// Back animation: 4 frames @ 12fps = 333ms, effective 300ms + engine granularity
const WARRIOR_BACK_DURATION = 300;
// Warrior jumps this far from home toward enemy (world units).
// At step speed 6 u/s: 3.5 u → ~583ms forward; fits inside attack anim (600ms).
const WARRIOR_JUMP_DISTANCE = 3.5;

export class CombatEngine {
  entities: ArenaEntity[] = [];
  time = 0;
  /** Called when all enemies are dead — return true if more waves exist */
  onWaveCheck?: () => boolean;
  /** Manual mode: allies wait for player input before attacking */
  manualMode = false;
  /** Manual mode: which ally's turn is currently paused for player input */
  pausedForAllyTurn: string | null = null;
  private accumulator = 0;
  private eventQueue: CombatEvent[] = [];
  private ticks: CombatTick[] = [];
  private totalDamageDealt = 0;
  private finished = false;
  private pendingSkills: Set<string> = new Set();
  private pendingAttacks: Set<string> = new Set();
  private nextEnemyIndex = 0;
  /** Sequential turn lock — id of entity currently executing its full action cycle, or null if queue is idle */
  private activeActorId: string | null = null;
  /** Total syringes loaded across all ally entities at init */
  totalSyringesLoaded = 0;
  /** Syringes actually consumed during combat — deduct this from inventory at combat end */
  syringesConsumed = 0;

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
    this.activeActorId = null;
    this.manualMode = false;
    this.pausedForAllyTurn = null;
    this.eventQueue = [];
    this.nextEnemyIndex = 0;
    this.totalSyringesLoaded = 0;
    this.syringesConsumed = 0;

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

    // All entities start in combat stance (not frozen idle)
    for (const entity of this.entities) {
      entity.animState = 'battle-idle';
    }
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

    // EC-3: manual mode turned OFF while paused — clear pause state so enemies aren't frozen
    if (!this.manualMode && this.pausedForAllyTurn !== null) {
      const ally = this.entities.find(e => e.id === this.pausedForAllyTurn);
      if (ally) ally.waitingForInput = false;
      this.pausedForAllyTurn = null;
    }

    // Manual mode pause: freeze entire engine while waiting for player action
    if (this.manualMode && this.pausedForAllyTurn !== null) {
      const pausedAlly = this.entities.find(e => e.id === this.pausedForAllyTurn && e.currentHp > 0);
      if (!pausedAlly) {
        // Ally died while waiting — auto-clear and resume
        this.pausedForAllyTurn = null;
      } else if (
        !this.pendingAttacks.has(pausedAlly.id) &&
        !this.pendingSkills.has(pausedAlly.id)
      ) {
        // Still waiting for player — freeze time entirely (enemies don't attack)
        return [];
      } else {
        // Player has acted — clear pause and fall through to process
        this.pausedForAllyTurn = null;
        pausedAlly.waitingForInput = false;
      }
    }

    this.accumulator += dt;
    const frameEvents: CombatEvent[] = [];

    while (this.accumulator >= LOGIC_TICK_MS && !this.finished) {
      this.accumulator -= LOGIC_TICK_MS;
      this.time += LOGIC_TICK_MS;
      this.eventQueue = [];

      this.processLogicTick();
      this.checkVictoryCondition();

      // After tick: detect if an ally's turn just fired (manual mode)
      if (this.manualMode && this.pausedForAllyTurn === null) {
        const waitingAlly = this.entities
          .filter(e => e.isAlly && e.currentHp > 0 && e.waitingForInput)
          .sort((a, b) => a.nextAttackAt - b.nextAttackAt)[0] ?? null;
        if (waitingAlly) {
          this.pausedForAllyTurn = waitingAlly.id;
          this.eventQueue.push({ type: 'ally-turn-start', entityId: waitingAlly.id });
        }
      }

      if (this.eventQueue.length > 0) {
        this.ticks.push({ time: this.time, events: [...this.eventQueue] });
        frameEvents.push(...this.eventQueue);
      }

      if (this.time >= MAX_COMBAT_MS) this.finished = true;

      // Break while loop immediately when we just paused for a turn
      if (this.manualMode && this.pausedForAllyTurn !== null) break;
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

  getPausedForAllyTurn(): string | null { return this.pausedForAllyTurn; }

  getActiveActorId(): string | null { return this.activeActorId; }

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
    // Phase A: status tick for ALL alive entities (poison, regen, passives, anim revert)
    const stunnedThisTick = new Set<string>();
    for (const entity of this.entities) {
      if (entity.currentHp <= 0) continue;
      const { stunned } = this.processEntityStatus(entity);
      if (stunned) stunnedThisTick.add(entity.id);
    }

    // Phase B: if active actor exists, continue its movement; don't start new actions this tick
    if (this.activeActorId !== null) {
      const actor = this.entities.find(e => e.id === this.activeActorId);
      if (!actor || actor.currentHp <= 0) {
        this.activeActorId = null;
      } else if (stunnedThisTick.has(actor.id)) {
        // Actor stunned while holding lock — skip turn, release lock
        actor.nextAttackAt = this.time + actor.attackIntervalMs;
        actor.attackMoveState = 'home';
        this.activeActorId = null;
      } else if (this.isActorDone(actor)) {
        this.activeActorId = null;
      } else {
        this.processActorMovement(actor);
        return;
      }
    }

    // Phase C: select next actor — lowest nextAttackAt among entities ready to act
    const candidates = this.entities
      .filter(e => e.currentHp > 0 && this.time >= e.nextAttackAt)
      .sort((a, b) => {
        if (a.nextAttackAt !== b.nextAttackAt) return a.nextAttackAt - b.nextAttackAt;
        // Tie-break: allies act first for better player feel
        if (a.isAlly !== b.isAlly) return a.isAlly ? -1 : 1;
        return a.id.localeCompare(b.id);
      });

    const nextActor = candidates[0];
    if (!nextActor) return;

    // Stun: skip turn, advance timer, release lock
    if (stunnedThisTick.has(nextActor.id)) {
      nextActor.nextAttackAt = this.time + nextActor.attackIntervalMs;
      nextActor.attackMoveState = 'home';
      return;
    }

    this.processEntityAction(nextActor);
    if (nextActor.waitingForInput) return;
    if (!this.isActorDone(nextActor)) {
      this.activeActorId = nextActor.id;
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

  /** Status side-effects for all alive entities each tick: passives, syringe, regen, poison/stun */
  private processEntityStatus(entity: ArenaEntity): { dead: boolean; stunned: boolean } {
    // Revert animState if duration expired.
    // Use strict > (not >=) to avoid same-tick collision: if attack expires at T=800
    // and enemy also attacks at T=800, the ally stays 'attacking' for that tick.
    if (entity.animStateUntil > 0 && this.time > entity.animStateUntil) {
      if (entity.animState === 'attacking' && entity.archetype === 'warrior') {
        // Warrior: after 8-frame jump attack, play return-jump animation
        entity.animState = 'back';
        entity.animStateUntil = this.time + WARRIOR_BACK_DURATION;
      } else {
        entity.animState = 'battle-idle';
        entity.animStateUntil = 0;
      }
    }

    if (entity.passiveState) applyPassiveTick(entity);

    const deQuocAlly = this.entities.find(e =>
      e.isAlly === entity.isAlly &&
      e.passiveState?.civId === 'DeQuoc' &&
      isTeamBuffActive(e.passiveState, this.time) &&
      e.currentHp > 0,
    );
    entity._hasDeQuocBuff = !!(deQuocAlly && entity.id !== deQuocAlly.id);

    if (
      entity.isAlly &&
      entity.syringesLoaded !== undefined && entity.syringesLoaded > 0 &&
      entity.syringeThresholdPct !== undefined &&
      entity.currentHp / entity.maxHp < entity.syringeThresholdPct
    ) {
      const healAmt = Math.floor(entity.maxHp * 0.30);
      entity.currentHp = Math.min(entity.maxHp, entity.currentHp + healAmt);
      entity.syringesLoaded -= 1;
      this.syringesConsumed += 1;
      this.eventQueue.push({ type: 'syringe-used', entityId: entity.id, healAmount: healAmt });
    }

    if (entity.hpRegenPerSec > 0) {
      const regen = Math.round(entity.hpRegenPerSec * LOGIC_TICK_MS / 1000);
      if (regen > 0 && entity.currentHp < entity.maxHp) {
        const healed = Math.min(regen, entity.maxHp - entity.currentHp);
        entity.currentHp += healed;
        this.eventQueue.push({ type: 'heal', healerId: entity.id, targetId: entity.id, amount: healed });
      }
    }

    const effectResult = applyEffectTick(entity);
    if (effectResult.damage > 0) {
      entity.currentHp -= effectResult.damage;
      this.eventQueue.push({ type: 'effect-tick', targetId: entity.id, effect: 'poison', damage: effectResult.damage });
      if (entity.currentHp <= 0) {
        entity.animState = 'dead';
        entity.attackMoveState = 'home';
        this.eventQueue.push({ type: 'death', entityId: entity.id });
        return { dead: true, stunned: false };
      }
    }
    if (effectResult.skipTurn) {
      entity.position.x = entity.homeX;
      entity.position.z = entity.homeZ;
      entity.attackMoveState = 'home';
    }

    return { dead: false, stunned: effectResult.skipTurn };
  }

  /** Advance melee step-forward/returning movement for the active turn owner only */
  private processActorMovement(actor: ArenaEntity): void {
    if (isRangedArchetype(actor.archetype)) return;

    const dtSeconds = LOGIC_TICK_MS / 1000;
    const isWarrior = actor.archetype === 'warrior';

    if (actor.attackMoveState === 'step-forward') {
      const target = this.resolveTarget(actor);
      const arrived = stepForwardToAttack(actor, dtSeconds);
      if (arrived) {
        if (target && target.currentHp > 0) {
          if (isWarrior) {
            // Warrior: animState/nextAttackAt already set by initiateWarriorJump; just deal damage on arrival
            if (target.dodgeRate > 0 && Math.random() < target.dodgeRate) {
              this.eventQueue.push({ type: 'dodge', attackerId: actor.id, targetId: target.id });
            } else {
              this.dealDamage(actor, target);
            }
          } else {
            this.tryAttack(actor, target);
          }
        }
        actor.attackMoveState = 'returning';
      }
    } else if (actor.attackMoveState === 'returning') {
      // Warrior stays at midpoint until attack anim expires; processEntityStatus then starts 'back'
      if (isWarrior && actor.animState === 'attacking') return;
      const atHome = returnToHome(actor, dtSeconds);
      if (atHome) {
        actor.attackMoveState = 'home';
        if (!isWarrior) actor.animState = 'battle-idle';
      }
    }
  }

  /** Initiate action for the entity selected as the next turn owner */
  private processEntityAction(entity: ArenaEntity): void {
    const target = this.resolveTarget(entity);
    if (!target) {
      entity.animState = 'battle-idle';
      return;
    }
    entity.targetId = target.id;

    const hasPendingAttack = this.pendingAttacks.has(entity.id);
    const hasPendingSkill = this.pendingSkills.has(entity.id);

    if (entity.isAlly && this.manualMode) {
      if (!hasPendingAttack && !hasPendingSkill) {
        entity.waitingForInput = true;
        entity.animState = 'battle-idle';
        return;
      }
      entity.waitingForInput = false;
    } else {
      entity.waitingForInput = false;
    }

    if (isRangedArchetype(entity.archetype)) {
      if (entity.isAlly && this.manualMode) {
        if (hasPendingAttack) {
          this.pendingAttacks.delete(entity.id);
          this.tryAttack(entity, target);
        }
        // only pendingSkill: don't auto-attack, skill fires below
      } else {
        this.tryAttack(entity, target);
      }
    } else if (entity.archetype === 'warrior') {
      // Warrior: jump forward to enemy with attack animation, deal damage on arrival
      if (entity.isAlly && this.manualMode) {
        if (hasPendingAttack) {
          this.pendingAttacks.delete(entity.id);
          this.initiateWarriorJump(entity, target);
        }
        // only pendingSkill: stay at home, skill fires below
      } else {
        this.initiateWarriorJump(entity, target);
      }
    } else {
      // Standard melee: initiate step-forward
      if (entity.isAlly && this.manualMode) {
        if (hasPendingAttack) {
          this.pendingAttacks.delete(entity.id);
          entity.stepTargetX = target.position.x + (entity.isAlly ? -1 : 1) * entity.attackRange * 0.8;
          entity.stepTargetZ = target.position.z;
          entity.attackMoveState = 'step-forward';
          entity.animState = 'walking';
        }
        // only pendingSkill: stay at home, skill fires below
      } else {
        entity.stepTargetX = target.position.x + (entity.isAlly ? -1 : 1) * entity.attackRange * 0.8;
        entity.stepTargetZ = target.position.z;
        entity.attackMoveState = 'step-forward';
        entity.animState = 'walking';
      }
    }

    if (entity.isAlly && this.pendingSkills.has(entity.id)) {
      this.trySkill(entity, target);
      this.pendingSkills.delete(entity.id);
    } else if (!entity.isAlly && entity.skill && entity.skill.autoEnabled && this.time >= entity.skillCooldownUntil) {
      this.trySkill(entity, target);
    }

    // ThienLu clone extra-hit — once per turn
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

  /** True when the turn owner has completed its full action cycle and the lock can be released */
  private isActorDone(actor: ArenaEntity): boolean {
    if (isRangedArchetype(actor.archetype)) {
      return actor.animState !== 'attacking' && actor.animState !== 'skill';
    }
    if (actor.archetype === 'warrior') {
      // Done when physically home (same as standard melee); back anim may still play after
      return actor.attackMoveState === 'home';
    }
    return actor.attackMoveState === 'home';
  }

  /** Warrior jump-forward attack: hop toward enemy midpoint, animation plays once, then back home */
  private initiateWarriorJump(entity: ArenaEntity, _target: ArenaEntity): void {
    const dir = entity.isAlly ? 1 : -1;
    entity.stepTargetX = entity.homeX + dir * WARRIOR_JUMP_DISTANCE;
    entity.stepTargetZ = entity.homeZ;
    entity.attackMoveState = 'step-forward';
    entity.animState = 'attacking';
    entity.animStateUntil = this.time + ANIM_ATTACK_DURATION;
    entity.nextAttackAt = this.time + entity.attackIntervalMs;
  }

  private tryAttack(entity: ArenaEntity, target: ArenaEntity): void {
    // Generic stat-derived dodge check
    if (target.dodgeRate > 0 && Math.random() < target.dodgeRate) {
      this.eventQueue.push({ type: 'dodge', attackerId: entity.id, targetId: target.id });
      entity.nextAttackAt = this.time + entity.attackIntervalMs;
      return;
    }

    this.dealDamage(entity, target);
    entity.nextAttackAt = this.time + entity.attackIntervalMs;
    entity.animState = 'attacking';
    entity.animStateUntil = this.time + ANIM_ATTACK_DURATION;
  }

  /** Apply damage, passive effects, and target reactions — no nextAttackAt/animState changes */
  private dealDamage(entity: ArenaEntity, target: ArenaEntity): void {
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
