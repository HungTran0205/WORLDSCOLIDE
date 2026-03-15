import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRotatedSize,
  getRoomBounds,
  checkCollision,
  canPlaceRoom,
  placeRoom,
  HALL_WIDTH,
  HALL_DEPTH,
} from '@/game/systems/building-system';
import { useGameStore } from '@/game/state/store';
import type { GuildHall, Room } from '@/game/state/game-state';

const makeRoom = (overrides: Partial<Room> = {}): Room => ({
  id: 'r1',
  type: 'tavern',
  level: 1,
  position: { x: 0, z: 0 },
  rotation: 0,
  ...overrides,
});

const makeHall = (rooms: Room[] = [], maxRooms = 5): GuildHall => ({
  level: 1,
  rooms,
  maxRooms,
});

describe('building-system', () => {
  describe('getRotatedSize', () => {
    it('returns original size for rotation 0', () => {
      expect(getRotatedSize(2, 3, 0)).toEqual({ w: 2, h: 3 });
    });

    it('returns original size for rotation 180', () => {
      expect(getRotatedSize(2, 3, 180)).toEqual({ w: 2, h: 3 });
    });

    it('swaps axes for rotation 90', () => {
      expect(getRotatedSize(2, 3, 90)).toEqual({ w: 3, h: 2 });
    });

    it('swaps axes for rotation 270', () => {
      expect(getRotatedSize(2, 3, 270)).toEqual({ w: 3, h: 2 });
    });

    it('handles square sizes (no visible change)', () => {
      expect(getRotatedSize(2, 2, 90)).toEqual({ w: 2, h: 2 });
    });
  });

  describe('getRoomBounds', () => {
    it('computes bounds for unrotated room', () => {
      const room = makeRoom({ type: 'tavern', position: { x: 2, z: 1 }, rotation: 0 });
      // tavern = 2x2
      expect(getRoomBounds(room)).toEqual({ x: 2, z: 1, w: 2, h: 2 });
    });

    it('computes bounds for 90-degree rotated room', () => {
      const room = makeRoom({ type: 'training-room', position: { x: 3, z: 0 }, rotation: 90 });
      // training-room = 2x1, rotated 90 → w=1, h=2
      expect(getRoomBounds(room)).toEqual({ x: 3, z: 0, w: 1, h: 2 });
    });

    it('defaults to 1x1 for unknown type', () => {
      const room = makeRoom({ type: 'quest-board', position: { x: 0, z: 0 }, rotation: 0 });
      // quest-board = 1x1
      expect(getRoomBounds(room)).toEqual({ x: 0, z: 0, w: 1, h: 1 });
    });
  });

  describe('checkCollision', () => {
    it('returns true when out of bounds (negative x)', () => {
      const hall = makeHall();
      expect(checkCollision(hall, -1, 0, 1, 1)).toBe(true);
    });

    it('returns true when out of bounds (exceeds width)', () => {
      const hall = makeHall();
      expect(checkCollision(hall, HALL_WIDTH, 0, 1, 1)).toBe(true);
    });

    it('returns true when out of bounds (exceeds depth)', () => {
      const hall = makeHall();
      expect(checkCollision(hall, 0, HALL_DEPTH, 1, 1)).toBe(true);
    });

    it('returns true when overlapping existing room', () => {
      const existing = makeRoom({ type: 'tavern', position: { x: 2, z: 2 }, rotation: 0 });
      const hall = makeHall([existing]);
      // tavern is 2x2 at (2,2)→(4,4), placing 2x2 at (3,3) overlaps
      expect(checkCollision(hall, 3, 3, 2, 2)).toBe(true);
    });

    it('returns false when no collision', () => {
      const existing = makeRoom({ type: 'tavern', position: { x: 0, z: 0 }, rotation: 0 });
      const hall = makeHall([existing]);
      // tavern is 2x2 at (0,0)→(2,2), placing at (2,0) is adjacent
      expect(checkCollision(hall, 2, 0, 1, 1)).toBe(false);
    });

    it('returns false when placing at far corner', () => {
      const hall = makeHall();
      expect(checkCollision(hall, HALL_WIDTH - 1, HALL_DEPTH - 1, 1, 1)).toBe(false);
    });

    it('excludes room by id', () => {
      const existing = makeRoom({ id: 'r1', type: 'tavern', position: { x: 0, z: 0 }, rotation: 0 });
      const hall = makeHall([existing]);
      // Would overlap, but excluded
      expect(checkCollision(hall, 0, 0, 2, 2, 'r1')).toBe(false);
    });

    it('handles multi-tile boundary check', () => {
      const hall = makeHall();
      // 2x2 at (9,5) would go to (11,7) — out of bounds
      expect(checkCollision(hall, 9, 5, 2, 2)).toBe(true);
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
      const room = placeRoom('tavern', { x: 3, z: 2 }, 90);
      expect(room.type).toBe('tavern');
      expect(room.position).toEqual({ x: 3, z: 2 });
      expect(room.rotation).toBe(90);
      expect(room.level).toBe(1);
      expect(room.id).toBeTruthy();
    });

    it('defaults rotation to 0', () => {
      const room = placeRoom('workshop', { x: 0, z: 0 });
      expect(room.rotation).toBe(0);
    });
  });
});

describe('BuildModeSlice', () => {
  beforeEach(() => {
    useGameStore.setState({ activeBuildType: null, buildRotation: 0 });
  });

  it('startPlacement sets type and resets rotation', () => {
    useGameStore.getState().startPlacement('tavern');
    const s = useGameStore.getState();
    expect(s.activeBuildType).toBe('tavern');
    expect(s.buildRotation).toBe(0);
  });

  it('rotatePlacement cycles through 0→90→180→270→0', () => {
    useGameStore.getState().startPlacement('tavern');
    const rotate = useGameStore.getState().rotatePlacement;

    rotate();
    expect(useGameStore.getState().buildRotation).toBe(90);
    rotate();
    expect(useGameStore.getState().buildRotation).toBe(180);
    rotate();
    expect(useGameStore.getState().buildRotation).toBe(270);
    rotate();
    expect(useGameStore.getState().buildRotation).toBe(0);
  });

  it('cancelPlacement clears type and rotation', () => {
    useGameStore.getState().startPlacement('infirmary');
    useGameStore.getState().rotatePlacement();
    useGameStore.getState().cancelPlacement();

    const s = useGameStore.getState();
    expect(s.activeBuildType).toBeNull();
    expect(s.buildRotation).toBe(0);
  });
});
