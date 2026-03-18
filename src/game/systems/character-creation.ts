import type { Member, Stats } from '@/game/state/game-state';
import { SKILL_DANH_MANH } from '@/game/data/skills';
import { ARCHETYPES, NAME_POOLS, CIVILIZATIONS } from '@/game/data/characters';
import { distributeStatsByWeights, INITIAL_STAT_POINTS } from './stat-allocation';

export function createFounder(name: string, stats: Stats): Member {
  return {
    id: crypto.randomUUID(),
    name,
    level: 1,
    exp: 0,
    stats,
    unallocatedPoints: 0,
    skill: { ...SKILL_DANH_MANH },
    status: 'idle',
    injuredUntil: null,
    civilization: 'Viet',
    isFounder: true,
    rank: 'COMMANDER',
    missionsCompleted: 0,
  };
}

export function generateRecruit(guildLevel: number): Member {
  const civ = CIVILIZATIONS[Math.floor(Math.random() * CIVILIZATIONS.length)];
  const names = NAME_POOLS[civ];
  const name = names[Math.floor(Math.random() * names.length)];
  const archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
  const maxLevel = Math.min(guildLevel * 5, 80);
  const level = Math.max(1, Math.floor(Math.random() * maxLevel) + 1);
  const basePoints = INITIAL_STAT_POINTS + (level - 1) * 7;

  return {
    id: crypto.randomUUID(),
    name,
    level,
    exp: 0,
    stats: distributeStatsByWeights(basePoints, archetype.weights),
    unallocatedPoints: 0,
    skill: { ...SKILL_DANH_MANH },
    status: 'idle',
    injuredUntil: null,
    civilization: civ,
    isFounder: false,
    rank: 'RECRUIT',
    missionsCompleted: 0,
  };
}
