import { describe, it, expect } from 'vitest';
import {
  getTavernWalkCells,
  isTavernPointBlocked,
  nearestTavernCell,
  pickTavernTarget,
  BLOCKED_RETARGET_FRAMES,
} from '../src/scene/tavern/tavern-merc-wander';

// Room center used across cases — keep-out math is relative to (cx,cz).
const CX = 10;
const CZ = 20;

describe('isTavernPointBlocked', () => {
  it('blocks points outside the walk square', () => {
    expect(isTavernPointBlocked(CX + 3, CZ, CX, CZ)).toBe(true); // beyond half-extent
    expect(isTavernPointBlocked(CX, CZ + 3, CX, CZ)).toBe(true);
  });

  it('allows an open point near the room center', () => {
    // Center is clear of every furniture footprint.
    expect(isTavernPointBlocked(CX, CZ, CX, CZ)).toBe(false);
  });

  it('blocks the apothecary counter footprint (-2.8, +1.2)', () => {
    expect(isTavernPointBlocked(CX - 2.8, CZ + 1.2, CX, CZ)).toBe(true);
  });
});

describe('getTavernWalkCells', () => {
  const cells = getTavernWalkCells(CX, CZ);

  it('produces a non-empty walkable set', () => {
    expect(cells.length).toBeGreaterThan(0);
  });

  it('every returned cell is walkable', () => {
    for (const c of cells) {
      expect(isTavernPointBlocked(c.x, c.z, CX, CZ)).toBe(false);
    }
  });

  it('cells sit inside the room footprint', () => {
    for (const c of cells) {
      expect(Math.abs(c.x - CX)).toBeLessThanOrEqual(3.5);
      expect(Math.abs(c.z - CZ)).toBeLessThanOrEqual(3.5);
    }
  });
});

describe('nearestTavernCell', () => {
  const cells = getTavernWalkCells(CX, CZ);

  it('returns a walkable cell near a blocked spawn point', () => {
    const safe = nearestTavernCell(cells, CX - 2.8, CZ + 1.2); // inside the counter
    expect(safe).not.toBeNull();
    expect(isTavernPointBlocked(safe!.x, safe!.z, CX, CZ)).toBe(false);
  });

  it('returns null for an empty cell set', () => {
    expect(nearestTavernCell([], CX, CZ)).toBeNull();
  });
});

describe('pickTavernTarget', () => {
  const cells = getTavernWalkCells(CX, CZ);

  it('always returns a walkable cell from the set', () => {
    for (let seed = 0; seed < 50; seed++) {
      const t = pickTavernTarget(cells, seed * 7.3);
      expect(cells).toContainEqual(t);
      expect(isTavernPointBlocked(t.x, t.z, CX, CZ)).toBe(false);
    }
  });
});

describe('BLOCKED_RETARGET_FRAMES', () => {
  it('is a positive frame budget', () => {
    expect(BLOCKED_RETARGET_FRAMES).toBeGreaterThan(0);
  });
});
