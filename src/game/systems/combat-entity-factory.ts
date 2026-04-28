/**
 * Factory functions to convert Member/EnemyTemplate into ArenaEntity.
 * Extracted from CombatEngine to keep it under 200 lines.
 */

import type { Member } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';
import type { ArenaEntity } from './combat-arena-types';
import { getAttackRange, DEFAULT_MOVE_SPEED } from './combat-arena-types';
// calcMaxHp / calcAttackInterval consumed via calcDerivedCombatStats — no direct import needed
import { calcDerivedCombatStats } from './derived-combat-stats';
import { createPassiveState, applyPassiveOnInit, snapshotBaseStats } from './combat-passives';
import { calcGearBonuses } from './equipment-bonuses';

/**
 * Convert a guild Member into an ArenaEntity at the given position.
 * syringeCount: how many HEALING_SYRINGE the member is loading into combat from inventory.
 */
export function memberToArenaEntity(
  member: Member,
  pos: { x: number; z: number },
  syringeCount = 0,
): ArenaEntity {
  const derived = calcDerivedCombatStats(member.stats, member.level);
  const gear = calcGearBonuses(member.equipment);
  const loadout = member.syringeLoadout;
  const entity: ArenaEntity = {
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
    archetype: member.archetype,
    gender: member.gender,
    gearFlatDamage: gear.flatDamage,
    gearFlatDefense: gear.flatDefense,
    baseStats: snapshotBaseStats(member.stats),
    passiveState: createPassiveState(member.civilization),
    dodgeRate: derived.dodgeRate,
    blockRate: derived.blockRate,
    critDmg: derived.critDmg,
    hpRegenPerSec: derived.hpRegen,
    position: { ...pos },
    targetId: null,
    attackRange: getAttackRange(member.archetype),
    moveSpeed: DEFAULT_MOVE_SPEED,
    animState: 'idle',
    facingRight: true,
    animStateUntil: 0,
    homeX: pos.x,
    homeZ: pos.z,
    attackMoveState: 'home',
    ...(loadout && syringeCount > 0
      ? { syringeThresholdPct: loadout.autoUseThresholdPct, syringesLoaded: syringeCount }
      : {}),
  };
  applyPassiveOnInit(entity);
  return entity;
}

/** Convert an EnemyTemplate into an ArenaEntity at the given position */
export function enemyToArenaEntity(
  template: EnemyTemplate,
  index: number,
  pos: { x: number; z: number },
  hpMultiplier = 1.0,
): ArenaEntity {
  const derived = calcDerivedCombatStats(template.stats, template.level);
  const hp = Math.max(1, Math.floor(derived.maxHp * hpMultiplier));
  return {
    id: `enemy-${template.id}-${index}`,
    name: template.name,
    isAlly: false,
    maxHp: hp,
    currentHp: hp,
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
    position: { ...pos },
    targetId: null,
    attackRange: 1.5,
    moveSpeed: DEFAULT_MOVE_SPEED,
    animState: 'idle',
    facingRight: false,
    animStateUntil: 0,
    homeX: pos.x,
    homeZ: pos.z,
    attackMoveState: 'home',
    spriteId: template.spriteId,
    flying: template.flying,
    isBoss: template.isBoss,
  };
}
