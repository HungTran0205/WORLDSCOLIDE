import type { GuildHall, Room, RoomType, Rotation, InventoryState } from '@/game/state/game-state';
import type { ItemID } from '@/game/data/items';
import { ROOM_DEFINITIONS } from '@/game/data/buildings';

/** Guild hall grid dimensions (cells) */
export const HALL_WIDTH = 10;
export const HALL_DEPTH = 6;

export interface PlacementResult {
  success: boolean;
  reason?: string;
}

/** Get effective width/depth after rotation (90/270 swap axes) */
export function getRotatedSize(width: number, depth: number, rotation: Rotation) {
  if (rotation === 90 || rotation === 270) return { w: depth, h: width };
  return { w: width, h: depth };
}

/** AABB rectangle for a placed room on the grid */
export interface RoomBounds {
  x: number;
  z: number;
  w: number;
  h: number;
}

/** Compute grid bounds for an existing room */
export function getRoomBounds(room: Room): RoomBounds {
  const def = ROOM_DEFINITIONS.find((r) => r.type === room.type);
  if (!def) return { x: room.position.x, z: room.position.z, w: 1, h: 1 };
  const { w, h } = getRotatedSize(def.width, def.depth, room.rotation);
  return { x: room.position.x, z: room.position.z, w, h };
}

/** Check if two AABB rectangles overlap */
function rectsOverlap(a: RoomBounds, b: RoomBounds): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.z < b.z + b.h && a.z + a.h > b.z;
}

/** Check if a proposed placement collides with existing rooms or exceeds hall bounds */
export function checkCollision(
  hall: GuildHall,
  x: number,
  z: number,
  width: number,
  depth: number,
  excludeRoomId?: string,
): boolean {
  // Boundary check
  if (x < 0 || z < 0 || x + width > HALL_WIDTH || z + depth > HALL_DEPTH) return true;

  const proposed: RoomBounds = { x, z, w: width, h: depth };
  for (const room of hall.rooms) {
    if (excludeRoomId && room.id === excludeRoomId) continue;
    if (rectsOverlap(proposed, getRoomBounds(room))) return true;
  }
  return false;
}

/** Validate room can be placed (capacity, gold, items) */
export function canPlaceRoom(
  hall: GuildHall,
  roomType: RoomType,
  gold: number,
  inventory?: InventoryState,
): PlacementResult {
  if (hall.rooms.length >= hall.maxRooms) {
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

/** Create a new room at given grid position */
export function placeRoom(
  roomType: RoomType,
  position: { x: number; z: number },
  rotation: Rotation = 0,
): Room {
  return { id: crypto.randomUUID(), type: roomType, level: 1, position, rotation };
}

export function removeRoom(hall: GuildHall, roomId: string): GuildHall {
  return { ...hall, rooms: hall.rooms.filter((r) => r.id !== roomId) };
}
