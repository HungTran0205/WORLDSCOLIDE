/** Furniture placement, validation, auto-placement, and upgrade logic */

import type {
  Room, GridCell, Rotation, FurnitureType, PlacedFurniture,
} from '@/game/state/game-state';
import { FURNITURE_DEFINITIONS } from '@/game/data/furniture';
import { ROOM_DEFINITIONS, type ResourceCost } from '@/game/data/buildings';
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

/** Check if furniture can be placed inside room */
export function canPlaceFurniture(
  room: Room,
  furnitureType: FurnitureType,
  position: GridCell,
  rotation: Rotation,
): PlacementResult {
  const def = FURNITURE_DEFINITIONS.find((f) => f.type === furnitureType);
  if (!def) return { success: false, reason: 'Unknown furniture' };

  // Room restriction check
  if (def.allowedRooms !== 'any' && !def.allowedRooms.includes(room.type)) {
    return { success: false, reason: `Cannot place in ${room.type}` };
  }

  // Max per room check
  if (def.maxPerRoom !== undefined) {
    const count = room.furniture.filter((f) => f.type === furnitureType).length;
    if (count >= def.maxPerRoom) {
      return { success: false, reason: `Max ${def.maxPerRoom} per room` };
    }
  }

  // Core furniture uniqueness check
  if (def.category === 'core') {
    const hasCore = room.furniture.some((f) =>
      FURNITURE_DEFINITIONS.find((fd) => fd.type === f.type)?.category === 'core',
    );
    if (hasCore) return { success: false, reason: 'Room already has core furniture' };
  }

  // Bounds check: furniture must fit within room cells
  const furnitureCells = getFurnitureCells(position, def.width, def.depth, rotation);
  const roomCellSet = new Set(room.cells.map((c) => `${c.x},${c.z}`));
  for (const fc of furnitureCells) {
    if (!roomCellSet.has(`${fc.x},${fc.z}`)) {
      return { success: false, reason: 'Furniture extends outside room' };
    }
  }

  // Overlap check: no overlapping with existing furniture
  const occupiedByFurniture = new Set<string>();
  for (const f of room.furniture) {
    const fDef = FURNITURE_DEFINITIONS.find((fd) => fd.type === f.type);
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

/** Place furniture in room (returns new Room with furniture added) */
export function placeFurniture(
  room: Room, furnitureType: FurnitureType,
  position: GridCell, rotation: Rotation,
): Room {
  const newFurniture: PlacedFurniture = {
    id: crypto.randomUUID(),
    type: furnitureType,
    level: 1,
    position,
    rotation,
  };
  return { ...room, furniture: [...room.furniture, newFurniture] };
}

/** Remove furniture from room by ID */
export function removeFurniture(room: Room, furnitureId: string): Room {
  return { ...room, furniture: room.furniture.filter((f) => f.id !== furnitureId) };
}

/** Auto-place core furniture at room center — called by buildRoom() Zustand action */
export function autoPlaceCoreFurniture(room: Room): Room {
  const roomDef = ROOM_DEFINITIONS.find((r) => r.type === room.type);
  if (!roomDef) return room;
  const coreDef = FURNITURE_DEFINITIONS.find((f) => f.type === roomDef.coreFurniture);
  if (!coreDef) return room;

  // Find center of room cells
  const minX = Math.min(...room.cells.map((c) => c.x));
  const minZ = Math.min(...room.cells.map((c) => c.z));
  const maxX = Math.max(...room.cells.map((c) => c.x));
  const maxZ = Math.max(...room.cells.map((c) => c.z));
  const centerX = Math.floor((minX + maxX) / 2);
  const centerZ = Math.floor((minZ + maxZ) / 2);

  const coreFurniture: PlacedFurniture = {
    id: crypto.randomUUID(),
    type: roomDef.coreFurniture,
    level: 1,
    position: { x: centerX, z: centerZ },
    rotation: 0,
  };
  return { ...room, furniture: [...room.furniture, coreFurniture] };
}

/** Upgrade core furniture -> room levels up. Returns null if max level. */
export function upgradeCoreFurniture(room: Room): {
  room: Room;
  cost: ResourceCost;
} | null {
  const coreFurniture = room.furniture.find((f) => {
    const def = FURNITURE_DEFINITIONS.find((fd) => fd.type === f.type);
    return def?.category === 'core';
  });
  if (!coreFurniture) return null;

  const def = FURNITURE_DEFINITIONS.find((fd) => fd.type === coreFurniture.type);
  if (!def?.upgradeCosts) return null;

  const nextLevelIndex = coreFurniture.level - 1;
  if (nextLevelIndex >= def.upgradeCosts.length) return null;

  const cost = def.upgradeCosts[nextLevelIndex];
  const upgradedFurniture = { ...coreFurniture, level: coreFurniture.level + 1 };
  const updatedRoom: Room = {
    ...room,
    level: coreFurniture.level + 1,
    furniture: room.furniture.map((f) =>
      f.id === coreFurniture.id ? upgradedFurniture : f,
    ),
  };
  return { room: updatedRoom, cost };
}
