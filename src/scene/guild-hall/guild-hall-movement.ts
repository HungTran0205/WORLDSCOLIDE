/**
 * Movement helpers for guild hall member wandering.
 *
 * Cell math + collision-aware target selection, split out of member-layer.tsx
 * so the logic stays testable and the React component stays lean. These read
 * the collision registry (guild-hall-collision.ts) but hold no React/Three
 * state, so they can be exercised directly in unit tests.
 */

import { isGuildHallPointBlocked } from './guild-hall-collision';

export interface Cell {
  x: number;
  z: number;
}

/** ~0.5s at the 20fps invalidate cadence before a wedged member retargets. */
export const BLOCKED_RETARGET_FRAMES = 10;

/** Floor tile (x,z) corners → walkable cell centers. */
export function getAllCellCenters(tiles: { x: number; z: number }[]): Cell[] {
  return tiles.map((t) => ({ x: t.x + 0.5, z: t.z + 0.5 }));
}

/** Deterministic pseudo-random index from a seed. */
function seededIndex(seed: number, max: number): number {
  return Math.abs(Math.floor(Math.sin(seed * 9301 + 49297) * 233280)) % max;
}

/**
 * Nearest cell center that isn't inside a prop footprint — used to relocate a
 * member spawned on top of a prop. Returns null only if every cell is blocked.
 */
export function nearestWalkableCell(cells: Cell[], x: number, z: number): Cell | null {
  let best: Cell | null = null;
  let bestDist = Infinity;
  for (const c of cells) {
    if (isGuildHallPointBlocked(c.x, c.z)) continue;
    const d = (c.x - x) ** 2 + (c.z - z) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/**
 * Pick a wander target not inside a prop footprint. Tries a handful of
 * deterministic seeds, then falls back to any cell — which also covers the
 * empty-registry case (nothing blocked yet → free movement, no regression).
 */
export function pickWalkableTarget(cells: Cell[], seed: number): Cell {
  for (let attempt = 0; attempt < 8; attempt++) {
    const cell = cells[seededIndex(seed + attempt * 13, cells.length)];
    if (!isGuildHallPointBlocked(cell.x, cell.z)) return cell;
  }
  return cells[seededIndex(seed, cells.length)];
}
