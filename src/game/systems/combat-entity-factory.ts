/**
 * Factory functions to convert Member/EnemyTemplate into ArenaEntity.
 * Extracted from CombatEngine to keep it under 200 lines.
 */

import type { Member } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';
import type { ArenaEntity } from './combat-arena-types';
import { getAttackRange, DEFAULT_MOVE_SPEED } from './combat-arena-types';
import { calcMaxHp, calcAttackInterval } from './combat-formulas';
import { createPassiveState, applyPassiveOnInit, snapshotBaseStats } from './combat-passives';

/** Convert a guild Member into an ArenaEntity at the given position */
export function memberToArenaEntity(member: Member, pos: { x: number; z: number }): ArenaEntity {
  const entity: ArenaEntity = {
    id: member.id,
    name: member.name,
    isAlly: true,
    maxHp: calcMaxHp(member.stats.END, member.level),
    currentHp: calcMaxHp(member.stats.END, member.level),
    stats: { ...member.stats },
    skill: member.skill ? { ...member.skill } : null,
    level: member.level,
    attackIntervalMs: calcAttackInterval(member.stats.AGI),
    nextAttackAt: calcAttackInterval(member.stats.AGI),
    skillCooldownUntil: 0,
    statusEffects: [],
    abilities: [],
    civilization: member.civilization,
    archetype: member.archetype,
    gender: member.gender,
    baseStats: snapshotBaseStats(member.stats),
    passiveState: createPassiveState(member.civilization),
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
export function enemyToArenaEntity(template: EnemyTemplate, index: number, pos: { x: number; z: number }): ArenaEntity {
  return {
    id: `enemy-${template.id}-${index}`,
    name: template.name,
    isAlly: false,
    maxHp: calcMaxHp(template.stats.END, template.level),
    currentHp: calcMaxHp(template.stats.END, template.level),
    stats: { ...template.stats },
    skill: template.skill ? { ...template.skill } : null,
    level: template.level,
    attackIntervalMs: calcAttackInterval(template.stats.AGI),
    nextAttackAt: calcAttackInterval(template.stats.AGI),
    skillCooldownUntil: 0,
    statusEffects: [],
    abilities: [...template.abilities],
    position: { ...pos },
    targetId: null,
    attackRange: 1.5,
    moveSpeed: DEFAULT_MOVE_SPEED,
    animState: 'idle',
    facingRight: false,
    animStateUntil: 0,
    spriteId: template.spriteId,
  };
}
