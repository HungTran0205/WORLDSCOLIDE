import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/game/state/store';
import type { Room } from '@/game/state/game-state';
import { generateRoomCells } from '@/game/systems/building-system';
import type { GuildHall } from '@/game/state/game-state';

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

describe('BuildModeAdvanced', () => {
  beforeEach(() => {
    useGameStore.setState({
      isBuildMode: false,
      activeItem: null,
      guildHall: makeHall([makeRoom({
        id: 'room-guild-hall', type: 'guild-hall',
        cells: generateRoomCells(0, 0, 6, 6),
        furniture: [{ id: 'f1', type: 'quest-board', level: 1, position: { x: 2, z: 2 }, rotation: 0 }],
      })]),
      gold: 1000,
    });
  });

  describe('toggleBuildMode', () => {
    it('enters build mode when called with true', () => {
      useGameStore.getState().toggleBuildMode(true);
      expect(useGameStore.getState().isBuildMode).toBe(true);
    });

    it('exits build mode when called with false', () => {
      useGameStore.getState().toggleBuildMode(true);
      useGameStore.getState().toggleBuildMode(false);
      expect(useGameStore.getState().isBuildMode).toBe(false);
    });

    it('clears activeItem when toggling', () => {
      useGameStore.getState().startPlacement('tavern');
      useGameStore.getState().toggleBuildMode(false);
      expect(useGameStore.getState().activeItem).toBeNull();
    });

    it('clears activeItem when re-entering build mode', () => {
      useGameStore.getState().startPlacement('tavern');
      useGameStore.getState().toggleBuildMode(true);
      expect(useGameStore.getState().activeItem).toBeNull();
    });
  });

  describe('startPlacement (new-room)', () => {
    it('sets activeItem with type new-room', () => {
      useGameStore.getState().startPlacement('tavern');
      const s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('new-room');
      expect(s.activeItem?.roomType).toBe('tavern');
    });

    it('sets isBuildMode to true', () => {
      useGameStore.getState().startPlacement('tavern');
      expect(useGameStore.getState().isBuildMode).toBe(true);
    });

    it('has no roomId for new placement', () => {
      useGameStore.getState().startPlacement('tavern');
      expect(useGameStore.getState().activeItem?.roomId).toBeUndefined();
    });
  });

  describe('startMovingRoom (move-room)', () => {
    it('sets activeItem with type move-room', () => {
      const cells = generateRoomCells(2, 3, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'tavern', cells);
      const s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('move-room');
    });

    it('captures roomId in activeItem', () => {
      const cells = generateRoomCells(2, 3, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'tavern', cells);
      expect(useGameStore.getState().activeItem?.roomId).toBe('r1');
    });

    it('captures roomType in activeItem', () => {
      const cells = generateRoomCells(2, 3, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'training-room', cells);
      expect(useGameStore.getState().activeItem?.roomType).toBe('training-room');
    });

    it('captures originalCells for cancel restore', () => {
      const cells = generateRoomCells(4, 5, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'tavern', cells);
      expect(useGameStore.getState().activeItem?.originalCells).toEqual(cells);
    });

    it('sets isBuildMode to true', () => {
      const cells = generateRoomCells(2, 3, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'tavern', cells);
      expect(useGameStore.getState().isBuildMode).toBe(true);
    });
  });

  describe('startFurniturePlacement (new-furniture)', () => {
    it('sets activeItem with type new-furniture', () => {
      useGameStore.getState().startFurniturePlacement('wine-barrel', 'room-guild-hall');
      const s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('new-furniture');
      expect(s.activeItem?.furnitureType).toBe('wine-barrel');
      expect(s.activeItem?.targetRoomId).toBe('room-guild-hall');
    });

    it('sets isBuildMode to true', () => {
      useGameStore.getState().startFurniturePlacement('wine-barrel', 'room-guild-hall');
      expect(useGameStore.getState().isBuildMode).toBe(true);
    });

    it('starts with rotation 0', () => {
      useGameStore.getState().startFurniturePlacement('wine-barrel', 'room-guild-hall');
      expect(useGameStore.getState().activeItem?.rotation).toBe(0);
    });
  });

  describe('rotatePlacement with activeItem', () => {
    it('updates rotation during move', () => {
      const cells = generateRoomCells(2, 3, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'tavern', cells);
      useGameStore.getState().rotatePlacement();
      expect(useGameStore.getState().activeItem?.rotation).toBe(90);
    });

    it('cycles rotation through 0→90→180→270→0', () => {
      const cells = generateRoomCells(2, 3, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'tavern', cells);
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

    it('preserves originalCells during rotation', () => {
      const cells = generateRoomCells(4, 5, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'tavern', cells);
      useGameStore.getState().rotatePlacement();
      expect(useGameStore.getState().activeItem?.originalCells).toEqual(cells);
    });

    it('handles null activeItem gracefully', () => {
      useGameStore.setState({ activeItem: null });
      useGameStore.getState().rotatePlacement();
      expect(useGameStore.getState().activeItem).toBeNull();
    });
  });

  describe('cancelPlacement', () => {
    it('clears activeItem', () => {
      const cells = generateRoomCells(2, 3, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'tavern', cells);
      useGameStore.getState().cancelPlacement();
      expect(useGameStore.getState().activeItem).toBeNull();
    });

    it('works with new-room placement', () => {
      useGameStore.getState().startPlacement('tavern');
      useGameStore.getState().cancelPlacement();
      expect(useGameStore.getState().activeItem).toBeNull();
    });

    it('works with new-furniture placement', () => {
      useGameStore.getState().startFurniturePlacement('wine-barrel', 'room-guild-hall');
      useGameStore.getState().cancelPlacement();
      expect(useGameStore.getState().activeItem).toBeNull();
    });

    it('works with move-room', () => {
      const cells = generateRoomCells(2, 3, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'tavern', cells);
      useGameStore.getState().cancelPlacement();
      expect(useGameStore.getState().activeItem).toBeNull();
    });
  });

  describe('Integration: full placement cycle', () => {
    it('completes move cycle and clears state', () => {
      const cells = generateRoomCells(2, 3, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'tavern', cells);
      let s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('move-room');
      expect(s.activeItem?.originalCells).toEqual(cells);

      useGameStore.getState().rotatePlacement();
      s = useGameStore.getState();
      expect(s.activeItem?.rotation).toBe(90);
      expect(s.activeItem?.originalCells).toEqual(cells);

      useGameStore.getState().cancelPlacement();
      s = useGameStore.getState();
      expect(s.activeItem).toBeNull();
    });

    it('startPlacement clears previous move state', () => {
      const cells = generateRoomCells(2, 3, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'tavern', cells);
      useGameStore.getState().startPlacement('workshop');

      const s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('new-room');
      expect(s.activeItem?.roomId).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('multiple startMovingRoom calls overwrite previous', () => {
      const cells1 = generateRoomCells(2, 3, 6, 6);
      const cells2 = generateRoomCells(5, 5, 6, 6);
      useGameStore.getState().startMovingRoom('r1', 'tavern', cells1);
      useGameStore.getState().startMovingRoom('r2', 'workshop', cells2);
      const s = useGameStore.getState();
      expect(s.activeItem?.roomId).toBe('r2');
      expect(s.activeItem?.roomType).toBe('workshop');
    });

    it('all room types supported in activeItem', () => {
      const roomTypes = ['guild-hall', 'tavern', 'workshop', 'training-room', 'infirmary'] as const;
      for (const roomType of roomTypes) {
        const cells = generateRoomCells(2, 3, 6, 6);
        useGameStore.getState().startMovingRoom('r1', roomType, cells);
        expect(useGameStore.getState().activeItem?.roomType).toBe(roomType);
      }
    });
  });

  describe('State isolation', () => {
    it('cancelPlacement does not modify guildHall', () => {
      const hall = useGameStore.getState().guildHall;
      const cells = generateRoomCells(2, 3, 6, 6);
      useGameStore.getState().startMovingRoom('moving-room', 'tavern', cells);
      useGameStore.getState().cancelPlacement();

      expect(useGameStore.getState().activeItem).toBeNull();
      expect(useGameStore.getState().guildHall).toEqual(hall);
    });
  });
});
