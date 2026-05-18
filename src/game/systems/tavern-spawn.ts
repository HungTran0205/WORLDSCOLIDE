/**
 * Tavern visitor spawn engine.
 *
 * Pure, deterministic generation of TavernVisitor[] from (level, keeperStats, daySeed).
 * Roster size and rarity weights scale with Tavern level; Keeper LCK biases rarity.
 *
 * Reload-determinism: feeding the same daySeed always returns an identical roster.
 */

import type { Stats, TavernVisitor, RumorEntry, Member } from '@/game/state/game-state';
import type { TraitId } from '@/game/data/traits';
import { TRAIT_POOL } from '@/game/data/traits';
import { CIV_CONFIG, applyCivBonuses, CIVILIZATIONS } from '@/game/data/civilization-config';
import type { Civilization, CivArchetype } from '@/game/data/civilization-config';
import { CIV_ARCHETYPE_PROFILES } from '@/game/data/characters';
import { distributeStatsByWeights } from './stat-allocation';
import { mulberry32, hashSeed, pickFromList, pickDistinct, weightedPick } from './seeded-rng';
import { targetDemand } from './tavern-negotiation';

export type TavernLevel = 1 | 2 | 3;
export type GiftCategory = TavernVisitor['preferredGiftCategory'];

/** Rarity weight rows, in percent. Index = level - 1, value index = rarity - 1. */
export const RARITY_WEIGHTS: Record<TavernLevel, [number, number, number, number, number]> = {
  1: [70, 30, 0, 0, 0],
  2: [55, 35, 10, 0, 0],
  3: [40, 35, 25, 0, 0],
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
 * Compute LCK-biased rarity weights.
 * Each LCK point shifts 0.5% from the lowest non-zero rarity to the highest non-zero rarity,
 * capped at 25% total shift (i.e. effective LCK clamped to 50).
 */
export function biasRarityWeightsByLuck(
  weights: readonly [number, number, number, number, number],
  keeperLck: number,
): [number, number, number, number, number] {
  const effectiveLck = Math.max(0, Math.min(50, keeperLck));
  const shiftPct = effectiveLck * 0.5;
  if (shiftPct <= 0) return [...weights] as [number, number, number, number, number];

  const result: [number, number, number, number, number] = [...weights] as [number, number, number, number, number];
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

/** Roll a rarity 1-5 from level + keeper LCK using a weighted table. */
export function rollRarity(level: TavernLevel, keeperLck: number, rng: () => number): 1 | 2 | 3 | 4 | 5 {
  const biased = biasRarityWeightsByLuck(RARITY_WEIGHTS[level], keeperLck);
  const entries = biased.map((w, i) => ({ value: (i + 1) as 1 | 2 | 3 | 4 | 5, weight: w }));
  return weightedPick(entries, rng);
}

/** Talent budget by rarity — Lv1=50 … Lv5=130. */
export function talentBudgetForRarity(rarity: 1 | 2 | 3 | 4 | 5): number {
  return 50 + (rarity - 1) * 20;
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

  const roster: TavernVisitor[] = [];
  for (let i = 0; i < count; i++) {
    roster.push(generateTavernVisitor({
      level,
      keeperLck,
      rng,
      unlockedCivs,
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
  spawnedDay: number;
  daySeed: number;
  index: number;
}

function generateTavernVisitor(args: GenerateVisitorArgs): TavernVisitor {
  const { level, keeperLck, rng, unlockedCivs, spawnedDay, daySeed, index } = args;

  const civ = pickFromList(unlockedCivs, rng);
  const archetype = pickFromList(CIV_CONFIG[civ].archetypes, rng) as CivArchetype;
  const rarity = rollRarity(level, keeperLck, rng);
  const talentBudget = talentBudgetForRarity(rarity);
  const profile = CIV_ARCHETYPE_PROFILES[archetype];

  const rawStats = distributeStatsByWeights(talentBudget, profile.weights);
  const stats = applyCivBonuses(rawStats, civ);

  const dailyMoodBias = Math.floor(rng() * 11) - 5; // [-5, +5]
  const traits = pickVisitorTraits(rng);
  const preferredGiftCategory = pickFromList(GIFT_CATEGORIES, rng);
  const visitorLevel = Math.max(1, Math.min(level + 2, 1 + Math.floor((rarity - 1) * 1.5))); // soft band by rarity

  const visitor: TavernVisitor = {
    id: `tav-${daySeed}-${index}`,
    archetype,
    civilization: civ,
    rarity,
    level: visitorLevel,
    stats,
    derivedDemand: 0,
    dailyMoodBias,
    traits,
    preferredGiftCategory,
    attemptHistory: [],
    veteranTag: false,
    spawnedDay,
  };
  // Phase 03: real demand = floor(power × 0.4) + rarity×5 + moodBias.
  visitor.derivedDemand = targetDemand(visitor);
  return visitor;
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
