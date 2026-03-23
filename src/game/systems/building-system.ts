/** Tile-based building system — adjacency, occupation, world bounds */

import type { FloorTile, GridCell, PlacedFurniture } from '@/game/state/game-state';
import { getFurnitureDefinition } from '@/game/data/furniture';
import { getFurnitureCells } from './furniture-system';

export interface PlacementResult {
  success: boolean;
  reason?: string;
}

/** Build a Set<string> key from cell for O(1) lookup */
export function cellKey(cell: { x: number; z: number }): string {
  return `${cell.x},${cell.z}`;
}

/** Check if position is adjacent to at least one existing floor tile (4-dir) */
export function checkTileAdjacency(tiles: FloorTile[], x: number, z: number): boolean {
  if (tiles.length === 0) return true; // first tile always valid
  const DIRS = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
  const tileSet = new Set(tiles.map((t) => cellKey(t)));
  return DIRS.some((d) => tileSet.has(cellKey({ x: x + d.x, z: z + d.z })));
}

/** Check if a cell is occupied by any furniture footprint */
export function isCellOccupiedByFurniture(
  furniture: PlacedFurniture[], x: number, z: number,
): boolean {
  for (const f of furniture) {
    const def = getFurnitureDefinition(f.type);
    if (!def) continue;
    const cells = getFurnitureCells(f.position, def.width, def.depth, f.rotation);
    if (cells.some((c) => c.x === x && c.z === z)) return true;
  }
  return false;
}

/** Compute world bounds from floor tiles */
export function getWorldBounds(tiles: FloorTile[]): {
  minX: number; minZ: number; maxX: number; maxZ: number;
} {
  if (tiles.length === 0) return { minX: 0, minZ: 0, maxX: 6, maxZ: 6 };
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const t of tiles) {
    if (t.x < minX) minX = t.x;
    if (t.z < minZ) minZ = t.z;
    if (t.x + 1 > maxX) maxX = t.x + 1;
    if (t.z + 1 > maxZ) maxZ = t.z + 1;
  }
  return { minX, minZ, maxX, maxZ };
}
