import type { Member, Stats } from '@/game/state/game-state';
import { ARCHETYPES } from '@/game/data/characters';
import { CIVILIZATIONS, CIV_CONFIG, applyCivBonuses } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { getDefaultSkill } from '@/game/data/skills';
import { distributeStatsByWeights, INITIAL_STAT_POINTS } from './stat-allocation';

export function createFounder(name: string, stats: Stats, civilization: Civilization): Member {
  const boostedStats = applyCivBonuses(stats, civilization);
  return {
    id: crypto.randomUUID(),
    name,
    level: 1,
    exp: 0,
    stats: boostedStats,
    unallocatedPoints: 0,
    skill: getDefaultSkill('warrior'), // founder always warrior (validated M2 decision)
    status: 'idle',
    injuredUntil: null,
    civilization,
    isFounder: true,
    rank: 'COMMANDER',
    missionsCompleted: 0,
  };
}

export function generateRecruit(guildLevel: number): Member {
  const civ = CIVILIZATIONS[Math.floor(Math.random() * CIVILIZATIONS.length)];
  const names = CIV_CONFIG[civ].namePool;
  const name = names[Math.floor(Math.random() * names.length)];
  const archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
  const maxLevel = Math.min(guildLevel * 5, 80);
  const level = Math.max(1, Math.floor(Math.random() * maxLevel) + 1);
  const basePoints = INITIAL_STAT_POINTS + (level - 1) * 7;
  const baseStats = distributeStatsByWeights(basePoints, archetype.weights);
  const stats = applyCivBonuses(baseStats, civ);

  return {
    id: crypto.randomUUID(),
    name,
    level,
    exp: 0,
    stats,
    unallocatedPoints: 0,
    skill: level >= 5 ? getDefaultSkill(archetype.name) : null,
    status: 'idle',
    injuredUntil: null,
    civilization: civ,
    isFounder: false,
    rank: 'RECRUIT',
    missionsCompleted: 0,
  };
}
