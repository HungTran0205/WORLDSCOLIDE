/**
 * CombatEngine — real-time combat driver for the auto-battler arena.
 * Mutable state, tick(dt) advances combat, activateSkill(id) for player input.
 * Reuses all existing formulas/effects/passives — zero duplication with simulateCombat.
 */

import type { Member, InventoryState } from '@/game/state/game-state';
import type { ItemID } from '@/game/data/items';
import type { EnemyTemplate } from '@/game/data/enemies';
import type { CombatEvent, CombatTick, CombatResult, CombatOutcome } from './combat-types';
import type { ArenaEntity, Formation, TargetPriority } from './combat-arena-types';
import { getFormationPosition, DEFAULT_TARGET_PRIORITY } from './combat-arena-types';
import type { CombatStageSpec } from '@/scene/combat/maps/stage-spec-types';
import { getStageSpawnPosition } from '@/scene/combat/maps/stage-formation-positions';
import type { ArenaSpawnPos } from './combat-entity-factory';
import { calcAutoAttackDamage, calcSkillDamage, rollCrit, SHIELD_DAMAGE_REDUCTION } from './combat-formulas';
import { applyEffectTick } from './combat-effects';
import {
  applyPassiveTick, onDamageDealt,
  consumeShock, activateTeamBuff, isTeamBuffActive,
  resolveThienLuTimers, isCloneActive, collectBlessedConsumed,
} from './combat-passives';
import { findTarget, processAbilities } from './combat-ai';
import { pickFocusPrimary } from './target-priority-resolver';
import { memberToArenaEntity, enemyToArenaEntity } from './combat-entity-factory';

/** Heal fraction applied per syringe type. HS1 baseline = 30%, HS2 = 50%, HS3 = 80%. */
const HEAL_FRACTION_BY_ITEM: Partial<Record<ItemID, number>> = {
  HEALING_SYRINGE:   0.30,
  HEALING_SYRINGE_2: 0.50,
  HEALING_SYRINGE_3: 0.80,
};

/** Ordered from highest to lowest tier — auto-pick walks this list to find the first owned. */
const SYRINGE_TIERS: ItemID[] = ['HEALING_SYRINGE_3', 'HEALING_SYRINGE_2', 'HEALING_SYRINGE'];

const LOGIC_TICK_MS = 100;
const MAX_COMBAT_MS = 120_000; // 2 min hard cap
/** Minimum screen-X from which new-wave enemies slide in (just off the right
 *  edge of the visible arena ≈ +12 at zoom 64/1536px). Renderer-only — no
 *  engine logic reads this value; it is stored as the cosmetic spawnSlideFromX. */
const OFFSCREEN_SLIDE_MIN_X = 14;
// 8 frames @ 12fps = 667ms. With strict-> expiry check, animState persists one
// extra tick (100ms) past this value, so effective display = 600 + 100 = 700ms.
const ANIM_ATTACK_DURATION = 600;

export class CombatEngine {
  entities: ArenaEntity[] = [];
  time = 0;
  /** Called when all enemies are dead — return true if more waves exist */
  onWaveCheck?: () => boolean;
  /** Team-level targeting strategy for ally AI (focus | balance) */
  targetPriority: TargetPriority = DEFAULT_TARGET_PRIORITY;
  /** Focus mode: shared primary target id for all allies (null = pick on next tick) */
  primaryTargetId: string | null = null;
  private accumulator = 0;
  private eventQueue: CombatEvent[] = [];
  private ticks: CombatTick[] = [];
  private totalDamageDealt = 0;
  private finished = false;
  private pendingSkills: Set<string> = new Set();
  private nextEnemyIndex = 0;
  /** Sequential turn lock — id of entity currently executing its full action cycle, or null if queue is idle */
  private activeActorId: string | null = null;
  /** Total syringes loaded across all ally entities at init */
  totalSyringesLoaded = 0;
  /** Syringes actually consumed during combat — deduct this from inventory at combat end */
  syringesConsumed = 0;
  /**
   * Which item tier was loaded this combat session. Highest-owned tier is auto-picked
   * at init; a full type-picker UI would set this explicitly (not yet implemented).
   */
  loadedSyringeItemId: ItemID = 'HEALING_SYRINGE';
  /** Per-entity loaded syringe heal fraction (keyed by entity id). Set at init. */
  private syringeHealFraction = new Map<string, number>();
  /** Active stage spec — drives spawn anchors (and y per platform). null →
   *  fallback to legacy FORMATION_POSITIONS (y=0). Set during init(). */
  private stageSpec: CombatStageSpec | null = null;
  /** Tutorial HP-floor (Phase 04). When true, ally entities are clamped to a
   *  minimum of 1 HP at every ally-damage site → the tutorial Moonbear fight is
   *  a guaranteed win. Set ONLY by CombatFightController for the tutorial
   *  mission; default false keeps every other fight byte-for-byte unchanged. */
  hpFloorActive = false;

  /** Initialize combat from formation + enemies */
  init(
    members: Member[],
    formation: Formation,
    enemyTemplates: EnemyTemplate[],
    hpMultiplier = 1,
    inventory?: InventoryState,
    stageSpec?: CombatStageSpec,
  ): void {
    this.entities = [];
    this.time = 0;
    this.accumulator = 0;
    this.ticks = [];
    this.totalDamageDealt = 0;
    this.finished = false;
    this.pendingSkills.clear();
    this.activeActorId = null;
    this.primaryTargetId = null;
    this.eventQueue = [];
    this.nextEnemyIndex = 0;
    this.totalSyringesLoaded = 0;
    this.syringesConsumed = 0;
    this.syringeHealFraction.clear();
    this.stageSpec = stageSpec ?? null;

    // Auto-pick highest-tier syringe the party owns. Full type-picker UI deferred.
    const loadedTier = SYRINGE_TIERS.find((id) => (inventory?.items[id] ?? 0) > 0)
      ?? 'HEALING_SYRINGE';
    this.loadedSyringeItemId = loadedTier;
    const healFrac = HEAL_FRACTION_BY_ITEM[loadedTier] ?? 0.30;

    // Distribute available syringes evenly among formation members who have loadout configured
    const formationMembers = formation
      .filter(Boolean)
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is Member => !!m && !!m.syringeLoadout);
    const totalSyringes = inventory?.items[loadedTier] ?? 0;
    const syringeShare = formationMembers.length > 0
      ? Math.floor(totalSyringes / formationMembers.length)
      : 0;
    const syringeMap = new Map<string, number>(
      formationMembers.map((m) => [m.id, syringeShare]),
    );
    this.totalSyringesLoaded = syringeShare * formationMembers.length;
    for (const m of formationMembers) {
      this.syringeHealFraction.set(m.id, healFrac);
    }

    // Place allies from formation
    formation.forEach((memberId, slotIndex) => {
      if (!memberId) return;
      const member = members.find(m => m.id === memberId);
      if (!member) return;
      const pos = this.resolveSpawn(slotIndex, 'ally');
      this.entities.push(memberToArenaEntity(member, pos, syringeMap.get(member.id) ?? 0));
    });

    // Place enemies with optional hp scaling
    enemyTemplates.forEach((tmpl, i) => {
      const slotIndex = i % 6;
      const pos = this.resolveSpawn(slotIndex, 'enemy');
      this.entities.push(enemyToArenaEntity(tmpl, this.nextEnemyIndex++, pos, hpMultiplier));
    });

    // All entities start in combat stance (not frozen idle)
    for (const entity of this.entities) {
      entity.animState = 'battle-idle';
    }
  }

  /** Spawn new enemies mid-combat (wave transition).
   *
   *  Logic position = on-screen home slot (pos.x is NOT shifted off-screen).
   *  The cosmetic spawnSlideFromX is set so the renderer slides the sprite in
   *  from off the right edge (≥ OFFSCREEN_SLIDE_MIN_X) to the home slot.
   *  AI, victory, turn-lock, and nextAttackAt are untouched — new enemies can
   *  act and be targeted immediately (accepted cosmetic trade-off). */
  addEnemies(templates: EnemyTemplate[], xOffset: number, hpMultiplier: number): void {
    templates.forEach((tmpl, i) => {
      const slotIndex = i % 6;
      const pos = this.resolveSpawn(slotIndex, 'enemy');
      // pos.x is the on-screen home slot — do NOT offset it for logic placement.
      const entity = enemyToArenaEntity(tmpl, this.nextEnemyIndex++, pos, hpMultiplier);
      // Cosmetic slide hint: start off the right edge, clamped to OFFSCREEN_SLIDE_MIN_X.
      entity.spawnSlideFromX = Math.max(pos.x + Math.max(xOffset, 6), OFFSCREEN_SLIDE_MIN_X);
      entity.animState = 'battle-idle';
      this.entities.push(entity);
    });
  }

  /** Resolve a spawn slot to {x,y,z}. Prefers stage spec when present (y from
   *  the platform top); falls back to legacy FORMATION_POSITIONS (y=0) for
   *  legacy callers and tests without a stage. */
  private resolveSpawn(slotIndex: number, side: 'ally' | 'enemy'): ArenaSpawnPos {
    if (this.stageSpec) {
      try {
        return getStageSpawnPosition(this.stageSpec, slotIndex, side);
      } catch {
        // Spec missing the slot → fall through to legacy.
      }
    }
    const legacy = getFormationPosition(slotIndex, side);
    return { x: legacy.x, y: 0, z: legacy.z };
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

  /** Update team-level targeting strategy at runtime (e.g. player toggles in panel) */
  setTargetPriority(priority: TargetPriority): void {
    this.targetPriority = priority;
    // Force re-pick on next tick when switching strategies
    this.primaryTargetId = null;
  }

  isFinished(): boolean { return this.finished; }

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
      blessedConsumedIds: collectBlessedConsumed(this.entities),
    };
  }

  // --- Private methods ---

  private processLogicTick(): void {
    // Phase A: status tick for ALL alive entities (poison, regen, passives, anim revert)
    const stunnedThisTick = new Set<string>();
    for (const e of this.entities) {
      if (e.riposteCountersThisTick?.size) e.riposteCountersThisTick.clear();
    }
    for (const entity of this.entities) {
      if (entity.currentHp <= 0) continue;
      const { stunned } = this.processEntityStatus(entity);
      if (stunned) stunnedThisTick.add(entity.id);
    }

    // Phase B: if active actor still in attack/skill animation, hold the lock
    // until the animation reverts. Stand-still attacks have no movement to
    // advance — actor either is "done" or is mid-anim; we just wait.
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
        // Mid-anim — hold lock, no movement to advance.
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
    if (!this.isActorDone(nextActor)) {
      this.activeActorId = nextActor.id;
    }
  }

  /** Resolve attack target via team-level target priority (focus | balance) */
  private resolveTarget(entity: ArenaEntity): ArenaEntity | null {
    if (entity.isAlly) {
      // Refresh shared focus target if needed (dead/missing → re-pick on next call)
      if (this.targetPriority === 'focus') {
        const current = this.primaryTargetId
          ? this.entities.find(e => e.id === this.primaryTargetId && e.currentHp > 0 && !e.isAlly)
          : null;
        if (!current) {
          const next = pickFocusPrimary(this.entities);
          this.primaryTargetId = next?.id ?? null;
          return next;
        }
        return current;
      }
      // Balance mode: row-aligned target via combat-ai (per-ally)
      return findTarget(entity, this.entities, 'balance');
    }
    return findTarget(entity, this.entities);
  }

  /** Status side-effects for all alive entities each tick: passives, syringe, regen, poison/stun */
  private processEntityStatus(entity: ArenaEntity): { dead: boolean; stunned: boolean } {
    // Revert animState if duration expired.
    // Use strict > (not >=) to avoid same-tick collision: if attack expires at T=800
    // and enemy also attacks at T=800, the ally stays 'attacking' for that tick.
    if (entity.animStateUntil > 0 && this.time > entity.animStateUntil) {
      entity.animState = 'battle-idle';
      entity.animStateUntil = 0;
    }

    const wasBlessed = entity.blessed;
    if (entity.passiveState) applyPassiveTick(entity, this.time);
    // Ancestral Blessings just fired this tick → emit a one-shot cast event so the
    // HUD can pop the skill-name banner over the caster (live arena only).
    if (entity.blessed && !wasBlessed) {
      this.eventQueue.push({ type: 'ancestral-cast', casterId: entity.id });
    }

    const deQuocAlly = this.entities.find(e =>
      e.isAlly === entity.isAlly &&
      e.passiveState?.civId === 'DeQuoc' &&
      isTeamBuffActive(e.passiveState, this.time) &&
      e.currentHp > 0,
    );
    entity._hasDeQuocBuff = !!(deQuocAlly && entity.id !== deQuocAlly.id);

    const defBuffer = this.entities.find(e =>
      e.isAlly === entity.isAlly && e.currentHp > 0 &&
      e.statusEffects.some(s => s.type === 'teamDefUp'),
    );
    entity._linhSonDefBuff = defBuffer
      ? (defBuffer.statusEffects.find(s => s.type === 'teamDefUp')?.magnitude ?? 0.20)
      : 0;

    const critBuffer = this.entities.find(e =>
      e.isAlly === entity.isAlly && e.currentHp > 0 &&
      e.statusEffects.some(s => s.type === 'teamCritUp'),
    );
    entity._linhSonCritBuff = critBuffer
      ? (critBuffer.statusEffects.find(s => s.type === 'teamCritUp')?.magnitude ?? 0.10)
      : 0;

    if (
      entity.isAlly &&
      entity.syringesLoaded !== undefined && entity.syringesLoaded > 0 &&
      entity.syringeThresholdPct !== undefined &&
      entity.currentHp / entity.maxHp < entity.syringeThresholdPct
    ) {
      const frac = this.syringeHealFraction.get(entity.id) ?? 0.30;
      const healAmt = Math.floor(entity.maxHp * frac);
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
      this.clampTutorialAllyFloor(entity);
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
      entity.position.y = entity.homeY;
      entity.position.z = entity.homeZ;
      entity.attackMoveState = 'home';
    }

    return { dead: false, stunned: effectResult.skipTurn };
  }

  /** Initiate action for the entity selected as the next turn owner */
  private processEntityAction(entity: ArenaEntity): void {
    const target = this.resolveTarget(entity);
    if (!target) {
      entity.animState = 'battle-idle';
      return;
    }
    entity.targetId = target.id;

    // Idle-panel mode: every archetype attacks in place. Damage lands instantly,
    // the attack animation plays for ANIM_ATTACK_DURATION, then animState
    // reverts to battle-idle in processEntityStatus. Ranged behaviour is the
    // baseline; melee/warrior step-forward + warrior-jump removed (Phase 6+
    // user feedback — no movement during the idle combat panel).
    // A skill fires this turn if it's manually queued or auto-cast AND off cooldown.
    const skillReady = !!entity.skill && this.time >= entity.skillCooldownUntil;
    const manualCast = entity.isAlly && this.pendingSkills.has(entity.id) && skillReady;
    const autoCast = !!entity.skill?.autoEnabled && skillReady;
    // One action per turn: a skill that fires REPLACES the basic attack — the entity
    // either attacks or casts, never both. So a buff cast deals no damage, and a damage
    // skill hits once (the skill) instead of attack + skill.
    const skipAttack = manualCast || autoCast;

    if (!skipAttack) this.tryAttack(entity, target);

    if (manualCast) {
      this.trySkill(entity, target);
      this.pendingSkills.delete(entity.id);
    } else if (autoCast) {
      this.trySkill(entity, target);
    } else if (entity.isAlly && this.pendingSkills.has(entity.id)) {
      // Manual cast requested but skill on cooldown — drop the stale request.
      this.pendingSkills.delete(entity.id);
    }

    // ThienLu clone extra-hit — once per turn
    if (entity.passiveState && isCloneActive(entity.passiveState, this.time)) {
      const cloneTarget = findTarget(entity, this.entities);
      if (cloneTarget && cloneTarget.currentHp > 0) {
        let cloneDmg = calcAutoAttackDamage(entity.stats.STR, cloneTarget.stats.END + (cloneTarget.gearFlatDefense ?? 0));
        const cloneCrit = rollCrit(entity.stats.LCK);
        if (cloneCrit) cloneDmg = Math.floor(cloneDmg * entity.critDmg);
        cloneTarget.currentHp -= cloneDmg;
        this.clampTutorialAllyFloor(cloneTarget);
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

  /** True when the turn owner has completed its full action cycle and the lock can be released.
   *  Stand-still attacks: every archetype is done as soon as the attack/skill
   *  animation reverts to battle-idle. */
  private isActorDone(actor: ArenaEntity): boolean {
    return actor.animState !== 'attacking' && actor.animState !== 'skill';
  }

  /** Tutorial-only HP-floor (Phase 04). Clamp an ally to ≥1 HP when the floor
   *  is active. No-op for enemies and for every non-tutorial fight (flag false).
   *  Call immediately after any `currentHp -= damage` write that can hit an ally,
   *  before the death (`<= 0`) check, so floored allies never die. */
  private clampTutorialAllyFloor(target: ArenaEntity): void {
    if (this.hpFloorActive && target.isAlly && target.currentHp < 1) {
      target.currentHp = 1;
    }
  }

  private tryAttack(entity: ArenaEntity, target: ArenaEntity): void {
    // Attacker accuracy reduces effective dodge; clamped to 0 (can't go negative)
    const effectiveDodge = Math.max(0, target.dodgeRate - (entity.accuracy ?? 0));
    if (effectiveDodge > 0 && Math.random() < effectiveDodge) {
      this.eventQueue.push({ type: 'dodge', attackerId: entity.id, targetId: target.id });
      entity.nextAttackAt = this.time + entity.attackIntervalMs;
      return;
    }

    this.dealDamage(entity, target);
    const isSlowed = entity.statusEffects.some(e => e.type === 'slowed');
    entity.nextAttackAt = this.time + (isSlowed ? entity.attackIntervalMs * 2 : entity.attackIntervalMs);
    entity.animState = 'attacking';
    entity.animStateUntil = this.time + ANIM_ATTACK_DURATION;
  }

  /** Apply damage, passive effects, and target reactions — no nextAttackAt/animState changes */
  private dealDamage(entity: ArenaEntity, target: ArenaEntity): void {
    const baseEnd = target.stats.END + (target.gearFlatDefense ?? 0);
    // LinhSon team defense buff increases effective END
    const effectiveEnd = Math.floor(baseEnd * (1 + (target._linhSonDefBuff ?? 0)));
    let damage = calcAutoAttackDamage(entity.stats.STR, effectiveEnd, 1.0, entity.gearFlatDamage ?? 0);
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
    // LinhSon Mark crit buff
    if (!isCrit && (entity._linhSonCritBuff ?? 0) > 0) {
      isCrit = Math.random() < entity._linhSonCritBuff!;
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

    // Shield charge check — applied after block, before HP (order: block → shield → HP).
    // Each charge absorbs 80% of post-block damage; min 1 chip still lands.
    if (target.shieldCharges > 0) {
      damage = Math.max(1, Math.floor(damage * (1 - SHIELD_DAMAGE_REDUCTION)));
      target.shieldCharges -= 1;
      this.eventQueue.push({ type: 'shield-break', targetId: target.id, chargesRemaining: target.shieldCharges });
    }

    target.currentHp -= damage;
    this.clampTutorialAllyFloor(target);
    this.totalDamageDealt += entity.isAlly ? damage : 0;
    this.eventQueue.push({ type: 'auto-attack', attackerId: entity.id, targetId: target.id, damage, isCrit });

    // Block animation has highest priority — overrides attacking/skill so the
    // player actually sees the defensive reaction. Hit still defers to ongoing
    // attack/skill swings to avoid interrupting player animations. A one-shot
    // Ancestral Blessings cast is also protected so the clip plays through the
    // incoming hits that are likely at its ≤30%-HP trigger (damage still applies).
    if (target.currentHp > 0 && target.animState !== 'dead' && target.animState !== 'casting') {
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
      // Focus mode: shared primary target died → clear so resolveTarget picks a new one
      if (this.primaryTargetId === target.id) this.primaryTargetId = null;
    }

    // Process enemy abilities (poison, stun, enrage, heal) — only if target survived
    if (target.currentHp > 0) {
      processAbilities(entity, this.entities, this.eventQueue);
    }

    // Riposte counter-attack — fires on any incoming hit while stance is active
    if (
      target.isAlly &&
      (target.riposteUntil ?? 0) >= this.time &&
      entity.currentHp > 0
    ) {
      const alreadyCountered = target.riposteCountersThisTick?.has(entity.id) ?? false;
      if (!alreadyCountered && Math.random() < 0.70) {
        const counterDmg = calcAutoAttackDamage(
          target.stats.STR, entity.stats.END, 1.0, target.gearFlatDamage ?? 0,
        );
        entity.currentHp -= counterDmg;
        this.totalDamageDealt += counterDmg;
        this.eventQueue.push({
          type: 'auto-attack',
          attackerId: target.id,
          targetId: entity.id,
          damage: counterDmg,
          isCrit: false,
        });
        if (!target.riposteCountersThisTick) target.riposteCountersThisTick = new Set();
        target.riposteCountersThisTick.add(entity.id);
        if (entity.currentHp <= 0) {
          entity.animState = 'dead';
          this.eventQueue.push({ type: 'death', entityId: entity.id });
          if (this.primaryTargetId === entity.id) this.primaryTargetId = null;
        }
      }
    }
  }

  private trySkill(entity: ArenaEntity, target: ArenaEntity): void {
    if (!entity.skill) return;
    if (this.time < entity.skillCooldownUntil) return;

    const skill = entity.skill;
    const type = skill.skillType ?? 'damage';

    // AOE telegraph for radius-based skills (cosmetic only, no wind-up gating)
    if (skill.aoeRadius && skill.aoeRadius > 0 && target.position) {
      this.eventQueue.push({
        type: 'aoe-telegraph',
        attackerId: entity.id,
        skillId: skill.id,
        position: [target.position.x, target.position.y ?? 0, target.position.z],
        radius: skill.aoeRadius,
        shape: skill.aoeShape ?? 'circle',
        durationMs: skill.aoeCastTimeMs ?? ANIM_ATTACK_DURATION,
        color: skill.aoeColor ?? '#ff5a5a',
      });
    }

    switch (type) {
      case 'damage':      this.executeSkillDamage(entity, target, skill); break;
      case 'lane-hit':    this.executeSkillLaneHit(entity, target, skill); break;
      case 'multi-hit':   this.executeSkillMultiHit(entity, target, skill); break;
      case 'aoe-ground':  this.executeSkillAoeGround(entity, skill); break;
      case 'armor-pierce':this.executeSkillArmorPierce(entity, target, skill); break;
      case 'buff':        this.executeSkillBuff(entity, skill); break;
      case 'debuff':      this.executeSkillDamageDebuff(entity, target, skill); break;
      case 'riposte':     this.executeSkillRiposte(entity, skill); break;
      default:            this.executeSkillDamage(entity, target, skill); break;
    }

    entity.skillCooldownUntil = this.time + skill.cooldownMs;
    entity.animState = 'skill';
    entity.animStateUntil = this.time + ANIM_ATTACK_DURATION;

    if (entity.passiveState) {
      onDamageDealt(entity.passiveState);
      if (entity.passiveState.civId === 'ThienLu') resolveThienLuTimers(entity.passiveState, this.time);
    }
  }

  private executeSkillDamage(entity: ArenaEntity, target: ArenaEntity, skill: import('@/game/state/game-state').Skill): void {
    const effectiveDodge = Math.max(0, target.dodgeRate - (entity.accuracy ?? 0) - (skill.accuracyBonus ?? 0));
    if (effectiveDodge > 0 && Math.random() < effectiveDodge) {
      this.eventQueue.push({ type: 'dodge', attackerId: entity.id, targetId: target.id });
      return;
    }
    const effectiveDef = Math.floor((target.stats.END + (target.gearFlatDefense ?? 0)) * (1 + (target._linhSonDefBuff ?? 0)));
    const baseDmg = calcAutoAttackDamage(entity.stats.STR, effectiveDef, 1.0, entity.gearFlatDamage ?? 0);
    let isCrit = rollCrit(entity.stats.LCK + (skill.critRateBonus ?? 0) * 100);
    if (!isCrit && (entity._linhSonCritBuff ?? 0) > 0) isCrit = Math.random() < entity._linhSonCritBuff!;
    let dmg = calcSkillDamage(baseDmg, skill.damageMultiplier, entity.stats.DEX);
    if (isCrit) dmg = Math.floor(dmg * entity.critDmg);
    this.applySkillHit(entity, target, dmg, isCrit, skill.name);
  }

  private executeSkillLaneHit(entity: ArenaEntity, target: ArenaEntity, skill: import('@/game/state/game-state').Skill): void {
    const LANE_Z_THRESHOLD = 1.5;
    const maxExtra = (skill.laneHitDepth ?? 2) - 1;
    const laneTargets = this.entities.filter(e =>
      !e.isAlly && e.currentHp > 0 && e.id !== target.id &&
      Math.abs((e.position?.z ?? 0) - (target.position?.z ?? 0)) < LANE_Z_THRESHOLD,
    ).slice(0, maxExtra);

    const allTargets = [target, ...laneTargets];
    for (let i = 0; i < allTargets.length; i++) {
      const t = allTargets[i];
      const effectiveDef = Math.floor((t.stats.END + (t.gearFlatDefense ?? 0)) * (1 + (t._linhSonDefBuff ?? 0)));
      const baseDmg = calcAutoAttackDamage(entity.stats.STR, effectiveDef, 1.0, entity.gearFlatDamage ?? 0);
      const isCrit = rollCrit(entity.stats.LCK);
      const isLast = i === allTargets.length - 1 && allTargets.length > 1;
      const mult = isLast && (skill.laneHitLastBonus ?? 0) > 0
        ? skill.damageMultiplier * (1 + skill.laneHitLastBonus!)
        : skill.damageMultiplier;
      let dmg = calcSkillDamage(baseDmg, mult, entity.stats.DEX);
      if (isCrit) dmg = Math.floor(dmg * entity.critDmg);
      this.applySkillHit(entity, t, dmg, isCrit, skill.name);
    }
  }

  private executeSkillMultiHit(entity: ArenaEntity, target: ArenaEntity, skill: import('@/game/state/game-state').Skill): void {
    const count = skill.multiHitCount ?? 1;
    const mult = skill.multiHitMultiplier ?? skill.damageMultiplier;
    for (let i = 0; i < count; i++) {
      if (target.currentHp <= 0) break;
      const effectiveDef = Math.floor((target.stats.END + (target.gearFlatDefense ?? 0)) * (1 + (target._linhSonDefBuff ?? 0)));
      const baseDmg = calcAutoAttackDamage(entity.stats.STR, effectiveDef, 1.0, entity.gearFlatDamage ?? 0);
      const isCrit = rollCrit(entity.stats.LCK);
      const isLast = i === count - 1;
      const hitMult = isLast && (skill.multiHitFinalBonus ?? 0) > 0 ? mult * (1 + skill.multiHitFinalBonus!) : mult;
      let dmg = calcSkillDamage(baseDmg, hitMult, entity.stats.DEX);
      if (isCrit) dmg = Math.floor(dmg * entity.critDmg);
      this.applySkillHit(entity, target, dmg, isCrit, skill.name);
    }
  }

  private executeSkillAoeGround(entity: ArenaEntity, skill: import('@/game/state/game-state').Skill): void {
    const groundEnemies = this.entities.filter(e => !e.isAlly && e.currentHp > 0 && !e.flying);
    for (const t of groundEnemies) {
      const effectiveDef = Math.floor((t.stats.END + (t.gearFlatDefense ?? 0)) * (1 + (t._linhSonDefBuff ?? 0)));
      const baseDmg = calcAutoAttackDamage(entity.stats.STR, effectiveDef, 1.0, entity.gearFlatDamage ?? 0);
      const isCrit = rollCrit(entity.stats.LCK);
      let dmg = calcSkillDamage(baseDmg, skill.damageMultiplier, entity.stats.DEX);
      if (isCrit) dmg = Math.floor(dmg * entity.critDmg);
      this.applySkillHit(entity, t, dmg, isCrit, skill.name);
      // Quake R5 stun chance
      if ((skill.aoeStunChance ?? 0) > 0 && Math.random() < skill.aoeStunChance! && t.currentHp > 0) {
        if (!t.statusEffects.some(e => e.type === 'stunned')) {
          t.statusEffects.push({ type: 'stunned', ticksRemaining: 2 });
          this.eventQueue.push({ type: 'effect-applied', targetId: t.id, effect: 'stunned' });
        }
      }
    }
  }

  private executeSkillArmorPierce(entity: ArenaEntity, target: ArenaEntity, skill: import('@/game/state/game-state').Skill): void {
    const pierced = Math.random() < (skill.armorPierceChance ?? 0);
    const baseEnd = target.stats.END + (target.gearFlatDefense ?? 0);
    const effectiveDef = pierced ? 0 : Math.floor(baseEnd * (1 + (target._linhSonDefBuff ?? 0)));
    const baseDmg = calcAutoAttackDamage(entity.stats.STR, effectiveDef, 1.0, entity.gearFlatDamage ?? 0, pierced);
    const isCrit = rollCrit(entity.stats.LCK);
    const mult = pierced && (skill.armorPierceBonusMult ?? 0) > 0
      ? skill.damageMultiplier * skill.armorPierceBonusMult!
      : skill.damageMultiplier;
    let dmg = calcSkillDamage(baseDmg, mult, entity.stats.DEX);
    if (isCrit) dmg = Math.floor(dmg * entity.critDmg);
    this.applySkillHit(entity, target, dmg, isCrit, skill.name);
  }

  private executeSkillBuff(entity: ArenaEntity, skill: import('@/game/state/game-state').Skill): void {
    const TICKS_PER_MS = 1 / 100;
    const tickDuration = Math.round((skill.buffDurationMs ?? 5000) * TICKS_PER_MS);
    const magnitude = skill.buffMagnitude
      ?? (skill.buffEffect === 'defense-up' ? 0.20 : skill.buffEffect === 'crit-up' ? 0.10 : 0);

    const effectType = skill.buffEffect === 'defense-up' ? 'teamDefUp'
      : skill.buffEffect === 'crit-up' ? 'teamCritUp'
      : 'boosted';

    const applyBuff = (e: ArenaEntity) => {
      const existing = e.statusEffects.find(s => s.type === effectType);
      if (existing) {
        existing.ticksRemaining = tickDuration; // refresh; no stack
      } else {
        e.statusEffects.push({ type: effectType as import('./combat-types').ActiveEffect['type'], ticksRemaining: tickDuration, magnitude });
      }
    };

    if (skill.buffScope === 'self') {
      applyBuff(entity);
      // Bulwark: also apply pseudo-taunt to self
      if (skill.statusEffect === 'taunted') {
        const tauntTicks = Math.round((skill.statusDurationMs ?? 5000) / 100);
        const existingTaunt = entity.statusEffects.find(s => s.type === 'taunted');
        if (existingTaunt) existingTaunt.ticksRemaining = tauntTicks;
        else entity.statusEffects.push({ type: 'taunted', ticksRemaining: tauntTicks });
      }
    } else {
      for (const ally of this.entities.filter(e => e.isAlly && e.currentHp > 0)) {
        applyBuff(ally);
        // Aegis R5 heal
        if ((skill.buffHealPct ?? 0) > 0) {
          const healAmt = Math.floor(ally.maxHp * skill.buffHealPct!);
          ally.currentHp = Math.min(ally.maxHp, ally.currentHp + healAmt);
          this.eventQueue.push({ type: 'heal', healerId: entity.id, targetId: ally.id, amount: healAmt });
        }
      }
    }

    this.eventQueue.push({
      type: 'skill-buff-applied',
      casterId: entity.id,
      buffEffect: skill.buffEffect ?? 'damage-up',
      scope: skill.buffScope ?? 'self',
      durationMs: skill.buffDurationMs ?? 5000,
    });
  }

  private executeSkillDamageDebuff(entity: ArenaEntity, target: ArenaEntity, skill: import('@/game/state/game-state').Skill): void {
    this.executeSkillDamage(entity, target, skill);
    if (target.currentHp <= 0) return;

    const resist = target.statusResist ?? 0;
    const baseDurationMs = skill.statusDurationMs ?? 5000;
    const reducedMs = Math.floor(baseDurationMs * (1 - Math.min(resist, 0.75)));
    const tickDuration = Math.round(reducedMs / 100);
    if (tickDuration <= 0) return;

    const statusType = (skill.statusEffect ?? 'slowed') as import('./combat-types').ActiveEffect['type'];
    const existing = target.statusEffects.find(e => e.type === statusType);
    if (existing) existing.ticksRemaining = tickDuration;
    else target.statusEffects.push({ type: statusType, ticksRemaining: tickDuration });

    // Pin R5: also apply accuracy penalty
    if ((skill.debuffAccuracyPenalty ?? 0) > 0) {
      target.dodgeRate = Math.min(0.95, target.dodgeRate + skill.debuffAccuracyPenalty!);
    }

    this.eventQueue.push({
      type: 'skill-debuff-applied',
      casterId: entity.id,
      targetId: target.id,
      effect: statusType,
      durationMs: reducedMs,
    });
  }

  private executeSkillRiposte(entity: ArenaEntity, skill: import('@/game/state/game-state').Skill): void {
    entity.riposteUntil = this.time + (skill.statusDurationMs ?? 3000);
    this.eventQueue.push({ type: 'effect-applied', targetId: entity.id, effect: 'riposte' });
  }

  private applySkillHit(entity: ArenaEntity, target: ArenaEntity, damage: number, isCrit: boolean, skillName: string): void {
    target.currentHp -= damage;
    this.clampTutorialAllyFloor(target);
    this.totalDamageDealt += entity.isAlly ? damage : 0;
    this.eventQueue.push({ type: 'skill-use', attackerId: entity.id, targetId: target.id, damage, skillName, isCrit });
    if (target.currentHp <= 0) {
      target.animState = 'dead';
      this.eventQueue.push({ type: 'death', entityId: target.id });
      if (this.primaryTargetId === target.id) this.primaryTargetId = null;
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
