/** Cell-based building system — placement, adjacency, world bounds */

import type { Room, RoomType, GridCell, GuildHall, InventoryState } from '@/game/state/game-state';
import type { ItemID } from '@/game/data/items';
import { ROOM_DEFINITIONS } from '@/game/data/buildings';

/** Maximum cells a single room may occupy */
export const MAX_ROOM_CELLS = 100;

export interface PlacementResult {
  success: boolean;
  reason?: string;
}

/** Generate a rectangular block of cells from origin */
export function generateRoomCells(
  originX: number, originZ: number,
  width: number, depth: number,
): GridCell[] {
  const cells: GridCell[] = [];
  for (let x = originX; x < originX + width; x++) {
    for (let z = originZ; z < originZ + depth; z++) {
      cells.push({ x, z });
    }
  }
  return cells;
}

/** Build a Set<string> key from cell for O(1) lookup */
function cellKey(cell: GridCell): string {
  return `${cell.x},${cell.z}`;
}

/** Collect all occupied cell keys across rooms */
function getOccupiedCells(rooms: Room[], excludeRoomId?: string): Set<string> {
  const occupied = new Set<string>();
  for (const room of rooms) {
    if (excludeRoomId && room.id === excludeRoomId) continue;
    for (const cell of room.cells) {
      occupied.add(cellKey(cell));
    }
  }
  return occupied;
}

/** Check if any newCells overlap existing room cells */
export function checkCellOverlap(
  rooms: Room[], newCells: GridCell[], excludeRoomId?: string,
): boolean {
  const occupied = getOccupiedCells(rooms, excludeRoomId);
  return newCells.some((c) => occupied.has(cellKey(c)));
}

/** Check if newCells are adjacent (4-directional) to at least one existing room cell */
export function checkAdjacency(rooms: Room[], newCells: GridCell[]): boolean {
  if (rooms.length === 0) return true; // First room always valid
  const occupied = getOccupiedCells(rooms);
  const DIRS = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
  for (const cell of newCells) {
    for (const d of DIRS) {
      if (occupied.has(cellKey({ x: cell.x + d.x, z: cell.z + d.z }))) return true;
    }
  }
  return false;
}

/** Compute bounding box of all room cells */
export function getWorldBounds(rooms: Room[]): {
  minX: number; minZ: number; maxX: number; maxZ: number;
} {
  if (rooms.length === 0) return { minX: 0, minZ: 0, maxX: 6, maxZ: 6 };
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const room of rooms) {
    for (const cell of room.cells) {
      if (cell.x < minX) minX = cell.x;
      if (cell.z < minZ) minZ = cell.z;
      if (cell.x + 1 > maxX) maxX = cell.x + 1;
      if (cell.z + 1 > maxZ) maxZ = cell.z + 1;
    }
  }
  return { minX, minZ, maxX, maxZ };
}

/** Validate room can be placed (capacity, gold, items) */
export function canPlaceRoom(
  guildHall: GuildHall,
  roomType: RoomType,
  gold: number,
  inventory?: InventoryState,
): PlacementResult {
  if (guildHall.rooms.length >= guildHall.maxRooms) {
    return { success: false, reason: 'Max rooms reached. Upgrade guild hall.' };
  }
  const def = ROOM_DEFINITIONS.find((r) => r.type === roomType);
  if (!def) return { success: false, reason: 'Unknown room type' };
  if (gold < def.cost.gold) return { success: false, reason: `Need ${def.cost.gold} gold` };
  if (def.cost.items && inventory) {
    for (const [itemId, needed] of Object.entries(def.cost.items)) {
      if (needed && needed > 0 && (inventory.items[itemId as ItemID] ?? 0) < needed) {
        return { success: false, reason: `Need more ${itemId.replace(/_/g, ' ').toLowerCase()}` };
      }
    }
  }
  return { success: true };
}

/** Create a new room from cells (core furniture added by autoPlaceCoreFurniture) */
export function placeRoom(roomType: RoomType, cells: GridCell[]): Room {
  return {
    id: crypto.randomUUID(),
    type: roomType,
    level: 1,
    cells,
    furniture: [],
  };
}

/** Remove a room from the guild hall by ID */
export function removeRoom(guildHall: GuildHall, roomId: string): GuildHall {
  return { ...guildHall, rooms: guildHall.rooms.filter((r) => r.id !== roomId) };
}
