import type { Member, Stats } from '@/game/state/game-state';
import { CIV_ARCHETYPE_PROFILES } from '@/game/data/characters';
import { CIVILIZATIONS, CIV_CONFIG, applyCivBonuses } from '@/game/data/civilization-config';
import type { Civilization, Gender, CivArchetype } from '@/game/data/civilization-config';
import { getDefaultSkill } from '@/game/data/skills';
import type { Grade } from '@/game/data/grades';
import { GRADE_BUDGET, GRADE_ORDER } from '@/game/data/grades';
import { GRADE_WEIGHTS } from './tavern-spawn';
import { distributeStatsByWeights } from './stat-allocation';
import { weightedPick } from './seeded-rng';
import { getStartingWeapon } from './equipment-bonuses';
import { DEFAULT_MEDICINE_SLOTS } from '@/game/state/guild-slice';

/** Pick random gender */
function randomGender(): Gender {
  return Math.random() < 0.5 ? 'M' : 'F';
}

/**
 * Roll a grade for a recruit based on guild level using the same GRADE_WEIGHTS
 * table as the tavern (guild level caps at tavern level 3 for weight lookup).
 */
function rollRecruitGrade(guildLevel: number): Grade {
  const tavernLevel = Math.min(3, Math.max(1, guildLevel)) as 1 | 2 | 3;
  const weights = GRADE_WEIGHTS[tavernLevel];
  const entries = weights.map((w, i) => ({ value: GRADE_ORDER[i], weight: w }));
  return weightedPick(entries, Math.random);
}

export function createFounder(
  name: string,
  stats: Stats,
  civilization: Civilization,
  archetype: CivArchetype,
  gender: Gender,
  maskSpriteId: string,
): Member {
  const boostedStats = applyCivBonuses(stats, civilization);
  const startingWeapon = getStartingWeapon(archetype);
  return {
    id: crypto.randomUUID(),
    name,
    grade: 'F',
    isMercenary: false,
    stats: boostedStats,
    unallocatedPoints: 0,
    skill: getDefaultSkill(archetype), // founder skill matches the player's chosen archetype
    status: 'idle',
    injuredUntil: null,
    civilization,
    archetype,
    gender,
    isFounder: true,
    missionsCompleted: 0,
    traits: [],
    equipment: startingWeapon ? { weapon: startingWeapon } : null,
    maskSpriteId,
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
  const grade = rollRecruitGrade(guildLevel);
  const budget = GRADE_BUDGET[grade];
  const baseStats = distributeStatsByWeights(budget, profile.weights);
  const stats = applyCivBonuses(baseStats, civ);

  const startingWeapon = getStartingWeapon(civArchetype);
  return {
    id: crypto.randomUUID(),
    name,
    grade,
    isMercenary: false,
    stats,
    unallocatedPoints: 0,
    skill: getDefaultSkill(profile.name), // always assign skill — no level gate in grade model
    status: 'idle',
    injuredUntil: null,
    civilization: civ,
    archetype: civArchetype,
    gender: randomGender(),
    isFounder: false,
    missionsCompleted: 0,
    traits: [],
    equipment: startingWeapon ? { weapon: startingWeapon } : null,
    medicineSlots: structuredClone(DEFAULT_MEDICINE_SLOTS),
  };
}
