import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllCellCenters,
  nearestWalkableCell,
  pickWalkableTarget,
  BLOCKED_RETARGET_FRAMES,
} from '@/scene/guild-hall/guild-hall-movement';
import {
  registerObstacle,
  unregisterObstacle,
  getObstacles,
  isGuildHallPointBlocked,
} from '@/scene/guild-hall/guild-hall-collision';

function clearObstacles() {
  for (const { id } of getObstacles()) unregisterObstacle(id);
}

describe('getAllCellCenters', () => {
  it('maps tile corners to centers (+0.5)', () => {
    expect(getAllCellCenters([{ x: 0, z: 0 }, { x: 2, z: 3 }])).toEqual([
      { x: 0.5, z: 0.5 },
      { x: 2.5, z: 3.5 },
    ]);
  });
});

describe('nearestWalkableCell', () => {
  beforeEach(clearObstacles);

  const cells = [
    { x: 0.5, z: 0.5 },
    { x: 5.5, z: 5.5 },
    { x: 9.5, z: 0.5 },
  ];

  it('returns nearest cell when none blocked', () => {
    expect(nearestWalkableCell(cells, 9, 0)).toEqual({ x: 9.5, z: 0.5 });
  });

  it('skips a blocked cell and returns next-nearest', () => {
    registerObstacle('a', { minX: 9, maxX: 10, minZ: 0, maxZ: 1 }); // blocks (9.5, 0.5)
    expect(nearestWalkableCell(cells, 9, 0)).toEqual({ x: 5.5, z: 5.5 });
  });

  it('returns null when every cell is blocked', () => {
    registerObstacle('all', { minX: -1, maxX: 11, minZ: -1, maxZ: 11 });
    expect(nearestWalkableCell(cells, 5, 5)).toBeNull();
  });
});

describe('pickWalkableTarget', () => {
  beforeEach(clearObstacles);

  const cells = Array.from({ length: 10 }, (_, i) => ({ x: i + 0.5, z: 0.5 }));

  it('returns a cell from the list when registry empty (free movement)', () => {
    expect(cells).toContainEqual(pickWalkableTarget(cells, 123));
  });

  it('never returns a blocked cell while an open one exists', () => {
    registerObstacle('mid', { minX: 3, maxX: 6, minZ: 0, maxZ: 1 });
    for (let seed = 0; seed < 50; seed++) {
      const t = pickWalkableTarget(cells, seed * 7.3);
      expect(isGuildHallPointBlocked(t.x, t.z)).toBe(false);
    }
  });

  it('falls back to a cell even if all are blocked', () => {
    registerObstacle('all', { minX: -1, maxX: 11, minZ: -1, maxZ: 2 });
    expect(cells).toContainEqual(pickWalkableTarget(cells, 42));
  });
});

describe('BLOCKED_RETARGET_FRAMES', () => {
  it('is a positive frame budget', () => {
    expect(BLOCKED_RETARGET_FRAMES).toBeGreaterThan(0);
  });
});
