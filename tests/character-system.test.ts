import { describe, it, expect } from 'vitest';
import { createEmptyStats, totalAllocated, distributeStatsByWeights, distributeStatsByWeightsRandom, INITIAL_STAT_POINTS, STAT_KEYS } from '@/game/systems/stat-allocation';
import { createFounder, generateRecruit } from '@/game/systems/character-creation';
import { mulberry32 } from '@/game/systems/seeded-rng';
import { GRADE_ORDER, GRADE_BUDGET } from '@/game/data/grades';

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
    const stats = distributeStatsByWeightsRandom(1000, scoutWeights, mulberry32(123));
    expect(stats.DEX).toBeGreaterThan(stats.INT);
  });
});

describe('Character Creation (grade model)', () => {
  it('should create founder with correct fields', () => {
    const stats = { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 10 };
    const founder = createFounder('TestHero', stats, 'LinhSon', 'sword', 'M', 'mask-01');
    expect(founder.name).toBe('TestHero');
    expect(founder.isFounder).toBe(true);
    expect(founder.isMercenary).toBe(false);
    expect(founder.grade).toBe('F');
    expect(GRADE_ORDER).toContain(founder.grade);
    expect(founder.civilization).toBe('LinhSon');
    expect(founder.archetype).toBe('sword');
    expect(founder.gender).toBe('M');
    expect(founder.maskSpriteId).toBe('mask-01');
    expect(founder.skill).not.toBeNull();
    expect(founder.equipment?.weapon).toBeTruthy();
    // civ bonuses may push total above grade-F budget — acceptable
    expect(totalAllocated(founder.stats)).toBeGreaterThanOrEqual(GRADE_BUDGET['F']);
  });

  it('should generate recruit with valid grade and stats', () => {
    const recruit = generateRecruit(1);
    expect(recruit.isFounder).toBe(false);
    expect(recruit.isMercenary).toBe(false);
    expect(GRADE_ORDER).toContain(recruit.grade);
    expect(recruit.id).toBeDefined();
    // stat sum >= grade budget (civ bonuses add on top of the budget)
    const total = totalAllocated(recruit.stats);
    expect(total).toBeGreaterThanOrEqual(GRADE_BUDGET[recruit.grade]);
  });

  it('should generate recruits with non-negative stats', () => {
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
