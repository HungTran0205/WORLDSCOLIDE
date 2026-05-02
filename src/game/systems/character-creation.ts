import type { Member, Stats } from '@/game/state/game-state';
import { CIV_ARCHETYPE_PROFILES } from '@/game/data/characters';
import { CIVILIZATIONS, CIV_CONFIG, applyCivBonuses } from '@/game/data/civilization-config';
import type { Civilization, Gender, CivArchetype } from '@/game/data/civilization-config';
import { getDefaultSkill } from '@/game/data/skills';
import { distributeStatsByWeights, INITIAL_STAT_POINTS } from './stat-allocation';
import { getStartingWeapon } from './equipment-bonuses';
import { DEFAULT_MEDICINE_SLOTS } from '@/game/state/guild-slice';

/** Pick random gender */
function randomGender(): Gender {
  return Math.random() < 0.5 ? 'M' : 'F';
}

export function createFounder(name: string, stats: Stats, civilization: Civilization): Member {
  const boostedStats = applyCivBonuses(stats, civilization);
  const civConfig = CIV_CONFIG[civilization];
  const archetype = civConfig.archetypes[0];
  const startingWeapon = getStartingWeapon(archetype);
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
    archetype,
    gender: randomGender(),
    isFounder: true,
    rank: 'COMMANDER',
    missionsCompleted: 0,
    equipment: startingWeapon ? { weapon: startingWeapon } : null,
    medicineSlots: structuredClone(DEFAULT_MEDICINE_SLOTS),
  };
}

export function generateRecruit(guildLevel: number): Member {
  const civ = CIVILIZATIONS[Math.floor(Math.random() * CIVILIZATIONS.length)];
  const civConfig = CIV_CONFIG[civ];
  const names = civConfig.namePool;
  const name = names[Math.floor(Math.random() * names.length)];
  const civArchetype = civConfig.archetypes[Math.floor(Math.random() * civConfig.archetypes.length)];
  const profile = CIV_ARCHETYPE_PROFILES[civArchetype as CivArchetype];
  const maxLevel = Math.min(guildLevel * 5, 80);
  const level = Math.max(1, Math.floor(Math.random() * maxLevel) + 1);
  const basePoints = INITIAL_STAT_POINTS + (level - 1) * 7;
  const baseStats = distributeStatsByWeights(basePoints, profile.weights);
  const stats = applyCivBonuses(baseStats, civ);

  const startingWeapon = getStartingWeapon(civArchetype);
  return {
    id: crypto.randomUUID(),
    name,
    level,
    exp: 0,
    stats,
    unallocatedPoints: 0,
    skill: level >= 5 ? getDefaultSkill(profile.name) : null,
    status: 'idle',
    injuredUntil: null,
    civilization: civ,
    archetype: civArchetype,
    gender: randomGender(),
    isFounder: false,
    rank: 'RECRUIT',
    missionsCompleted: 0,
    equipment: startingWeapon ? { weapon: startingWeapon } : null,
    medicineSlots: structuredClone(DEFAULT_MEDICINE_SLOTS),
  };
}
