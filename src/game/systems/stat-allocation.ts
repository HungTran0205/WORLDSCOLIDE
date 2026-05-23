import type { Stats, StatKey, Member } from '@/game/state/game-state';
import { weightedPick } from './seeded-rng';

export const INITIAL_STAT_POINTS = 50;
export const STAT_KEYS: StatKey[] = ['STR', 'END', 'INT', 'DEX', 'CHA', 'LCK', 'AGI'];

export function createEmptyStats(): Stats {
  return { STR: 0, END: 0, INT: 0, DEX: 0, CHA: 0, LCK: 0, AGI: 0 };
}

export function totalAllocated(stats: Stats): number {
  return STAT_KEYS.reduce((sum, k) => sum + stats[k], 0);
}

export function allocatePoint(member: Member, stat: StatKey): Member {
  if (member.unallocatedPoints <= 0) return member;
  return {
    ...member,
    stats: { ...member.stats, [stat]: member.stats[stat] + 1 },
    unallocatedPoints: member.unallocatedPoints - 1,
  };
}

/** Distribute stat points by archetype weights */
export function distributeStatsByWeights(
  points: number,
  weights: Record<StatKey, number>,
): Stats {
  const totalWeight = STAT_KEYS.reduce((s, k) => s + weights[k], 0);
  const stats = createEmptyStats();
  let remaining = points;

  for (const key of STAT_KEYS) {
    const alloc = Math.floor((weights[key] / totalWeight) * points);
    stats[key] = alloc;
    remaining -= alloc;
  }

  // Distribute remainder to highest-weighted stat
  const sorted = [...STAT_KEYS].sort((a, b) => weights[b] - weights[a]);
  stats[sorted[0]] += remaining;
  return stats;
}

/**
 * Distribute stat points by archetype weights using a seeded RNG.
 *
 * Each point lands on a stat with probability proportional to its archetype
 * weight, so the build keeps the archetype's identity (a scout still leans
 * DEX/AGI) while varying from roll to roll. Deterministic for a given rng
 * sequence — feeding the same seed always yields the same Stats, which keeps
 * the tavern roster reload-safe.
 */
export function distributeStatsByWeightsRandom(
  points: number,
  weights: Record<StatKey, number>,
  rng: () => number,
): Stats {
  const stats = createEmptyStats();
  const entries = STAT_KEYS.map((key) => ({ value: key, weight: weights[key] }));
  for (let i = 0; i < points; i++) {
    stats[weightedPick(entries, rng)] += 1;
  }
  return stats;
}
