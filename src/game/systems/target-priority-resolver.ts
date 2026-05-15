/**
 * Target priority resolver — team-level targeting strategy for the idle combat panel.
 *
 * Two strategies (D2):
 *   focus   — all allies share one primary target, auto-picked by priority chain
 *   balance — each ally targets enemy in matching row, fallback to nearest
 *
 * Focus mode primary target priority (TENTATIVE per phase-01 spec, revisit after Phase 6):
 *   1. Boss tag (isBoss === true)
 *   2. Healer (skill kit contains 'heal-ally' ability OR heal in skill name)
 *   3. Highest current HP (burst-priority tanks first)
 *   4. Closest to ally formation (tie-break)
 */

import type { ArenaEntity } from './combat-arena-types';

/** Pick the shared primary target for Focus mode from the alive enemy pool */
export function pickFocusPrimary(allEntities: ArenaEntity[]): ArenaEntity | null {
  const enemies = allEntities.filter(e => !e.isAlly && e.currentHp > 0);
  if (enemies.length === 0) return null;

  // 1. Boss tag wins outright
  const boss = enemies.find(e => e.isBoss === true);
  if (boss) return boss;

  // 2. Healer — anything with heal-ally ability
  const healer = enemies.find(e => e.abilities?.some(a => a.type === 'heal-ally'));
  if (healer) return healer;

  // 3 + 4. Highest currentHp; closest-to-ally as tie-break
  const allyCentroidX = computeAllyCentroidX(allEntities);
  return enemies.reduce<ArenaEntity | null>((best, candidate) => {
    if (!best) return candidate;
    if (candidate.currentHp > best.currentHp) return candidate;
    if (candidate.currentHp < best.currentHp) return best;
    // tie on HP → pick closer to ally centroid
    const dCand = Math.abs(candidate.position.x - allyCentroidX);
    const dBest = Math.abs(best.position.x - allyCentroidX);
    return dCand < dBest ? candidate : best;
  }, null);
}

/**
 * Find the row-aligned target for a single ally in Balance mode.
 * Row by Z lane; falls back to nearest enemy (any row) when row is empty.
 * Returns null when no enemies remain.
 */
export function pickBalanceTarget(ally: ArenaEntity, allEntities: ArenaEntity[]): ArenaEntity | null {
  const enemies = allEntities.filter(e => !e.isAlly && e.currentHp > 0);
  if (enemies.length === 0) return null;

  // Same-lane enemies (within 1 unit on Z axis)
  const sameLane = enemies.filter(e => Math.abs(e.position.z - ally.position.z) < 1);
  const pool = sameLane.length > 0 ? sameLane : enemies;

  // Nearest by 2D distance within the chosen pool
  return pool.reduce<ArenaEntity | null>((best, candidate) => {
    if (!best) return candidate;
    const dCand = dist(ally, candidate);
    const dBest = dist(ally, best);
    return dCand < dBest ? candidate : best;
  }, null);
}

function dist(a: ArenaEntity, b: ArenaEntity): number {
  const dx = a.position.x - b.position.x;
  const dz = a.position.z - b.position.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function computeAllyCentroidX(allEntities: ArenaEntity[]): number {
  const allies = allEntities.filter(e => e.isAlly && e.currentHp > 0);
  if (allies.length === 0) return 0;
  return allies.reduce((sum, a) => sum + a.position.x, 0) / allies.length;
}
