/**
 * Mercenary generation — creates randomized mercenaries for the Tavern pool.
 * Reuses civilization + archetype data from civilization-config.ts.
 */

import { nanoid } from 'nanoid';
import type { Member, Stats } from '@/game/state/game-state';
import { CIV_ARCHETYPE_PROFILES } from '@/game/data/characters';
import { CIVILIZATIONS, CIV_CONFIG, applyCivBonuses } from '@/game/data/civilization-config';
import type { CivArchetype } from '@/game/data/civilization-config';

const BASE_STAT = 5;
const STAT_POINTS = 20; // total points to distribute per mercenary

function rollWeightedStats(weights: Record<string, number>): Stats {
  const keys = Object.keys(weights) as (keyof Stats)[];
  const totalWeight = keys.reduce((sum, k) => sum + weights[k], 0);
  const stats: Stats = { STR: BASE_STAT, END: BASE_STAT, INT: BASE_STAT, DEX: BASE_STAT, CHA: BASE_STAT, LCK: BASE_STAT, AGI: BASE_STAT };

  for (let i = 0; i < STAT_POINTS; i++) {
    let roll = Math.random() * totalWeight;
    for (const key of keys) {
      roll -= weights[key];
      if (roll <= 0) {
        stats[key] += 1;
        break;
      }
    }
  }
  return stats;
}

/** Generate `count` randomized mercenaries for the tavern pool */
export function generateMercenaries(count: number): Member[] {
  return Array.from({ length: count }, () => {
    const civ = CIVILIZATIONS[Math.floor(Math.random() * CIVILIZATIONS.length)];
    const civConfig = CIV_CONFIG[civ];
    const names = civConfig.namePool;
    const name = names[Math.floor(Math.random() * names.length)];
    const civArchetype = civConfig.archetypes[Math.floor(Math.random() * civConfig.archetypes.length)];
    const profile = CIV_ARCHETYPE_PROFILES[civArchetype as CivArchetype];
    const level = Math.floor(Math.random() * 3) + 1; // Lv1–3
    const baseStats = rollWeightedStats(profile.weights);
    const stats = applyCivBonuses(baseStats, civ);

    return {
      id: nanoid(),
      name,
      level,
      exp: 0,
      stats,
      unallocatedPoints: 0,
      skill: null,
      status: 'idle' as const,
      injuredUntil: null,
      civilization: civ,
      archetype: civArchetype,
      gender: (Math.random() < 0.5 ? 'M' : 'F') as const,
      isFounder: false,
      rank: 'MERCENARY' as const,
      missionsCompleted: 0,
    };
  });
}
