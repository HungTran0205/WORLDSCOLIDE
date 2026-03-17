import { describe, it, expect } from 'vitest';
import {
  getFurnitureCells,
  canPlaceFurniture,
  placeFurniture,
  removeFurniture,
  autoPlaceCoreFurniture,
  upgradeCoreFurniture,
} from '@/game/systems/furniture-system';
import { generateRoomCells } from '@/game/systems/building-system';
import type { Room } from '@/game/state/game-state';

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'room-1',
    type: 'guild-hall',
    level: 1,
    cells: generateRoomCells(0, 0, 6, 6),
    furniture: [],
    ...overrides,
  };
}

describe('furniture-system', () => {
  describe('getFurnitureCells', () => {
    it('returns correct cells for 2x1 at rotation 0', () => {
      const cells = getFurnitureCells({ x: 1, z: 1 }, 2, 1, 0);
      expect(cells).toEqual([{ x: 1, z: 1 }, { x: 2, z: 1 }]);
    });

    it('swaps axes for rotation 90', () => {
      const cells = getFurnitureCells({ x: 1, z: 1 }, 2, 1, 90);
      expect(cells).toEqual([{ x: 1, z: 1 }, { x: 1, z: 2 }]);
    });

    it('returns single cell for 1x1', () => {
      const cells = getFurnitureCells({ x: 3, z: 3 }, 1, 1, 0);
      expect(cells).toEqual([{ x: 3, z: 3 }]);
    });
  });

  describe('canPlaceFurniture', () => {
    it('allows valid placement inside room', () => {
      const room = makeRoom();
      const result = canPlaceFurniture(room, 'reception-desk', { x: 0, z: 0 }, 0);
      expect(result.success).toBe(true);
    });

    it('rejects placement outside room cells', () => {
      const room = makeRoom();
      const result = canPlaceFurniture(room, 'reception-desk', { x: 5, z: 5 }, 0);
      // reception-desk is 2x1, so at (5,5) it extends to (6,5) which is outside 6x6 room
      expect(result.success).toBe(false);
      expect(result.reason).toContain('outside room');
    });

    it('rejects wrong room type', () => {
      const room = makeRoom({ type: 'workshop' });
      const result = canPlaceFurniture(room, 'wine-barrel', { x: 0, z: 0 }, 0);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Cannot place');
    });

    it('rejects when max per room reached', () => {
      const room = makeRoom({
        furniture: [{ id: 'f1', type: 'reception-desk', level: 1, position: { x: 0, z: 0 }, rotation: 0 }],
      });
      const result = canPlaceFurniture(room, 'reception-desk', { x: 3, z: 3 }, 0);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Max');
    });

    it('rejects overlapping furniture', () => {
      const room = makeRoom({
        furniture: [{ id: 'f1', type: 'reception-desk', level: 1, position: { x: 1, z: 1 }, rotation: 0 }],
      });
      // reception-desk is 2x1, occupies (1,1),(2,1). Place another at (2,1) — overlaps at (2,1)
      const result = canPlaceFurniture(room, 'reception-desk', { x: 2, z: 1 }, 0);
      expect(result.success).toBe(false);
    });

    it('rejects duplicate core furniture', () => {
      const room = makeRoom({
        furniture: [{ id: 'f1', type: 'quest-board', level: 1, position: { x: 2, z: 2 }, rotation: 0 }],
      });
      const result = canPlaceFurniture(room, 'quest-board', { x: 4, z: 4 }, 0);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Max 1 per room');
    });
  });

  describe('placeFurniture', () => {
    it('adds furniture to room', () => {
      const room = makeRoom();
      const updated = placeFurniture(room, 'reception-desk', { x: 0, z: 0 }, 0);
      expect(updated.furniture.length).toBe(1);
      expect(updated.furniture[0].type).toBe('reception-desk');
      expect(updated.furniture[0].level).toBe(1);
    });
  });

  describe('removeFurniture', () => {
    it('removes furniture by id', () => {
      const room = makeRoom({
        furniture: [
          { id: 'f1', type: 'reception-desk', level: 1, position: { x: 0, z: 0 }, rotation: 0 },
          { id: 'f2', type: 'quest-board', level: 1, position: { x: 2, z: 2 }, rotation: 0 },
        ],
      });
      const updated = removeFurniture(room, 'f1');
      expect(updated.furniture.length).toBe(1);
      expect(updated.furniture[0].id).toBe('f2');
    });
  });

  describe('autoPlaceCoreFurniture', () => {
    it('places core furniture at center of room', () => {
      const room = makeRoom({ type: 'guild-hall', furniture: [] });
      const updated = autoPlaceCoreFurniture(room);
      expect(updated.furniture.length).toBe(1);
      expect(updated.furniture[0].type).toBe('quest-board');
      expect(updated.furniture[0].level).toBe(1);
    });

    it('returns room unchanged for unknown type', () => {
      const room = makeRoom({ type: 'workshop' as any });
      // workbench is core for workshop, should auto-place
      const updated = autoPlaceCoreFurniture(room);
      expect(updated.furniture.length).toBe(1);
      expect(updated.furniture[0].type).toBe('workbench');
    });
  });

  describe('upgradeCoreFurniture', () => {
    it('returns upgrade result with cost', () => {
      const room = makeRoom({
        furniture: [{ id: 'f1', type: 'quest-board', level: 1, position: { x: 2, z: 2 }, rotation: 0 }],
      });
      const result = upgradeCoreFurniture(room);
      expect(result).not.toBeNull();
      expect(result!.room.level).toBe(2);
      expect(result!.room.furniture[0].level).toBe(2);
      expect(result!.cost.gold).toBe(500);
    });

    it('returns null when at max level', () => {
      const room = makeRoom({
        furniture: [{ id: 'f1', type: 'quest-board', level: 5, position: { x: 2, z: 2 }, rotation: 0 }],
      });
      const result = upgradeCoreFurniture(room);
      expect(result).toBeNull();
    });

    it('returns null when no core furniture', () => {
      const room = makeRoom({ furniture: [] });
      const result = upgradeCoreFurniture(room);
      expect(result).toBeNull();
    });

    it('increments through levels correctly', () => {
      let room = makeRoom({
        furniture: [{ id: 'f1', type: 'quest-board', level: 1, position: { x: 2, z: 2 }, rotation: 0 }],
      });
      // Level 1 -> 2
      let result = upgradeCoreFurniture(room);
      expect(result!.room.level).toBe(2);
      // Level 2 -> 3
      result = upgradeCoreFurniture(result!.room);
      expect(result!.room.level).toBe(3);
    });
  });
});
