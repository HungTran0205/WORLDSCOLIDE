import type { Member } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';
import type { CombatEntity, CombatTick, CombatEvent, CombatResult, CombatOutcome } from './combat-types';
import { calcAutoAttackDamage, calcSkillDamage, rollCrit } from './combat-formulas';
import { calcDerivedCombatStats } from './derived-combat-stats';
import { calcGearBonuses } from './equipment-bonuses';
import { applyEffectTick } from './combat-effects';
import {
  createPassiveState, applyPassiveOnInit, applyPassiveTick, onDamageDealt, snapshotBaseStats,
  consumeShock, activateTeamBuff, isTeamBuffActive, resolveThienLuTimers, isCloneActive,
} from './combat-passives';

const TICK_MS = 500;
const MAX_TICKS = 10000;

function memberToEntity(member: Member): CombatEntity {
  const derived = calcDerivedCombatStats(member.stats, member.level);
  const gear = calcGearBonuses(member.equipment);
  const entity: CombatEntity = {
    id: member.id,
    name: member.name,
    isAlly: true,
    maxHp: derived.maxHp + gear.flatHp,
    currentHp: derived.maxHp + gear.flatHp,
    stats: { ...member.stats },
    skill: member.skill ? { ...member.skill } : null,
    level: member.level,
    attackIntervalMs: derived.attackIntervalMs,
    nextAttackAt: derived.attackIntervalMs,
    skillCooldownUntil: 0,
    statusEffects: [],
    abilities: [],
    civilization: member.civilization,
    baseStats: snapshotBaseStats(member.stats),
    passiveState: createPassiveState(member.civilization),
    dodgeRate: derived.dodgeRate,
    blockRate: derived.blockRate,
    critDmg: derived.critDmg,
    hpRegenPerSec: derived.hpRegen,
    gearFlatDamage: gear.flatDamage,
    gearFlatDefense: gear.flatDefense,
  };
  applyPassiveOnInit(entity);
  return entity;
}

function enemyToEntity(template: EnemyTemplate, index: number): CombatEntity {
  const derived = calcDerivedCombatStats(template.stats, template.level);
  return {
    id: `enemy-${template.id}-${index}`,
    name: template.name,
    isAlly: false,
    maxHp: derived.maxHp,
    currentHp: derived.maxHp,
    stats: { ...template.stats },
    skill: template.skill ? { ...template.skill } : null,
    level: template.level,
    attackIntervalMs: derived.attackIntervalMs,
    nextAttackAt: derived.attackIntervalMs,
    skillCooldownUntil: 0,
    statusEffects: [],
    abilities: [...template.abilities],
    dodgeRate: derived.dodgeRate,
    blockRate: derived.blockRate,
    critDmg: derived.critDmg,
    hpRegenPerSec: derived.hpRegen,
  };
}

type TargetPicker = (entities: CombatEntity[], opposingTeam: boolean) => CombatEntity | null;

function pickLowestHpTarget(entities: CombatEntity[], opposingTeam: boolean): CombatEntity | null {
  const alive = entities.filter((e) => e.currentHp > 0 && e.isAlly === opposingTeam);
  if (alive.length === 0) return null;
  return alive.reduce((lowest, e) => (e.currentHp < lowest.currentHp ? e : lowest));
}

/** Random alive opponent — used by Skip path (D11) so re-targeting is unbiased. */
function pickRandomTarget(entities: CombatEntity[], opposingTeam: boolean): CombatEntity | null {
  const alive = entities.filter((e) => e.currentHp > 0 && e.isAlly === opposingTeam);
  if (alive.length === 0) return null;
  return alive[Math.floor(Math.random() * alive.length)];
}

/**
 * Deep-clone a CombatEntity so the simulator can mutate without corrupting the
 * caller's live engine state. Required by simulateCombatFromSnapshot (D11/R4).
 *
 * IMPORTANT: when CombatEntity gains new fields, mirror them here. The
 * `tests/clone-combat-entity.test.ts` decoupling check enumerates this.
 */
export function cloneCombatEntity(e: CombatEntity): CombatEntity {
  return {
    ...e,
    stats: { ...e.stats },
    baseStats: e.baseStats ? { ...e.baseStats } : undefined,
    skill: e.skill ? { ...e.skill } : null,
    statusEffects: e.statusEffects.map((s) => ({ ...s })),
    abilities: e.abilities.map((a) => ({ ...a })),
    passiveState: e.passiveState ? { ...e.passiveState } : undefined,
    position: e.position ? { ...e.position } : undefined,
  };
}

/** Run full combat simulation — pure function, returns CombatResult.
 *  `hpFloor` (Phase 04) clamps allies to ≥1 HP for the tutorial Moonbear fight;
 *  default false → identical behaviour for every other mission. */
export function simulateCombat(
  partyMembers: Member[],
  enemyTemplates: EnemyTemplate[],
  hpFloor = false,
): CombatResult {
  const entities: CombatEntity[] = [
    ...partyMembers.map(memberToEntity),
    ...enemyTemplates.map((t, i) => enemyToEntity(t, i)),
  ];
  return runCombatLoop(entities, pickLowestHpTarget, 0, hpFloor);
}

/**
 * Continue simulation from a live combat snapshot (D11). Used by the Skip
 * button mid-battle and by mid-fight reload (D12). Outcome respects existing
 * entity state: HP, dead flags, status effects, cooldowns, passive timers.
 *
 * Re-targeting uses random picks across alive enemies (per D11) — keeps logic
 * simple and avoids the need to preserve the focus/balance priority chain.
 *
 * Implementation notes:
 *   - Deep-clones the snapshot so caller engine state is never mutated.
 *   - Rebases absolute timestamps (nextAttackAt, cooldowns, passive expiries)
 *     against `baseTime` so the simulator clock starts at 0 with correct
 *     remaining waits preserved.
 */
export function simulateCombatFromSnapshot(
  snapshot: CombatEntity[],
  baseTime: number = 0,
  hpFloor = false,
): CombatResult {
  const entities = snapshot.map(cloneCombatEntity).map((e) => rebaseEntityTimestamps(e, baseTime));
  return runCombatLoop(entities, pickRandomTarget, 0, hpFloor);
}

/** Subtract the engine's current absolute time from per-entity timers, preserving
 *  -1 sentinels (used by ThienLu pending-resolution markers). */
function rebaseEntityTimestamps(entity: CombatEntity, baseTime: number): CombatEntity {
  const rebase = (t: number) => (t === -1 ? -1 : Math.max(0, t - baseTime));
  entity.nextAttackAt = rebase(entity.nextAttackAt);
  entity.skillCooldownUntil = rebase(entity.skillCooldownUntil);
  if (entity.passiveState) {
    entity.passiveState.teamBuffUntil = rebase(entity.passiveState.teamBuffUntil);
    entity.passiveState.critBonusUntil = rebase(entity.passiveState.critBonusUntil);
    entity.passiveState.cloneUntil = rebase(entity.passiveState.cloneUntil);
  }
  return entity;
}

/** Shared tick loop — used by simulateCombat (lowest-HP target) and
 *  simulateCombatFromSnapshot (random target) per D11.
 *  `hpFloor` (Phase 04, default false) mirrors CombatEngine.hpFloorActive so the
 *  tutorial Moonbear fight stays a guaranteed win on every auto-resolve path. */
function runCombatLoop(
  entities: CombatEntity[],
  pickTarget: TargetPicker,
  startTime: number,
  hpFloor = false,
): CombatResult {
  const ticks: CombatTick[] = [];
  let totalDamageDealt = 0;
  let time = startTime;

  // Clamp an ally to ≥1 HP when the tutorial floor is active. No-op for enemies
  // and for every non-tutorial mission. Call right after each ally-damage write,
  // before the death (`<= 0`) check, so floored allies never die.
  const clampAllyFloor = (e: CombatEntity) => {
    if (hpFloor && e.isAlly && e.currentHp < 1) e.currentHp = 1;
  };

  for (let tickCount = 0; tickCount < MAX_TICKS; tickCount++) {
    time += TICK_MS;
    const events: CombatEvent[] = [];

    for (const entity of entities) {
      if (entity.currentHp <= 0) continue;

      // Refresh conditional passive buffs each tick
      if (entity.passiveState) applyPassiveTick(entity);

      // HP regen tick
      if (entity.hpRegenPerSec > 0) {
        const regen = Math.round(entity.hpRegenPerSec * TICK_MS / 1000);
        if (regen > 0 && entity.currentHp < entity.maxHp) {
          const healed = Math.min(regen, entity.maxHp - entity.currentHp);
          entity.currentHp += healed;
          events.push({ type: 'heal', healerId: entity.id, targetId: entity.id, amount: healed });
        }
      }

      // Apply status effects (poison, stun, boost)
      const effectResult = applyEffectTick(entity);
      if (effectResult.damage > 0) {
        entity.currentHp -= effectResult.damage;
        clampAllyFloor(entity);
        events.push({ type: 'effect-tick', targetId: entity.id, effect: 'poison', damage: effectResult.damage });
        if (entity.currentHp <= 0) { events.push({ type: 'death', entityId: entity.id }); continue; }
      }
      if (effectResult.skipTurn) continue;

      // Auto-attack
      if (time >= entity.nextAttackAt) {
        const target = pickTarget(entities, !entity.isAlly);
        if (!target) continue;

        // Generic stat-derived dodge check
        if (target.dodgeRate > 0 && Math.random() < target.dodgeRate) {
          events.push({ type: 'dodge', attackerId: entity.id, targetId: target.id });
          entity.nextAttackAt = time + entity.attackIntervalMs;
          continue;
        }

        // Check DeQuoc team buff from any alive ally
        const hasDeQuocBuff = entities.some(e =>
          e.isAlly === entity.isAlly &&
          e.passiveState?.civId === 'DeQuoc' &&
          isTeamBuffActive(e.passiveState, time) &&
          e.currentHp > 0 &&
          e.id !== entity.id,
        );
        entity._hasDeQuocBuff = hasDeQuocBuff;

        const targetEffDef = target.stats.END + (target.gearFlatDefense ?? 0);
        let damage = calcAutoAttackDamage(entity.stats.STR, targetEffDef, 1.0, entity.gearFlatDamage ?? 0);
        // Boosted status gives +20% damage
        if (entity.statusEffects.some((e) => e.type === 'boosted')) {
          damage = Math.floor(damage * 1.2);
        }
        let isCrit = rollCrit(entity.stats.LCK);
        // ThienLu Tinh Lo crit bonus
        if (!isCrit && (entity.passiveState?.critBonus ?? 0) > 0) {
          isCrit = Math.random() < entity.passiveState!.critBonus;
        }
        // DeQuoc team buff crit bonus (+5%)
        if (!isCrit && entity._hasDeQuocBuff) isCrit = Math.random() < 0.05;
        if (isCrit) damage = Math.floor(damage * entity.critDmg);
        // DeQuoc team buff damage bonus (+5%)
        if (entity._hasDeQuocBuff) damage = Math.floor(damage * 1.05);

        // Block check (50% damage reduction on proc)
        if (target.blockRate > 0 && Math.random() < target.blockRate) {
          const reducedDamage = Math.max(1, Math.floor(damage * 0.5));
          events.push({ type: 'block', attackerId: entity.id, targetId: target.id, reducedDamage });
          damage = reducedDamage;
        }

        target.currentHp -= damage;
        clampAllyFloor(target);
        totalDamageDealt += entity.isAlly ? damage : 0;
        events.push({ type: 'auto-attack', attackerId: entity.id, targetId: target.id, damage });
        entity.nextAttackAt = time + entity.attackIntervalMs;

        // Track passive stacks on damage dealt
        if (entity.passiveState) {
          onDamageDealt(entity.passiveState);

          // DeQuoc Shock application
          if (consumeShock(entity.passiveState)) {
            if (!target.statusEffects.some(e => e.type === 'shocked')) {
              target.statusEffects.push({ type: 'shocked', ticksRemaining: 1 });
              events.push({ type: 'effect-applied', targetId: target.id, effect: 'shocked' });
            }
            activateTeamBuff(entity.passiveState, time);
          }

          // ThienLu timer resolution
          if (entity.passiveState.civId === 'ThienLu') {
            resolveThienLuTimers(entity.passiveState, time);
          }
        }

        // ThienLu clone hit (extra auto-attack each tick while clone active)
        if (entity.passiveState && isCloneActive(entity.passiveState, time)) {
          let cloneDmg = calcAutoAttackDamage(entity.stats.STR, targetEffDef);
          const cloneCrit = rollCrit(entity.stats.LCK);
          if (cloneCrit) cloneDmg = Math.floor(cloneDmg * entity.critDmg);
          target.currentHp -= cloneDmg;
          clampAllyFloor(target);
          totalDamageDealt += entity.isAlly ? cloneDmg : 0;
          events.push({ type: 'auto-attack', attackerId: `${entity.id}-clone`, targetId: target.id, damage: cloneDmg, isCrit: cloneCrit });
          if (target.currentHp <= 0) events.push({ type: 'death', entityId: target.id });
        }

        // Process enemy abilities
        processAbilities(entity, entities, events, pickTarget);

        if (target.currentHp <= 0) events.push({ type: 'death', entityId: target.id });
      }

      // Skill usage
      if (entity.skill && entity.level >= 5 && entity.skill.autoEnabled && time >= entity.skillCooldownUntil) {
        const target = pickTarget(entities, !entity.isAlly);
        if (target) {
          const skillTargetDef = target.stats.END + (target.gearFlatDefense ?? 0);
          const baseDmg = calcAutoAttackDamage(entity.stats.STR, skillTargetDef, 1.0, entity.gearFlatDamage ?? 0);
          let skillDmg = calcSkillDamage(baseDmg, entity.skill.damageMultiplier, entity.stats.DEX);
          if (rollCrit(entity.stats.LCK)) skillDmg = Math.floor(skillDmg * entity.critDmg);
          target.currentHp -= skillDmg;
          clampAllyFloor(target);
          totalDamageDealt += entity.isAlly ? skillDmg : 0;
          events.push({ type: 'skill-use', attackerId: entity.id, targetId: target.id, damage: skillDmg, skillName: entity.skill.name });
          entity.skillCooldownUntil = time + (entity.attackIntervalMs * 2);
          if (entity.passiveState) {
            onDamageDealt(entity.passiveState);
            if (entity.passiveState.civId === 'ThienLu') resolveThienLuTimers(entity.passiveState, time);
          }
          if (target.currentHp <= 0) events.push({ type: 'death', entityId: target.id });
        }
      }
    }

    if (events.length > 0) ticks.push({ time, events });

    const alliesAlive = entities.filter((e) => e.isAlly && e.currentHp > 0);
    const enemiesAlive = entities.filter((e) => !e.isAlly && e.currentHp > 0);

    if (enemiesAlive.length === 0) {
      const injured = entities.filter((e) => e.isAlly && e.currentHp <= 0).map((e) => e.id);
      const outcome: CombatOutcome = injured.length === 0 ? 'victory' : 'partial-victory';
      ticks.push({ time, events: [{ type: 'victory' }] });
      return { outcome, ticks, survivors: alliesAlive.map((e) => e.id), injured, totalDamageDealt, durationMs: time };
    }

    if (alliesAlive.length === 0) {
      ticks.push({ time, events: [{ type: 'wipe' }] });
      return { outcome: 'full-wipe', ticks, survivors: [], injured: entities.filter((e) => e.isAlly).map((e) => e.id), totalDamageDealt, durationMs: time };
    }
  }

  return { outcome: 'full-wipe', ticks, survivors: [], injured: entities.filter((e) => e.isAlly).map((e) => e.id), totalDamageDealt, durationMs: time };
}

/** Process enemy abilities after an attack. Target picker is injected so the
 *  Skip-snapshot path can keep the random-target rule (D11). */
function processAbilities(
  entity: CombatEntity,
  entities: CombatEntity[],
  events: CombatEvent[],
  pickTarget: TargetPicker,
): void {
  for (const ability of entity.abilities) {
    if (Math.random() >= ability.chance) continue;

    if (ability.type === 'poison-attack') {
      const t = pickTarget(entities, !entity.isAlly);
      if (t && !t.statusEffects.some((e) => e.type === 'poisoned')) {
        t.statusEffects.push({ type: 'poisoned', ticksRemaining: 6 });
        events.push({ type: 'effect-applied', targetId: t.id, effect: 'poisoned' });
      }
    } else if (ability.type === 'stun-attack') {
      const t = pickTarget(entities, !entity.isAlly);
      if (t && !t.statusEffects.some((e) => e.type === 'stunned')) {
        t.statusEffects.push({ type: 'stunned', ticksRemaining: 2 });
        events.push({ type: 'effect-applied', targetId: t.id, effect: 'stunned' });
      }
    } else if (ability.type === 'enrage') {
      if (!entity.statusEffects.some((e) => e.type === 'boosted')) {
        entity.statusEffects.push({ type: 'boosted', ticksRemaining: 4 });
        events.push({ type: 'effect-applied', targetId: entity.id, effect: 'boosted' });
      }
    } else if (ability.type === 'heal-ally') {
      const allies = entities.filter((e) => e.isAlly === entity.isAlly && e.currentHp > 0 && e.id !== entity.id);
      if (allies.length > 0) {
        const lowest = allies.reduce((min, e) => (e.currentHp < min.currentHp ? e : min));
        const heal = Math.floor(entity.maxHp * 0.15);
        lowest.currentHp = Math.min(lowest.maxHp, lowest.currentHp + heal);
        events.push({ type: 'heal', healerId: entity.id, targetId: lowest.id, amount: heal });
      }
    }
  }
}
