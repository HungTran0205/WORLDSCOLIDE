/**
 * Seeded RNG primitives — determinism & distribution sanity checks.
 */

import { describe, it, expect } from 'vitest';
import {
  mulberry32,
  hashSeed,
  dailyTavernSeed,
  attemptSeed,
  pickFromList,
  pickDistinct,
  weightedPick,
} from './seeded-rng';

describe('mulberry32', () => {
  it('produces identical sequences for the same seed', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    for (let i = 0; i < 16; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    let allEqual = true;
    for (let i = 0; i < 16; i++) {
      if (a() !== b()) { allEqual = false; break; }
    }
    expect(allEqual).toBe(false);
  });

  it('output stays in [0, 1)', () => {
    const rng = mulberry32(777);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('mean over many samples is close to 0.5', () => {
    const rng = mulberry32(42);
    let sum = 0;
    const n = 5000;
    for (let i = 0; i < n; i++) sum += rng();
    expect(Math.abs(sum / n - 0.5)).toBeLessThan(0.02);
  });
});

describe('hashSeed', () => {
  it('is deterministic across calls', () => {
    expect(hashSeed('tavern', 'founder-1', 7)).toBe(hashSeed('tavern', 'founder-1', 7));
  });

  it('namespaces inputs (order matters)', () => {
    expect(hashSeed('a', 'b')).not.toBe(hashSeed('b', 'a'));
  });

  it('different keys yield different hashes', () => {
    expect(hashSeed('tavern', 'founder-1', 7)).not.toBe(hashSeed('tavern', 'founder-1', 8));
    expect(hashSeed('tavern', 'founder-1', 7)).not.toBe(hashSeed('tavern', 'founder-2', 7));
  });

  it('returns an unsigned 32-bit integer', () => {
    const h = hashSeed('foo', 42);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
    expect(Number.isInteger(h)).toBe(true);
  });
});

describe('dailyTavernSeed', () => {
  it('same (saveSlotId, gameDay) produces same seed', () => {
    expect(dailyTavernSeed('save-1', 5)).toBe(dailyTavernSeed('save-1', 5));
  });

  it('different gameDay produces different seed', () => {
    expect(dailyTavernSeed('save-1', 5)).not.toBe(dailyTavernSeed('save-1', 6));
  });

  it('different saveSlotId produces different seed', () => {
    expect(dailyTavernSeed('save-1', 5)).not.toBe(dailyTavernSeed('save-2', 5));
  });
});

describe('attemptSeed', () => {
  it('changes per attempt count', () => {
    const d = dailyTavernSeed('s', 3);
    expect(attemptSeed(d, 'visitor-1', 0)).not.toBe(attemptSeed(d, 'visitor-1', 1));
  });

  it('is stable for same inputs', () => {
    const d = dailyTavernSeed('s', 3);
    expect(attemptSeed(d, 'v', 2)).toBe(attemptSeed(d, 'v', 2));
  });
});

describe('pickFromList', () => {
  it('returns an element of the list', () => {
    const rng = mulberry32(1);
    const pool = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      expect(pool).toContain(pickFromList(pool, rng));
    }
  });
});

describe('pickDistinct', () => {
  it('returns n distinct elements', () => {
    const rng = mulberry32(99);
    const out = pickDistinct(['a', 'b', 'c', 'd', 'e'], 3, rng);
    expect(out).toHaveLength(3);
    expect(new Set(out).size).toBe(3);
  });
});

describe('weightedPick', () => {
  it('distribution approximates weights', () => {
    const rng = mulberry32(2024);
    const entries = [
      { value: 'A', weight: 70 },
      { value: 'B', weight: 30 },
    ];
    const counts: Record<string, number> = { A: 0, B: 0 };
    const N = 5000;
    for (let i = 0; i < N; i++) counts[weightedPick(entries, rng)]++;
    expect(Math.abs(counts.A / N - 0.7)).toBeLessThan(0.03);
    expect(Math.abs(counts.B / N - 0.3)).toBeLessThan(0.03);
  });
});
