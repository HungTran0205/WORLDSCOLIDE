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

/** Convert a guild Member into an ArenaEntity at the given position */
export function memberToArenaEntity(member: Member, pos: { x: number; z: number }): ArenaEntity {
  const derived = calcDerivedCombatStats(member.stats, member.level);
  const entity: ArenaEntity = {
    id: member.id,
    name: member.name,
    isAlly: true,
    maxHp: derived.maxHp,
    currentHp: derived.maxHp,
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
    spriteId: template.spriteId,
    flying: template.flying,
    isBoss: template.isBoss,
  };
}
