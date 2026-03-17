import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateRoomCells,
  checkCellOverlap,
  checkAdjacency,
  getWorldBounds,
  canPlaceRoom,
  placeRoom,
  MAX_ROOM_CELLS,
} from '@/game/systems/building-system';
import { useGameStore } from '@/game/state/store';
import type { GuildHall, Room } from '@/game/state/game-state';

const makeRoom = (overrides: Partial<Room> = {}): Room => ({
  id: 'r1',
  type: 'tavern',
  level: 1,
  cells: generateRoomCells(0, 0, 6, 6),
  furniture: [],
  ...overrides,
});

const makeHall = (rooms: Room[] = [], maxRooms = 5): GuildHall => ({
  level: 1,
  rooms,
  maxRooms,
});

describe('building-system (cell-based)', () => {
  describe('generateRoomCells', () => {
    it('generates correct number of cells', () => {
      const cells = generateRoomCells(0, 0, 6, 6);
      expect(cells.length).toBe(36);
    });

    it('generates cells with correct positions', () => {
      const cells = generateRoomCells(2, 3, 2, 2);
      expect(cells).toEqual([
        { x: 2, z: 3 }, { x: 2, z: 4 },
        { x: 3, z: 3 }, { x: 3, z: 4 },
      ]);
    });

    it('handles single-cell room', () => {
      const cells = generateRoomCells(5, 5, 1, 1);
      expect(cells).toEqual([{ x: 5, z: 5 }]);
    });
  });

  describe('checkCellOverlap', () => {
    it('returns true when cells overlap existing room', () => {
      const existing = makeRoom({ cells: generateRoomCells(0, 0, 6, 6) });
      const newCells = generateRoomCells(3, 3, 6, 6);
      expect(checkCellOverlap([existing], newCells)).toBe(true);
    });

    it('returns false when no overlap', () => {
      const existing = makeRoom({ cells: generateRoomCells(0, 0, 6, 6) });
      const newCells = generateRoomCells(6, 0, 6, 6);
      expect(checkCellOverlap([existing], newCells)).toBe(false);
    });

    it('returns false when empty rooms', () => {
      const newCells = generateRoomCells(0, 0, 6, 6);
      expect(checkCellOverlap([], newCells)).toBe(false);
    });

    it('excludes room by id', () => {
      const existing = makeRoom({ id: 'r1', cells: generateRoomCells(0, 0, 6, 6) });
      const newCells = generateRoomCells(0, 0, 6, 6);
      expect(checkCellOverlap([existing], newCells, 'r1')).toBe(false);
    });

    it('still detects overlap with other rooms when excluding one', () => {
      const r1 = makeRoom({ id: 'r1', cells: generateRoomCells(0, 0, 6, 6) });
      const r2 = makeRoom({ id: 'r2', cells: generateRoomCells(6, 0, 6, 6) });
      const newCells = generateRoomCells(6, 0, 6, 6);
      expect(checkCellOverlap([r1, r2], newCells, 'r1')).toBe(true);
    });
  });

  describe('checkAdjacency', () => {
    it('returns true for first room (empty rooms array)', () => {
      const cells = generateRoomCells(10, 10, 6, 6);
      expect(checkAdjacency([], cells)).toBe(true);
    });

    it('returns true when adjacent to existing room', () => {
      const existing = makeRoom({ cells: generateRoomCells(0, 0, 6, 6) });
      const newCells = generateRoomCells(6, 0, 6, 6); // right next to existing
      expect(checkAdjacency([existing], newCells)).toBe(true);
    });

    it('returns false when not adjacent', () => {
      const existing = makeRoom({ cells: generateRoomCells(0, 0, 6, 6) });
      const newCells = generateRoomCells(20, 20, 6, 6); // far away
      expect(checkAdjacency([existing], newCells)).toBe(false);
    });

    it('returns true when diagonally touching has shared edge', () => {
      const existing = makeRoom({ cells: generateRoomCells(0, 0, 6, 6) });
      const newCells = generateRoomCells(0, 6, 6, 6); // below existing
      expect(checkAdjacency([existing], newCells)).toBe(true);
    });
  });

  describe('getWorldBounds', () => {
    it('returns default bounds for empty rooms', () => {
      expect(getWorldBounds([])).toEqual({ minX: 0, minZ: 0, maxX: 6, maxZ: 6 });
    });

    it('computes bounds from single room', () => {
      const room = makeRoom({ cells: generateRoomCells(2, 3, 4, 5) });
      expect(getWorldBounds([room])).toEqual({ minX: 2, minZ: 3, maxX: 6, maxZ: 8 });
    });

    it('computes bounds from multiple rooms', () => {
      const r1 = makeRoom({ id: 'r1', cells: generateRoomCells(0, 0, 6, 6) });
      const r2 = makeRoom({ id: 'r2', cells: generateRoomCells(10, 10, 6, 6) });
      expect(getWorldBounds([r1, r2])).toEqual({ minX: 0, minZ: 0, maxX: 16, maxZ: 16 });
    });
  });

  describe('canPlaceRoom', () => {
    it('allows placement when capacity and gold sufficient', () => {
      const hall = makeHall([], 5);
      expect(canPlaceRoom(hall, 'tavern', 200)).toEqual({ success: true });
    });

    it('rejects when max rooms reached', () => {
      const hall = makeHall([makeRoom()], 1);
      const result = canPlaceRoom(hall, 'tavern', 999);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Max rooms');
    });

    it('rejects when insufficient gold', () => {
      const hall = makeHall();
      const result = canPlaceRoom(hall, 'tavern', 50);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('gold');
    });
  });

  describe('placeRoom', () => {
    it('creates room with correct fields', () => {
      const cells = generateRoomCells(3, 2, 6, 6);
      const room = placeRoom('tavern', cells);
      expect(room.type).toBe('tavern');
      expect(room.cells).toEqual(cells);
      expect(room.furniture).toEqual([]);
      expect(room.level).toBe(1);
      expect(room.id).toBeTruthy();
    });
  });

  describe('MAX_ROOM_CELLS', () => {
    it('is 100', () => {
      expect(MAX_ROOM_CELLS).toBe(100);
    });
  });
});

describe('BuildModeSlice', () => {
  beforeEach(() => {
    useGameStore.setState({ activeItem: null });
  });

  it('startPlacement sets activeItem with type new-room', () => {
    useGameStore.getState().startPlacement('tavern');
    const s = useGameStore.getState();
    expect(s.activeItem?.type).toBe('new-room');
    expect(s.activeItem?.roomType).toBe('tavern');
    expect(s.activeItem?.rotation).toBe(0);
  });

  it('rotatePlacement cycles through 0→90→180→270→0', () => {
    useGameStore.getState().startPlacement('tavern');
    const rotate = useGameStore.getState().rotatePlacement;

    rotate();
    expect(useGameStore.getState().activeItem?.rotation).toBe(90);
    rotate();
    expect(useGameStore.getState().activeItem?.rotation).toBe(180);
    rotate();
    expect(useGameStore.getState().activeItem?.rotation).toBe(270);
    rotate();
    expect(useGameStore.getState().activeItem?.rotation).toBe(0);
  });

  it('cancelPlacement clears activeItem', () => {
    useGameStore.getState().startPlacement('infirmary');
    useGameStore.getState().rotatePlacement();
    useGameStore.getState().cancelPlacement();
    expect(useGameStore.getState().activeItem).toBeNull();
  });
});
