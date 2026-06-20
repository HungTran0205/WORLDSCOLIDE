/**
 * Bounded wander helpers for tavern merc sprites.
 *
 * Facility rooms have no live collision registry (unlike the guild hall), so
 * this mirrors guild-hall-movement.ts with a self-contained, data-driven
 * keep-out: a square walk area inside the 7×7 room minus circular footprints
 * around the tavern furniture. The footprint list MUST stay in sync with the
 * prop positions in tavern-furniture.tsx.
 *
 * Pure cell math + point tests — no React/Three state, directly unit-testable.
 */

export interface Cell {
  x: number;
  z: number;
}

/** ~0.5s at the 20fps invalidate cadence before a wedged merc retargets. */
export const BLOCKED_RETARGET_FRAMES = 10;

/** Half-extent of the walkable square from room center (leaves a wall margin). */
const WALK_HALF = 2.6;

/** Grid spacing between candidate wander cells. */
const CELL_STEP = 0.6;

/**
 * Furniture footprints to avoid — center offset (dx,dz from room center) +
 * radius. Kept in sync with tavern-furniture.tsx prop positions so mercs don't
 * wander through the bar counter or the table cluster.
 */
const FURNITURE_KEEPOUT: { dx: number; dz: number; r: number }[] = [
  { dx: -2.8, dz: 1.2, r: 1.7 }, // apothecary counter (large, interactive)
  { dx: -1.2, dz: 1.2, r: 0.9 }, // rusty steamworks
  { dx: 1.5, dz: -1.2, r: 0.8 }, // bamboo table
  { dx: 0.5, dz: 0.8, r: 0.7 }, // emerald cottage
  { dx: 2.0, dz: 2.0, r: 0.9 }, // bamboo table
  { dx: 2.0, dz: 0.5, r: 0.7 }, // emerald cottage
  { dx: -2.5, dz: -2.2, r: 0.9 }, // cooper drum hanger
];

/** True when (x,z) is outside the walk square or inside a furniture footprint. */
export function isTavernPointBlocked(x: number, z: number, cx: number, cz: number): boolean {
  const lx = x - cx;
  const lz = z - cz;
  if (Math.abs(lx) > WALK_HALF || Math.abs(lz) > WALK_HALF) return true;
  for (const f of FURNITURE_KEEPOUT) {
    const ddx = lx - f.dx;
    const ddz = lz - f.dz;
    if (ddx * ddx + ddz * ddz < f.r * f.r) return true;
  }
  return false;
}

/** Walkable cell centers across the room interior, minus furniture footprints. */
export function getTavernWalkCells(cx: number, cz: number): Cell[] {
  const cells: Cell[] = [];
  for (let lx = -WALK_HALF; lx <= WALK_HALF + 1e-6; lx += CELL_STEP) {
    for (let lz = -WALK_HALF; lz <= WALK_HALF + 1e-6; lz += CELL_STEP) {
      const x = cx + lx;
      const z = cz + lz;
      if (!isTavernPointBlocked(x, z, cx, cz)) cells.push({ x, z });
    }
  }
  return cells;
}

/** Deterministic pseudo-random index from a seed. */
function seededIndex(seed: number, max: number): number {
  return Math.abs(Math.floor(Math.sin(seed * 9301 + 49297) * 233280)) % max;
}

/** Nearest walkable cell to (x,z) — relocates a merc spawned on a prop. */
export function nearestTavernCell(cells: Cell[], x: number, z: number): Cell | null {
  let best: Cell | null = null;
  let bestDist = Infinity;
  for (const c of cells) {
    const d = (c.x - x) ** 2 + (c.z - z) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/** Pick a wander target from the (already-filtered) walkable cell set. */
export function pickTavernTarget(cells: Cell[], seed: number): Cell {
  return cells[seededIndex(seed, cells.length)];
}
