/** Furniture placement and validation — floor-based (no room dependency) */

import type {
  GridCell, Rotation, FurnitureType, GuildHall,
} from '@/game/state/game-state';
import { FURNITURE_DEFINITIONS, getFurnitureDefinition } from '@/game/data/furniture';
import { getUnlockedFurniture } from '@/game/data/buildings';
import type { PlacementResult } from './building-system';

/** Get cells occupied by furniture at given position + rotation */
export function getFurnitureCells(
  position: GridCell, width: number, depth: number, rotation: Rotation,
): GridCell[] {
  const [w, d] = (rotation === 90 || rotation === 270) ? [depth, width] : [width, depth];
  const cells: GridCell[] = [];
  for (let x = position.x; x < position.x + w; x++) {
    for (let z = position.z; z < position.z + d; z++) {
      cells.push({ x, z });
    }
  }
  return cells;
}

/** Validate furniture placement on floor tiles (replaces room-based canPlaceFurniture) */
export function canPlaceFurnitureOnFloor(
  guildHall: GuildHall,
  furnitureType: FurnitureType,
  position: GridCell,
  rotation: Rotation,
  guildLevel: number,
): PlacementResult {
  const def = getFurnitureDefinition(furnitureType);
  if (!def) return { success: false, reason: 'Unknown furniture' };

  // Guild level unlock check
  const unlocked = getUnlockedFurniture(guildLevel);
  if (!unlocked.includes(furnitureType)) {
    return { success: false, reason: 'Furniture locked — upgrade guild' };
  }

  // Max per guild check (core = 1)
  if (def.maxPerGuild !== undefined) {
    const count = guildHall.furniture.filter((f) => f.type === furnitureType).length;
    if (count >= def.maxPerGuild) {
      return { success: false, reason: `Max ${def.maxPerGuild} per guild` };
    }
  }

  // All furniture cells must have floor tiles underneath
  const furnitureCells = getFurnitureCells(position, def.width, def.depth, rotation);
  const tileSet = new Set(guildHall.floorTiles.map((t) => `${t.x},${t.z}`));
  for (const fc of furnitureCells) {
    if (!tileSet.has(`${fc.x},${fc.z}`)) {
      return { success: false, reason: 'No floor tile underneath' };
    }
  }

  // No overlap with existing furniture
  const occupiedByFurniture = new Set<string>();
  for (const f of guildHall.furniture) {
    const fDef = getFurnitureDefinition(f.type);
    if (!fDef) continue;
    for (const c of getFurnitureCells(f.position, fDef.width, fDef.depth, f.rotation)) {
      occupiedByFurniture.add(`${c.x},${c.z}`);
    }
  }
  for (const fc of furnitureCells) {
    if (occupiedByFurniture.has(`${fc.x},${fc.z}`)) {
      return { success: false, reason: 'Overlaps existing furniture' };
    }
  }

  return { success: true };
}
