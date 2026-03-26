/**
 * Combat AI — targeting and movement logic for the real-time arena engine.
 * Extracted from combat-engine for modularity and testability.
 */

import { ARENA_BOUNDS, type ArenaEntity } from './combat-arena-types';
import type { CombatEvent } from './combat-types';

/** Find best target: nearest alive enemy, weighted toward front-row (lower |x|) */
export function findTarget(entity: ArenaEntity, allEntities: ArenaEntity[]): ArenaEntity | null {
  const enemies = allEntities.filter(e => e.currentHp > 0 && e.isAlly !== entity.isAlly);
  if (enemies.length === 0) return null;

  let best: ArenaEntity | null = null;
  let bestScore = Infinity;
  for (const enemy of enemies) {
    const dx = enemy.position.x - entity.position.x;
    const dz = enemy.position.z - entity.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Front-row aggro: subtract bonus for enemies closer to center (|x| < 5)
    const frontBonus = Math.abs(enemy.position.x) < 5 ? 2 : 0;
    const score = dist - frontBonus;
    if (score < bestScore) {
      bestScore = score;
      best = enemy;
    }
  }
  return best;
}

/** Calculate distance between two entities */
export function getDistance(a: ArenaEntity, b: ArenaEntity): number {
  const dx = a.position.x - b.position.x;
  const dz = a.position.z - b.position.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/** Move entity toward target position. Returns true if arrived within stopDistance. */
export function moveToward(
  entity: ArenaEntity,
  targetPos: { x: number; z: number },
  stopDistance: number,
  dtSeconds: number,
): boolean {
  const dx = targetPos.x - entity.position.x;
  const dz = targetPos.z - entity.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist <= stopDistance) return true;

  const step = entity.moveSpeed * dtSeconds;
  if (step >= dist - stopDistance) {
    // Snap to stop distance
    const ratio = (dist - stopDistance) / dist;
    entity.position.x += dx * ratio;
    entity.position.z += dz * ratio;
    clampToBounds(entity);
    return true;
  }

  entity.position.x += (dx / dist) * step;
  entity.position.z += (dz / dist) * step;
  clampToBounds(entity);

  // Update facing direction
  entity.facingRight = dx > 0;
  return false;
}

/** Clamp entity position to arena boundaries */
function clampToBounds(entity: ArenaEntity): void {
  entity.position.x = Math.max(ARENA_BOUNDS.minX, Math.min(ARENA_BOUNDS.maxX, entity.position.x));
  entity.position.z = Math.max(ARENA_BOUNDS.minZ, Math.min(ARENA_BOUNDS.maxZ, entity.position.z));
}

/** Process enemy abilities (poison, stun, enrage, heal) after an attack */
export function processAbilities(
  entity: ArenaEntity,
  allEntities: ArenaEntity[],
  eventQueue: CombatEvent[],
): void {
  for (const ability of entity.abilities) {
    if (Math.random() >= ability.chance) continue;

    if (ability.type === 'poison-attack') {
      const t = findTarget(entity, allEntities);
      if (t && !t.statusEffects.some(e => e.type === 'poisoned')) {
        t.statusEffects.push({ type: 'poisoned', ticksRemaining: 6 });
        eventQueue.push({ type: 'effect-applied', targetId: t.id, effect: 'poisoned' });
      }
    } else if (ability.type === 'stun-attack') {
      const t = findTarget(entity, allEntities);
      if (t && !t.statusEffects.some(e => e.type === 'stunned')) {
        t.statusEffects.push({ type: 'stunned', ticksRemaining: 2 });
        eventQueue.push({ type: 'effect-applied', targetId: t.id, effect: 'stunned' });
      }
    } else if (ability.type === 'enrage') {
      if (!entity.statusEffects.some(e => e.type === 'boosted')) {
        entity.statusEffects.push({ type: 'boosted', ticksRemaining: 4 });
        eventQueue.push({ type: 'effect-applied', targetId: entity.id, effect: 'boosted' });
      }
    } else if (ability.type === 'heal-ally') {
      const allies = allEntities.filter(e => e.isAlly === entity.isAlly && e.currentHp > 0 && e.id !== entity.id);
      if (allies.length > 0) {
        const lowest = allies.reduce((min, e) => (e.currentHp < min.currentHp ? e : min));
        const heal = Math.floor(entity.maxHp * 0.15);
        lowest.currentHp = Math.min(lowest.maxHp, lowest.currentHp + heal);
        eventQueue.push({ type: 'heal', healerId: entity.id, targetId: lowest.id, amount: heal });
      }
    }
  }
}
