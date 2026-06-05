/**
 * Tavern visitor spawn engine.
 *
 * Pure, deterministic generation of TavernVisitor[] from (level, keeperStats, daySeed).
 * Roster size and grade weights scale with Tavern level; Keeper LCK biases grade.
 *
 * Reload-determinism: feeding the same daySeed always returns an identical roster.
 */

import type { Stats, TavernVisitor, RumorEntry, Member } from '@/game/state/game-state';
import type { TraitId } from '@/game/data/traits';
import { TRAIT_POOL } from '@/game/data/traits';
import { CIV_CONFIG, applyCivBonuses, CIVILIZATIONS, RECRUITABLE_UNITS } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { CIV_ARCHETYPE_PROFILES } from '@/game/data/characters';
import type { Grade } from '@/game/data/grades';
import { GRADE_ORDER, GRADE_BUDGET, gradeIndex } from '@/game/data/grades';
import { distributeStatsByWeightsRandom } from './stat-allocation';
import { mulberry32, hashSeed, pickFromList, pickDistinct, weightedPick } from './seeded-rng';
import { targetDemand } from './tavern-negotiation';

export type TavernLevel = 1 | 2 | 3;
export type GiftCategory = TavernVisitor['preferredGiftCategory'];

/**
 * Grade weight rows, in percent. Index = tavern level, value index = grade index [F,E,D,C,B,A,S].
 * MVP Lv1-3 only produces F/E/D (higher grade slots are 0).
 */
export const GRADE_WEIGHTS: Record<TavernLevel, [number, number, number, number, number, number, number]> = {
  1: [70, 30, 0, 0, 0, 0, 0],
  2: [55, 35, 10, 0, 0, 0, 0],
  3: [40, 35, 25, 0, 0, 0, 0],
};

/** Visitor count by tavern level (MVP Lv1-3). */
export const VISITOR_COUNT_BY_LEVEL: Record<TavernLevel, number> = {
  1: 3,
  2: 3,
  3: 4,
};

const GIFT_CATEGORIES: readonly GiftCategory[] = ['consumable', 'material', 'equipable'];

/** Visitor-eligible traits (filter out keeper-only). */
const VISITOR_TRAITS: TraitId[] = TRAIT_POOL.filter((t) => t.category !== 'keeper').map((t) => t.id);

/**
 * Compute LCK-biased grade weights.
 * Each LCK point shifts 0.5% from the lowest non-zero grade to the highest non-zero grade,
 * capped at 25% total shift (i.e. effective LCK clamped to 50).
 */
export function biasGradeWeightsByLuck(
  weights: readonly [number, number, number, number, number, number, number],
  keeperLck: number,
): [number, number, number, number, number, number, number] {
  const effectiveLck = Math.max(0, Math.min(50, keeperLck));
  const shiftPct = effectiveLck * 0.5;
  if (shiftPct <= 0) return [...weights] as [number, number, number, number, number, number, number];

  const result: [number, number, number, number, number, number, number] = [...weights] as [number, number, number, number, number, number, number];
  let lowestIdx = -1;
  let highestIdx = -1;
  for (let i = 0; i < result.length; i++) {
    if (result[i] > 0) {
      if (lowestIdx === -1) lowestIdx = i;
      highestIdx = i;
    }
  }
  if (lowestIdx === -1 || lowestIdx === highestIdx) return result;

  const drain = Math.min(shiftPct, result[lowestIdx]);
  result[lowestIdx] -= drain;
  result[highestIdx] += drain;
  return result;
}

/** Roll a Grade from tavern level + keeper LCK using a weighted table. Consumes exactly one rng draw via weightedPick. */
export function rollGrade(tavernLevel: TavernLevel, keeperLck: number, rng: () => number): Grade {
  const biased = biasGradeWeightsByLuck(GRADE_WEIGHTS[tavernLevel], keeperLck);
  const entries = biased.map((w, i) => ({ value: GRADE_ORDER[i], weight: w }));
  return weightedPick(entries, rng);
}

export interface GenerateRosterArgs {
  level: TavernLevel;
  keeperStats: Stats | null;        // null = no keeper assigned (LCK=0, etc.)
  daySeed: number;
  unlockedCivs?: readonly Civilization[]; // default: all CIVILIZATIONS
  spawnedDay: number;
}

/** Generate the full per-day roster — pure, deterministic given daySeed. */
export function generateTavernRoster(args: GenerateRosterArgs): TavernVisitor[] {
  const { level, keeperStats, daySeed, unlockedCivs = CIVILIZATIONS, spawnedDay } = args;
  const rng = mulberry32(daySeed);
  const count = VISITOR_COUNT_BY_LEVEL[level];
  const keeperLck = keeperStats?.LCK ?? 0;

  // Only civs with at least one recruitable unit can spawn (MVP: Linh Sơn only).
  const recruitableCivs = unlockedCivs.filter((c) => RECRUITABLE_UNITS[c].length > 0);
  const civs: readonly Civilization[] = recruitableCivs.length > 0 ? recruitableCivs : ['LinhSon'];

  // Track names assigned this day so the on-screen roster shows distinct names.
  const usedNames = new Set<string>();
  const roster: TavernVisitor[] = [];
  for (let i = 0; i < count; i++) {
    roster.push(generateTavernVisitor({
      level,
      keeperLck,
      rng,
      unlockedCivs: civs,
      usedNames,
      spawnedDay,
      daySeed,
      index: i,
    }));
  }
  return roster;
}

interface GenerateVisitorArgs {
  level: TavernLevel;
  keeperLck: number;
  rng: () => number;
  unlockedCivs: readonly Civilization[];
  usedNames: Set<string>;
  spawnedDay: number;
  daySeed: number;
  index: number;
}

function generateTavernVisitor(args: GenerateVisitorArgs): TavernVisitor {
  const { level, keeperLck, rng, unlockedCivs, usedNames, spawnedDay, daySeed, index } = args;

  const civ = pickFromList(unlockedCivs, rng);
  // Pick a recruitable (archetype, gender) unit — this gates BOTH the archetype
  // and the sprite gender, so non-playable sprites can never be generated.
  const unit = pickFromList(RECRUITABLE_UNITS[civ], rng);
  const archetype = unit.archetype;
  const gender = unit.gender;
  const name = pickVisitorName(civ, rng, usedNames);
  const grade = rollGrade(level, keeperLck, rng);
  const talentBudget = GRADE_BUDGET[grade];
  const profile = CIV_ARCHETYPE_PROFILES[archetype];

  const rawStats = distributeStatsByWeightsRandom(talentBudget, profile.weights, rng);
  const stats = applyCivBonuses(rawStats, civ);

  const dailyMoodBias = Math.floor(rng() * 11) - 5; // [-5, +5]
  const traits = pickVisitorTraits(rng);
  const preferredGiftCategory = pickFromList(GIFT_CATEGORIES, rng);

  const visitor: TavernVisitor = {
    id: `tav-${daySeed}-${index}`,
    name,
    archetype,
    civilization: civ,
    gender,
    grade,
    stats,
    derivedDemand: 0,
    dailyMoodBias,
    traits,
    preferredGiftCategory,
    attemptHistory: [],
    veteranTag: false,
    spawnedDay,
  };
  visitor.derivedDemand = targetDemand(visitor);
  return visitor;
}

/**
 * Pick a VN name from the civ pool, avoiding names already used this day.
 * Uses one rng draw for the start index then linear-probes (keeps the rng draw
 * count per visitor constant → reload-deterministic). Falls back to a repeat
 * only if the day's visitor count ever exceeds the pool size.
 */
function pickVisitorName(civ: Civilization, rng: () => number, used: Set<string>): string {
  const pool = CIV_CONFIG[civ].namePool;
  const start = Math.floor(rng() * pool.length);
  for (let i = 0; i < pool.length; i++) {
    const name = pool[(start + i) % pool.length];
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  return pool[start];
}

/** Pick 1-2 distinct visitor-eligible traits. */
function pickVisitorTraits(rng: () => number): TraitId[] {
  const n = rng() < 0.55 ? 1 : 2;
  return pickDistinct(VISITOR_TRAITS, Math.min(n, VISITOR_TRAITS.length), rng);
}

/**
 * Roll a rumor for the next day if the Keeper INT meets the visibility threshold.
 * Returns null when no rumor is generated (low INT or empty roster).
 */
export function generateRumor(
  nextDayRoster: TavernVisitor[],
  keeperInt: number,
  forDay: number,
  rng: () => number,
): RumorEntry | null {
  if (keeperInt < 15 || nextDayRoster.length === 0) return null;
  const target = pickFromList(nextDayRoster, rng);
  let tier: RumorEntry['tier'] = 'vague';
  if (keeperInt >= 25) tier = 'specific';
  else if (keeperInt >= 20) tier = 'class';
  return {
    forDay,
    tier,
    ...(tier !== 'vague' ? { archetype: target.archetype } : {}),
    ...(tier === 'specific' ? { civilization: target.civilization } : {}),
  };
}

/**
 * Aggregate effective keeper stats from one or more assigned keeper Members.
 * AD13: BEST stat wins (CHA closer + INT scout can both contribute their highest stat).
 * Returns null if no keepers assigned or none found.
 */
export function getEffectiveKeeperStats(
  keeperIds: string[],
  lookup: (id: string) => Member | undefined,
): Stats | null {
  const keepers = keeperIds.map(lookup).filter((m): m is Member => Boolean(m));
  if (keepers.length === 0) return null;
  const merged: Stats = { STR: 0, END: 0, INT: 0, DEX: 0, CHA: 0, LCK: 0, AGI: 0 };
  for (const k of keepers) {
    for (const key of Object.keys(merged) as (keyof Stats)[]) {
      if (k.stats[key] > merged[key]) merged[key] = k.stats[key];
    }
  }
  return merged;
}

/** Deterministic reroll seed — `hashSeed(daySeed, 'reroll')` keeps reroll save-scum-safe. */
export function rerollSeedForDay(daySeed: number): number {
  return hashSeed(daySeed, 'reroll');
}
