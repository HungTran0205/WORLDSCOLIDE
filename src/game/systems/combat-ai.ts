/**
 * Combat AI — targeting and movement logic for the real-time arena engine.
 * Extracted from combat-engine for modularity and testability.
 */

import {
  ARENA_BOUNDS,
  FORMATION_STEP_DISTANCE,
  FORMATION_STEP_DURATION_MS,
  FORMATION_RETURN_DURATION_MS,
  type ArenaEntity,
} from './combat-arena-types';
import type { CombatEvent } from './combat-types';

/** Find best target: nearest alive enemy, weighted toward front-row and same lane */
export function findTarget(entity: ArenaEntity, allEntities: ArenaEntity[]): ArenaEntity | null {
  const enemies = allEntities.filter(e => e.currentHp > 0 && e.isAlly !== entity.isAlly);
  if (enemies.length === 0) return null;

  let best: ArenaEntity | null = null;
  let bestScore = Infinity;
  for (const enemy of enemies) {
    const dx = enemy.position.x - entity.position.x;
    const dz = enemy.position.z - entity.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Front-row aggro bonus (enemies closer to center)
    const frontBonus = Math.abs(enemy.position.x) < 5 ? 2 : 0;
    // Same-lane bonus: prefer targets on matching Z lane
    const laneDist = Math.abs(enemy.position.z - entity.position.z);
    const laneBonus = laneDist < 1 ? 1.5 : 0;
    const score = dist - frontBonus - laneBonus;
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

/**
 * Move entity toward target position with beat-em-up priority:
 * X movement is primary (full speed), Z lane drift is secondary (60% speed).
 * Returns true if arrived within stopDistance.
 */
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

  const xStep = entity.moveSpeed * dtSeconds;
  const zStep = entity.moveSpeed * 0.6 * dtSeconds; // slower lane switching

  // Move X first (primary axis)
  if (Math.abs(dx) > 0.1) {
    const xMove = Math.min(xStep, Math.abs(dx));
    entity.position.x += Math.sign(dx) * xMove;
  }

  // Drift Z toward target lane (secondary)
  if (Math.abs(dz) > 0.3) {
    const zMove = Math.min(zStep, Math.abs(dz));
    entity.position.z += Math.sign(dz) * zMove;
  }

  clampToBounds(entity);
  entity.facingRight = dx > 0;

  // Re-check after movement
  const newDx = targetPos.x - entity.position.x;
  const newDz = targetPos.z - entity.position.z;
  return Math.sqrt(newDx * newDx + newDz * newDz) <= stopDistance;
}

/**
 * Lerp entity toward its step-target position.
 * Returns true when arrived (within 0.1 units).
 */
export function stepForwardToAttack(entity: ArenaEntity, dtSeconds: number): boolean {
  if (entity.stepTargetX === undefined || entity.stepTargetZ === undefined) return true;
  const stepSpeed = FORMATION_STEP_DISTANCE / (FORMATION_STEP_DURATION_MS / 1000);
  const dx = entity.stepTargetX - entity.position.x;
  const dz = entity.stepTargetZ - entity.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist <= 0.1) {
    entity.position.x = entity.stepTargetX;
    entity.position.z = entity.stepTargetZ;
    return true;
  }
  const move = stepSpeed * dtSeconds;
  if (move >= dist) {
    entity.position.x = entity.stepTargetX;
    entity.position.z = entity.stepTargetZ;
    return true;
  }
  entity.position.x += (dx / dist) * move;
  entity.position.z += (dz / dist) * move;
  return false;
}

/**
 * Lerp entity back toward its formation home position.
 * Returns true when arrived (within 0.1 units).
 */
export function returnToHome(entity: ArenaEntity, dtSeconds: number): boolean {
  const returnSpeed = FORMATION_STEP_DISTANCE / (FORMATION_RETURN_DURATION_MS / 1000);
  const dx = entity.homeX - entity.position.x;
  const dz = entity.homeZ - entity.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist <= 0.1) {
    entity.position.x = entity.homeX;
    entity.position.z = entity.homeZ;
    return true;
  }
  const move = returnSpeed * dtSeconds;
  if (move >= dist) {
    entity.position.x = entity.homeX;
    entity.position.z = entity.homeZ;
    return true;
  }
  entity.position.x += (dx / dist) * move;
  entity.position.z += (dz / dist) * move;
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
