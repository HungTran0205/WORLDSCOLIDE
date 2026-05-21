/**
 * Factory functions to convert Member/EnemyTemplate into ArenaEntity.
 * Extracted from CombatEngine to keep it under 200 lines.
 */

import type { Member, MercContract } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';
import type { ArenaEntity } from './combat-arena-types';
import { getAttackRange, DEFAULT_MOVE_SPEED } from './combat-arena-types';
// calcMaxHp / calcAttackInterval consumed via calcDerivedCombatStats — no direct import needed
import { calcDerivedCombatStats } from './derived-combat-stats';
import { createPassiveState, applyPassiveOnInit, snapshotBaseStats } from './combat-passives';
import { calcGearBonuses } from './equipment-bonuses';

/** Spatial spawn coordinate — y added in phase 05 for multi-platform stages. */
export interface ArenaSpawnPos { x: number; y: number; z: number }

/**
 * Convert a guild Member into an ArenaEntity at the given position.
 * syringeCount: how many HEALING_SYRINGE the member is loading into combat from inventory.
 */
export function memberToArenaEntity(
  member: Member,
  pos: ArenaSpawnPos,
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
    maskSpriteId: member.maskSpriteId,
    gearFlatDamage: gear.flatDamage,
    gearFlatDefense: gear.flatDefense,
    baseStats: snapshotBaseStats(member.stats),
    passiveState: createPassiveState(member.civilization),
    dodgeRate: derived.dodgeRate,
    blockRate: derived.blockRate,
    critDmg: derived.critDmg,
    hpRegenPerSec: derived.hpRegen,
    position: { x: pos.x, y: pos.y, z: pos.z },
    targetId: null,
    attackRange: getAttackRange(member.archetype),
    moveSpeed: DEFAULT_MOVE_SPEED,
    animState: 'idle',
    facingRight: true,
    animStateUntil: 0,
    homeX: pos.x,
    homeY: pos.y,
    homeZ: pos.z,
    attackMoveState: 'home',
    ...(loadout && syringeCount > 0
      ? { syringeThresholdPct: loadout.autoUseThresholdPct, syringesLoaded: syringeCount }
      : {}),
  };
  applyPassiveOnInit(entity);
  return entity;
}

/**
 * Phase 04: adapt a hired merc contract into a transient Member shape so the
 * existing combat path (memberToArenaEntity, mission-resolver, etc.) can run
 * unchanged. The merc id is preserved as Member.id so the post-combat
 * survivors[] list lets us route results back to the contract.
 *
 * Mercs have NO equipment, NO syringe loadout, NO learned skill — combat
 * power comes purely from the visitorSnapshot stats/level/archetype/civ.
 */
export function memberFromMercContract(contract: MercContract): Member {
  const v = contract.visitorSnapshot;
  return {
    id: contract.id,
    name: `Merc-${contract.id.slice(-4)}`,
    level: v.level,
    exp: 0,
    stats: { ...v.stats },
    unallocatedPoints: 0,
    skill: null,
    status: 'on-mission',
    injuredUntil: null,
    civilization: v.civilization,
    archetype: v.archetype,
    isFounder: false,
    rank: 'MERCENARY',
    missionsCompleted: 0,
    rarity: v.rarity,
    traits: v.traits,
    equipment: null,
    syringeLoadout: null,
  };
}

/** Convert a hired merc directly into an ArenaEntity. Wrapper over memberToArenaEntity. */
export function mercContractToArenaEntity(
  contract: MercContract,
  pos: ArenaSpawnPos,
): ArenaEntity {
  return memberToArenaEntity(memberFromMercContract(contract), pos, 0);
}

/** Convert an EnemyTemplate into an ArenaEntity at the given position */
export function enemyToArenaEntity(
  template: EnemyTemplate,
  index: number,
  pos: ArenaSpawnPos,
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
    position: { x: pos.x, y: pos.y, z: pos.z },
    targetId: null,
    attackRange: 1.5,
    moveSpeed: DEFAULT_MOVE_SPEED,
    animState: 'idle',
    facingRight: false,
    animStateUntil: 0,
    homeX: pos.x,
    homeY: pos.y,
    homeZ: pos.z,
    attackMoveState: 'home',
    spriteId: template.spriteId,
    flying: template.flying,
    isBoss: template.isBoss,
  };
}
