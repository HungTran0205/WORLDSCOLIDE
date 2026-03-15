import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/game/state/store';
import type { Room, Rotation } from '@/game/state/game-state';
import { checkCollision } from '@/game/systems/building-system';
import type { GuildHall } from '@/game/state/game-state';

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

describe('BuildModeAdvanced', () => {
  beforeEach(() => {
    useGameStore.setState({
      isBuildMode: false,
      activeBuildType: null,
      buildRotation: 0,
      activeItem: null,
      guildHall: makeHall([makeRoom({ id: 'room-quest-board', type: 'quest-board', position: { x: 0, z: 0 }, rotation: 0 })]),
      gold: 1000,
    });
  });

  describe('toggleBuildMode', () => {
    it('enters build mode when called with true', () => {
      useGameStore.getState().toggleBuildMode(true);
      const s = useGameStore.getState();
      expect(s.isBuildMode).toBe(true);
    });

    it('exits build mode when called with false', () => {
      useGameStore.getState().toggleBuildMode(true);
      useGameStore.getState().toggleBuildMode(false);
      const s = useGameStore.getState();
      expect(s.isBuildMode).toBe(false);
    });

    it('resets activeBuildType when exiting', () => {
      useGameStore.getState().startPlacement('tavern');
      useGameStore.getState().toggleBuildMode(false);
      const s = useGameStore.getState();
      expect(s.activeBuildType).toBeNull();
    });

    it('resets buildRotation when exiting', () => {
      useGameStore.getState().startPlacement('tavern');
      useGameStore.getState().rotatePlacement();
      useGameStore.getState().toggleBuildMode(false);
      const s = useGameStore.getState();
      expect(s.buildRotation).toBe(0);
    });

    it('clears activeItem when exiting', () => {
      useGameStore.getState().startPlacement('tavern');
      useGameStore.getState().toggleBuildMode(false);
      const s = useGameStore.getState();
      expect(s.activeItem).toBeNull();
    });
  });

  describe('startMovingRoom', () => {
    it('sets activeItem with type=existing', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 90);
      const s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('existing');
    });

    it('captures roomId in activeItem', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 0);
      const s = useGameStore.getState();
      expect(s.activeItem?.roomId).toBe('r1');
    });

    it('captures roomType in activeItem', () => {
      useGameStore.getState().startMovingRoom('r1', 'training-room', { x: 2, z: 3 }, 0);
      const s = useGameStore.getState();
      expect(s.activeItem?.roomType).toBe('training-room');
    });

    it('captures originalPosition for cancel restore', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 4, z: 5 }, 0);
      const s = useGameStore.getState();
      expect(s.activeItem?.originalPosition).toEqual({ x: 4, z: 5 });
    });

    it('captures originalRotation for cancel restore', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 180);
      const s = useGameStore.getState();
      expect(s.activeItem?.originalRotation).toBe(180);
    });

    it('sets activeBuildType to roomType', () => {
      useGameStore.getState().startMovingRoom('r1', 'infirmary', { x: 2, z: 3 }, 0);
      const s = useGameStore.getState();
      expect(s.activeBuildType).toBe('infirmary');
    });

    it('sets buildRotation to current rotation', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 270);
      const s = useGameStore.getState();
      expect(s.buildRotation).toBe(270);
    });

    it('sets rotation in activeItem to current rotation', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 90);
      const s = useGameStore.getState();
      expect(s.activeItem?.rotation).toBe(90);
    });

    it('does not modify isBuildMode when starting move', () => {
      useGameStore.getState().toggleBuildMode(true);
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 0);
      const s = useGameStore.getState();
      expect(s.isBuildMode).toBe(true);
    });
  });

  describe('rotatePlacement with activeItem', () => {
    it('updates activeItem.rotation when rotating during move', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 0);
      useGameStore.getState().rotatePlacement();
      const s = useGameStore.getState();
      expect(s.activeItem?.rotation).toBe(90);
    });

    it('cycles rotation through 0→90→180→270→0', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 0);
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

    it('preserves originalPosition during rotation', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 4, z: 5 }, 0);
      useGameStore.getState().rotatePlacement();
      const s = useGameStore.getState();
      expect(s.activeItem?.originalPosition).toEqual({ x: 4, z: 5 });
    });

    it('preserves originalRotation during rotation', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 180);
      useGameStore.getState().rotatePlacement();
      const s = useGameStore.getState();
      expect(s.activeItem?.originalRotation).toBe(180);
    });

    it('updates buildRotation in sync with activeItem.rotation', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 0);
      useGameStore.getState().rotatePlacement();
      const s = useGameStore.getState();
      expect(s.buildRotation).toBe(s.activeItem?.rotation);
    });
  });

  describe('cancelPlacement', () => {
    it('clears activeBuildType', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 0);
      useGameStore.getState().cancelPlacement();
      const s = useGameStore.getState();
      expect(s.activeBuildType).toBeNull();
    });

    it('resets buildRotation to 0', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 180);
      useGameStore.getState().cancelPlacement();
      const s = useGameStore.getState();
      expect(s.buildRotation).toBe(0);
    });

    it('clears activeItem', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 0);
      useGameStore.getState().cancelPlacement();
      const s = useGameStore.getState();
      expect(s.activeItem).toBeNull();
    });

    it('works with new placement (type=new)', () => {
      useGameStore.getState().startPlacement('tavern');
      useGameStore.getState().cancelPlacement();
      const s = useGameStore.getState();
      expect(s.activeItem).toBeNull();
      expect(s.activeBuildType).toBeNull();
    });

    it('works with existing move (type=existing)', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 0);
      useGameStore.getState().cancelPlacement();
      const s = useGameStore.getState();
      expect(s.activeItem).toBeNull();
      expect(s.activeBuildType).toBeNull();
    });
  });

  describe('Integration: startMovingRoom → rotatePlacement → cancelPlacement', () => {
    it('completes full cycle and clears state', () => {
      // Start move
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 0);
      let s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('existing');
      expect(s.activeItem?.originalPosition).toEqual({ x: 2, z: 3 });

      // Rotate
      useGameStore.getState().rotatePlacement();
      s = useGameStore.getState();
      expect(s.activeItem?.rotation).toBe(90);
      expect(s.activeItem?.originalPosition).toEqual({ x: 2, z: 3 }); // Preserved

      // Rotate again
      useGameStore.getState().rotatePlacement();
      s = useGameStore.getState();
      expect(s.activeItem?.rotation).toBe(180);

      // Cancel
      useGameStore.getState().cancelPlacement();
      s = useGameStore.getState();
      expect(s.activeBuildType).toBeNull();
      expect(s.buildRotation).toBe(0);
      expect(s.activeItem).toBeNull();
    });

    it('preserves original state through rotate cycles', () => {
      const original = { x: 5, z: 4 };
      useGameStore.getState().startMovingRoom('r1', 'tavern', original, 0);

      for (let i = 0; i < 4; i++) {
        useGameStore.getState().rotatePlacement();
      }

      const s = useGameStore.getState();
      expect(s.activeItem?.originalPosition).toEqual(original);
      expect(s.activeItem?.rotation).toBe(0);
    });
  });

  describe('checkCollision with excludeRoomId', () => {
    it('ignores room by id when checking collision', () => {
      const existing = makeRoom({ id: 'r1', type: 'tavern', position: { x: 0, z: 0 }, rotation: 0 });
      const hall = makeHall([existing]);
      // Would overlap, but excluded
      const hasCollision = checkCollision(hall, 0, 0, 2, 2, 'r1');
      expect(hasCollision).toBe(false);
    });

    it('still detects collision with other rooms when excluding one', () => {
      const existing1 = makeRoom({ id: 'r1', type: 'tavern', position: { x: 0, z: 0 }, rotation: 0 });
      const existing2 = makeRoom({ id: 'r2', type: 'workshop', position: { x: 3, z: 2 }, rotation: 0 });
      const hall = makeHall([existing1, existing2]);
      // Exclude r1, but still collides with r2
      const hasCollision = checkCollision(hall, 3, 2, 2, 2, 'r1');
      expect(hasCollision).toBe(true);
    });

    it('allows placement when moving room and excluding it', () => {
      const moving = makeRoom({ id: 'moving-room', type: 'tavern', position: { x: 2, z: 2 }, rotation: 0 });
      const other = makeRoom({ id: 'r2', type: 'workshop', position: { x: 5, z: 1 }, rotation: 0 });
      const hall = makeHall([moving, other]);
      // Try to place at original position, excluding the moving room
      const hasCollision = checkCollision(hall, 2, 2, 2, 2, 'moving-room');
      expect(hasCollision).toBe(false);
    });

    it('respects excludeRoomId parameter in complex scenario', () => {
      const r1 = makeRoom({ id: 'r1', type: 'tavern', position: { x: 0, z: 0 }, rotation: 0 });
      const r2 = makeRoom({ id: 'r2', type: 'training-room', position: { x: 3, z: 0 }, rotation: 0 });
      const r3 = makeRoom({ id: 'r3', type: 'workshop', position: { x: 6, z: 0 }, rotation: 0 });
      const hall = makeHall([r1, r2, r3]);

      // Exclude r2 (training-room at 3,0), place 2x1 at (3,0)
      const hasCollision = checkCollision(hall, 3, 0, 2, 1, 'r2');
      expect(hasCollision).toBe(false);

      // Without exclusion, should still collide with r2
      const hasCollisionWithoutExclude = checkCollision(hall, 3, 0, 2, 1);
      expect(hasCollisionWithoutExclude).toBe(true);
    });
  });

  describe('activeItem distinguishes new vs existing placement', () => {
    it('new placement has type=new', () => {
      useGameStore.getState().startPlacement('tavern');
      const s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('new');
    });

    it('new placement has no roomId', () => {
      useGameStore.getState().startPlacement('tavern');
      const s = useGameStore.getState();
      expect(s.activeItem?.roomId).toBeUndefined();
    });

    it('new placement has no originalPosition', () => {
      useGameStore.getState().startPlacement('tavern');
      const s = useGameStore.getState();
      expect(s.activeItem?.originalPosition).toBeUndefined();
    });

    it('new placement has no originalRotation', () => {
      useGameStore.getState().startPlacement('tavern');
      const s = useGameStore.getState();
      expect(s.activeItem?.originalRotation).toBeUndefined();
    });

    it('existing move has type=existing with all metadata', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 90);
      const s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('existing');
      expect(s.activeItem?.roomId).toBe('r1');
      expect(s.activeItem?.originalPosition).toEqual({ x: 2, z: 3 });
      expect(s.activeItem?.originalRotation).toBe(90);
    });
  });

  describe('isBuildMode state management', () => {
    it('starts false by default', () => {
      useGameStore.setState({ isBuildMode: false, activeItem: null });
      const s = useGameStore.getState();
      expect(s.isBuildMode).toBe(false);
    });

    it('toggleBuildMode(true) sets to true', () => {
      useGameStore.getState().toggleBuildMode(true);
      const s = useGameStore.getState();
      expect(s.isBuildMode).toBe(true);
    });

    it('toggleBuildMode(false) sets to false', () => {
      useGameStore.getState().toggleBuildMode(true);
      useGameStore.getState().toggleBuildMode(false);
      const s = useGameStore.getState();
      expect(s.isBuildMode).toBe(false);
    });

    it('startPlacement implies build mode is true', () => {
      useGameStore.getState().startPlacement('tavern');
      const s = useGameStore.getState();
      expect(s.isBuildMode).toBe(true);
    });

    it('toggleBuildMode resets placement state when toggling (expected behavior)', () => {
      useGameStore.getState().toggleBuildMode(true);
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 0);
      const beforeToggle = useGameStore.getState();
      expect(beforeToggle.activeItem?.type).toBe('existing');

      // Calling toggleBuildMode(true) again clears all build state
      useGameStore.getState().toggleBuildMode(true);
      const afterToggle = useGameStore.getState();
      expect(afterToggle.isBuildMode).toBe(true);
      expect(afterToggle.activeItem).toBeNull(); // Reset by toggleBuildMode
      expect(afterToggle.activeBuildType).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('multiple startMovingRoom calls overwrite previous', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 0);
      useGameStore.getState().startMovingRoom('r2', 'workshop', { x: 5, z: 5 }, 180);
      const s = useGameStore.getState();
      expect(s.activeItem?.roomId).toBe('r2');
      expect(s.activeItem?.roomType).toBe('workshop');
    });

    it('rotatePlacement handles null activeItem gracefully', () => {
      // Set activeItem to null
      useGameStore.setState({ activeItem: null });
      // This should not crash
      useGameStore.getState().rotatePlacement();
      const s = useGameStore.getState();
      expect(s.activeItem).toBeNull();
    });

    it('all room types supported in activeItem', () => {
      const roomTypes = ['quest-board', 'tavern', 'workshop', 'training-room', 'infirmary'] as const;
      for (const roomType of roomTypes) {
        useGameStore.getState().startMovingRoom('r1', roomType, { x: 2, z: 3 }, 0);
        const s = useGameStore.getState();
        expect(s.activeItem?.roomType).toBe(roomType);
      }
    });

    it('all rotations supported in activeItem', () => {
      const rotations: Rotation[] = [0, 90, 180, 270];
      for (const rotation of rotations) {
        useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, rotation);
        const s = useGameStore.getState();
        expect(s.activeItem?.rotation).toBe(rotation);
      }
    });

    it('position values preserved exactly', () => {
      const position = { x: 7, z: 3 };
      useGameStore.getState().startMovingRoom('r1', 'tavern', position, 0);
      const s = useGameStore.getState();
      expect(s.activeItem?.originalPosition).toEqual(position);
    });

    it('large position values handled correctly', () => {
      const position = { x: 999, z: 888 };
      useGameStore.getState().startMovingRoom('r1', 'tavern', position, 0);
      const s = useGameStore.getState();
      expect(s.activeItem?.originalPosition).toEqual(position);
    });
  });

  describe('State isolation', () => {
    it('cancelPlacement after move does not restore room position', () => {
      // Note: cancelPlacement clears state but doesn't modify guildHall
      // Room position restore is handled by the UI layer
      const hall = useGameStore.getState().guildHall;
      useGameStore.getState().startMovingRoom('moving-room', 'tavern', { x: 2, z: 3 }, 0);
      useGameStore.getState().cancelPlacement();

      // Build mode state is cleared
      const s = useGameStore.getState();
      expect(s.activeItem).toBeNull();
      expect(s.activeBuildType).toBeNull();
      // But guildHall is unchanged
      expect(s.guildHall).toEqual(hall);
    });

    it('startPlacement clears previous move state', () => {
      useGameStore.getState().startMovingRoom('r1', 'tavern', { x: 2, z: 3 }, 0);
      useGameStore.getState().startPlacement('workshop');

      const s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('new');
      expect(s.activeItem?.roomId).toBeUndefined();
      expect(s.activeBuildType).toBe('workshop');
    });
  });
});
