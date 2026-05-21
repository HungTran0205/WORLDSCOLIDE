/**
 * Tavern spawn engine — determinism + rarity-distribution sanity.
 */

import { describe, it, expect } from 'vitest';
import {
  generateTavernRoster,
  rollRarity,
  RARITY_WEIGHTS,
  VISITOR_COUNT_BY_LEVEL,
  biasRarityWeightsByLuck,
  talentBudgetForRarity,
  getEffectiveKeeperStats,
  rerollSeedForDay,
} from './tavern-spawn';
import { dailyTavernSeed, mulberry32 } from './seeded-rng';
import type { Stats, Member } from '@/game/state/game-state';

const zeroStats = (): Stats => ({ STR: 0, END: 0, INT: 0, DEX: 0, CHA: 0, LCK: 0, AGI: 0 });

function member(id: string, partialStats: Partial<Stats>): Member {
  return {
    id,
    name: id,
    level: 1,
    exp: 0,
    stats: { ...zeroStats(), ...partialStats },
    unallocatedPoints: 0,
    skill: null,
    status: 'idle',
    injuredUntil: null,
    civilization: 'LinhSon',
    isFounder: false,
    rank: 'MEMBER',
    missionsCompleted: 0,
    rarity: 1,
  };
}

describe('VISITOR_COUNT_BY_LEVEL', () => {
  it('matches Phase 02 spec table', () => {
    expect(VISITOR_COUNT_BY_LEVEL[1]).toBe(3);
    expect(VISITOR_COUNT_BY_LEVEL[2]).toBe(3);
    expect(VISITOR_COUNT_BY_LEVEL[3]).toBe(4);
  });
});

describe('biasRarityWeightsByLuck', () => {
  it('no LCK = no shift', () => {
    const out = biasRarityWeightsByLuck([70, 30, 0, 0, 0], 0);
    expect(out).toEqual([70, 30, 0, 0, 0]);
  });

  it('shifts from lowest non-zero to highest non-zero', () => {
    const out = biasRarityWeightsByLuck([70, 30, 0, 0, 0], 10); // shift 5%
    expect(out[0]).toBeCloseTo(65);
    expect(out[1]).toBeCloseTo(35);
  });

  it('caps shift at effective LCK 50', () => {
    const out = biasRarityWeightsByLuck([70, 30, 0, 0, 0], 999);
    expect(out[0]).toBeCloseTo(45);
    expect(out[1]).toBeCloseTo(55);
  });
});

describe('rollRarity', () => {
  it('Lv1 yields only rarities 1-2 (per RARITY_WEIGHTS)', () => {
    const rng = mulberry32(1);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(rollRarity(1, 0, rng));
    expect(Array.from(seen).every((r) => r === 1 || r === 2)).toBe(true);
  });

  it('Lv3 distribution roughly matches table', () => {
    const rng = mulberry32(7);
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    const N = 4000;
    for (let i = 0; i < N; i++) counts[rollRarity(3, 0, rng)]++;
    const expected = RARITY_WEIGHTS[3]; // [40,35,25,0,0]
    expect(Math.abs(counts[1] / N - expected[0] / 100)).toBeLessThan(0.05);
    expect(Math.abs(counts[2] / N - expected[1] / 100)).toBeLessThan(0.05);
    expect(Math.abs(counts[3] / N - expected[2] / 100)).toBeLessThan(0.05);
  });
});

describe('talentBudgetForRarity', () => {
  it('matches Phase 02 spec: Lv1=50 … Lv5=130', () => {
    expect(talentBudgetForRarity(1)).toBe(50);
    expect(talentBudgetForRarity(2)).toBe(70);
    expect(talentBudgetForRarity(3)).toBe(90);
    expect(talentBudgetForRarity(4)).toBe(110);
    expect(talentBudgetForRarity(5)).toBe(130);
  });
});

describe('generateTavernRoster', () => {
  it('produces stable roster across reloads for same (saveSlotId, day)', () => {
    const seed = dailyTavernSeed('save-1', 12);
    const args = { level: 2 as const, keeperStats: null, daySeed: seed, spawnedDay: 12 };
    const rosterA = generateTavernRoster(args);
    const rosterB = generateTavernRoster(args);

    expect(rosterA).toHaveLength(VISITOR_COUNT_BY_LEVEL[2]);
    expect(rosterA.map((v) => v.id)).toEqual(rosterB.map((v) => v.id));
    expect(rosterA.map((v) => v.rarity)).toEqual(rosterB.map((v) => v.rarity));
    expect(rosterA.map((v) => v.stats)).toEqual(rosterB.map((v) => v.stats));
    expect(rosterA.map((v) => v.archetype)).toEqual(rosterB.map((v) => v.archetype));
  });

  it('different days yield different rosters', () => {
    const a = generateTavernRoster({ level: 1, keeperStats: null, daySeed: dailyTavernSeed('s', 1), spawnedDay: 1 });
    const b = generateTavernRoster({ level: 1, keeperStats: null, daySeed: dailyTavernSeed('s', 2), spawnedDay: 2 });
    expect(a.map((v) => v.id)).not.toEqual(b.map((v) => v.id));
  });

  it('assigns valid visitor traits + gift category + mood', () => {
    const roster = generateTavernRoster({ level: 1, keeperStats: null, daySeed: 123, spawnedDay: 0 });
    for (const v of roster) {
      expect(v.traits.length).toBeGreaterThan(0);
      expect(['consumable', 'material', 'equipable']).toContain(v.preferredGiftCategory);
      expect(v.dailyMoodBias).toBeGreaterThanOrEqual(-5);
      expect(v.dailyMoodBias).toBeLessThanOrEqual(5);
      expect(v.attemptHistory).toEqual([]);
      expect(v.veteranTag).toBe(false);
      expect(v.spawnedDay).toBe(0);
    }
  });

  it('respects unlockedCivs filter', () => {
    const roster = generateTavernRoster({
      level: 2,
      keeperStats: null,
      daySeed: 999,
      spawnedDay: 0,
      unlockedCivs: ['LinhSon'],
    });
    for (const v of roster) expect(v.civilization).toBe('LinhSon');
  });

  it('reroll seed yields different roster than base seed', () => {
    const baseSeed = dailyTavernSeed('save-1', 4);
    const altSeed = rerollSeedForDay(baseSeed);
    const a = generateTavernRoster({ level: 2, keeperStats: null, daySeed: baseSeed, spawnedDay: 4 });
    const b = generateTavernRoster({ level: 2, keeperStats: null, daySeed: altSeed, spawnedDay: 4 });
    expect(a.map((v) => v.id)).not.toEqual(b.map((v) => v.id));
  });

  it('reroll seed is itself deterministic', () => {
    const baseSeed = dailyTavernSeed('save-1', 4);
    const altSeed = rerollSeedForDay(baseSeed);
    const a = generateTavernRoster({ level: 2, keeperStats: null, daySeed: altSeed, spawnedDay: 4 });
    const b = generateTavernRoster({ level: 2, keeperStats: null, daySeed: altSeed, spawnedDay: 4 });
    expect(a.map((v) => v.id)).toEqual(b.map((v) => v.id));
  });
});

describe('getEffectiveKeeperStats (AD13)', () => {
  it('returns null when no keepers assigned', () => {
    expect(getEffectiveKeeperStats([], () => undefined)).toBeNull();
  });

  it('returns single keeper stats when one keeper', () => {
    const m = member('k1', { CHA: 12, INT: 8, LCK: 5 });
    const stats = getEffectiveKeeperStats(['k1'], (id) => (id === 'k1' ? m : undefined));
    expect(stats?.CHA).toBe(12);
    expect(stats?.INT).toBe(8);
    expect(stats?.LCK).toBe(5);
  });

  it('picks max per-stat across multiple keepers (AD13 best-stat aggregation)', () => {
    const closer = member('k1', { CHA: 15, INT: 5 });
    const scout = member('k2', { CHA: 6, INT: 14 });
    const lookup = (id: string) => (id === 'k1' ? closer : id === 'k2' ? scout : undefined);
    const stats = getEffectiveKeeperStats(['k1', 'k2'], lookup);
    expect(stats?.CHA).toBe(15); // from closer
    expect(stats?.INT).toBe(14); // from scout
  });
});
