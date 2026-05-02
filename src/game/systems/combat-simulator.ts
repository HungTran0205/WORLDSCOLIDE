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

function pickTarget(entities: CombatEntity[], opposingTeam: boolean): CombatEntity | null {
  const alive = entities.filter((e) => e.currentHp > 0 && e.isAlly === opposingTeam);
  if (alive.length === 0) return null;
  return alive.reduce((lowest, e) => (e.currentHp < lowest.currentHp ? e : lowest));
}

/** Run full combat simulation — pure function, returns CombatResult */
export function simulateCombat(partyMembers: Member[], enemyTemplates: EnemyTemplate[]): CombatResult {
  const entities: CombatEntity[] = [
    ...partyMembers.map(memberToEntity),
    ...enemyTemplates.map((t, i) => enemyToEntity(t, i)),
  ];

  const ticks: CombatTick[] = [];
  let totalDamageDealt = 0;
  let time = 0;

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
          totalDamageDealt += entity.isAlly ? cloneDmg : 0;
          events.push({ type: 'auto-attack', attackerId: `${entity.id}-clone`, targetId: target.id, damage: cloneDmg, isCrit: cloneCrit });
          if (target.currentHp <= 0) events.push({ type: 'death', entityId: target.id });
        }

        // Process enemy abilities
        processAbilities(entity, entities, events);

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

/** Process enemy abilities after an attack */
function processAbilities(entity: CombatEntity, entities: CombatEntity[], events: CombatEvent[]): void {
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
