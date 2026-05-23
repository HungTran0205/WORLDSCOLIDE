import { describe, it, expect } from 'vitest';
import { expToNextLevel, gainExp, LEVEL_UP_BONUS_POINTS } from '@/game/systems/leveling-system';
import { createEmptyStats, totalAllocated, distributeStatsByWeights, distributeStatsByWeightsRandom, INITIAL_STAT_POINTS, STAT_KEYS } from '@/game/systems/stat-allocation';
import { createFounder, generateRecruit } from '@/game/systems/character-creation';
import { mulberry32 } from '@/game/systems/seeded-rng';

describe('Leveling System', () => {
  it('should return correct EXP for early levels', () => {
    expect(expToNextLevel(1)).toBe(100);
    expect(expToNextLevel(2)).toBe(150);
    expect(expToNextLevel(3)).toBe(220);
    expect(expToNextLevel(4)).toBe(310);
  });

  it('should scale EXP by 1.35x from level 5+', () => {
    const lv5 = expToNextLevel(5);
    expect(lv5).toBe(430);
    const lv6 = expToNextLevel(6);
    expect(lv6).toBe(Math.floor(430 * 1.35));
  });

  it('should handle multi-level gain', () => {
    const result = gainExp(1, 0, 500);
    expect(result.newLevel).toBeGreaterThan(1);
    expect(result.levelsGained).toBeGreaterThan(0);
    expect(result.remainingExp).toBeLessThan(expToNextLevel(result.newLevel));
  });

  it('should handle exact level-up amount', () => {
    const result = gainExp(1, 0, 100);
    expect(result.newLevel).toBe(2);
    expect(result.remainingExp).toBe(0);
    expect(result.levelsGained).toBe(1);
  });

  it('should provide 5 bonus points per level', () => {
    expect(LEVEL_UP_BONUS_POINTS).toBe(5);
  });
});

describe('Stat Allocation', () => {
  it('should create empty stats (all zeros)', () => {
    const stats = createEmptyStats();
    expect(totalAllocated(stats)).toBe(0);
  });

  it('should distribute stats by weights summing to total points', () => {
    const weights = { STR: 3, END: 2, INT: 0.5, DEX: 1, CHA: 0.5, LCK: 0.5, AGI: 1 };
    const stats = distributeStatsByWeights(50, weights);
    expect(totalAllocated(stats)).toBe(50);
    // STR should have the most points (highest weight)
    expect(stats.STR).toBeGreaterThan(stats.INT);
  });

  it('should use INITIAL_STAT_POINTS = 50', () => {
    expect(INITIAL_STAT_POINTS).toBe(50);
  });
});

describe('Weighted-random stat distribution', () => {
  const scoutWeights = { STR: 1, END: 1, INT: 0.5, DEX: 3, CHA: 0.5, LCK: 1, AGI: 2 };

  it('distributes exactly `points` total, all non-negative', () => {
    const stats = distributeStatsByWeightsRandom(70, scoutWeights, mulberry32(42));
    expect(totalAllocated(stats)).toBe(70);
    for (const key of STAT_KEYS) expect(stats[key]).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic for the same seed (reload-safe)', () => {
    const a = distributeStatsByWeightsRandom(70, scoutWeights, mulberry32(7));
    const b = distributeStatsByWeightsRandom(70, scoutWeights, mulberry32(7));
    expect(a).toEqual(b);
  });

  it('never assigns points to a zero-weight stat', () => {
    const weights = { ...scoutWeights, INT: 0 };
    const stats = distributeStatsByWeightsRandom(200, weights, mulberry32(99));
    expect(stats.INT).toBe(0);
  });

  it('biases toward higher-weight stats over a large sample', () => {
    // DEX (weight 3) should out-roll INT (weight 0.5) given enough points.
    const stats = distributeStatsByWeightsRandom(1000, scoutWeights, mulberry32(123));
    expect(stats.DEX).toBeGreaterThan(stats.INT);
  });
});

describe('Character Creation', () => {
  it('should create founder with correct stats', () => {
    const stats = { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 10 };
    const founder = createFounder('TestHero', stats, 'LinhSon', 'sword', 'M', 'mask-01');
    expect(founder.name).toBe('TestHero');
    expect(founder.isFounder).toBe(true);
    expect(founder.level).toBe(1);
    expect(founder.civilization).toBe('LinhSon');
    // Player-chosen identity is honored (new 6-arg contract).
    expect(founder.archetype).toBe('sword');
    expect(founder.gender).toBe('M');
    expect(founder.maskSpriteId).toBe('mask-01');
    expect(founder.skill).not.toBeNull();
    expect(founder.equipment?.weapon).toBeTruthy(); // starting weapon resolved from archetype
    // Civ bonuses apply: END*1.2=12, DEX*1.1=5, STR*1.1=11 → total > 50
    expect(totalAllocated(founder.stats)).toBeGreaterThanOrEqual(50);
  });

  it('should generate recruit within guild level cap', () => {
    const recruit = generateRecruit(1);
    expect(recruit.isFounder).toBe(false);
    expect(recruit.level).toBeGreaterThanOrEqual(1);
    expect(recruit.level).toBeLessThanOrEqual(5); // guildLevel 1 * 5
    expect(recruit.id).toBeDefined();
  });

  it('should generate recruits with valid stats', () => {
    for (let i = 0; i < 10; i++) {
      const recruit = generateRecruit(2);
      const total = totalAllocated(recruit.stats);
      expect(total).toBeGreaterThan(0);
      for (const key of STAT_KEYS) {
        expect(recruit.stats[key]).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
