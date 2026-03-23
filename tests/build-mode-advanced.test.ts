import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/game/state/store';
import type { GuildHall, FloorTile, PlacedFurniture } from '@/game/state/game-state';

const defaultTiles: FloorTile[] = Array.from({ length: 36 }, (_, i) =>
  ({ x: i % 6, z: Math.floor(i / 6), color: '#DAA520' }));

const makeHall = (tiles: FloorTile[] = defaultTiles, furniture: PlacedFurniture[] = []): GuildHall => ({
  level: 1,
  floorTiles: tiles,
  furniture,
});

describe('BuildModeAdvanced', () => {
  beforeEach(() => {
    useGameStore.setState({
      isBuildMode: false,
      activeItem: null,
      guildHall: makeHall(defaultTiles, [
        { id: 'f1', type: 'quest-board', level: 1, position: { x: 2, z: 2 }, rotation: 0 },
      ]),
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
      useGameStore.getState().startFloorPaint('#DAA520');
      useGameStore.getState().toggleBuildMode(false);
      expect(useGameStore.getState().activeItem).toBeNull();
    });

    it('clears activeItem when re-entering build mode', () => {
      useGameStore.getState().startFloorPaint('#DAA520');
      useGameStore.getState().toggleBuildMode(true);
      expect(useGameStore.getState().activeItem).toBeNull();
    });
  });

  describe('startFloorPaint (floor-tile)', () => {
    it('sets activeItem with type floor-tile', () => {
      useGameStore.getState().startFloorPaint('#4682B4');
      const s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('floor-tile');
      expect(s.activeItem?.selectedColor).toBe('#4682B4');
    });

    it('sets isBuildMode to true', () => {
      useGameStore.getState().startFloorPaint('#DAA520');
      expect(useGameStore.getState().isBuildMode).toBe(true);
    });
  });

  describe('startFloorErase (erase-tile)', () => {
    it('sets activeItem with type erase-tile', () => {
      useGameStore.getState().startFloorErase();
      const s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('erase-tile');
    });

    it('sets isBuildMode to true', () => {
      useGameStore.getState().startFloorErase();
      expect(useGameStore.getState().isBuildMode).toBe(true);
    });
  });

  describe('startFurniturePlacement (furniture)', () => {
    it('sets activeItem with type furniture', () => {
      useGameStore.getState().startFurniturePlacement('wine-barrel');
      const s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('furniture');
      expect(s.activeItem?.furnitureType).toBe('wine-barrel');
    });

    it('sets isBuildMode to true', () => {
      useGameStore.getState().startFurniturePlacement('wine-barrel');
      expect(useGameStore.getState().isBuildMode).toBe(true);
    });

    it('starts with rotation 0', () => {
      useGameStore.getState().startFurniturePlacement('wine-barrel');
      expect(useGameStore.getState().activeItem?.rotation).toBe(0);
    });
  });

  describe('rotatePlacement with activeItem', () => {
    it('updates rotation', () => {
      useGameStore.getState().startFurniturePlacement('wine-barrel');
      useGameStore.getState().rotatePlacement();
      expect(useGameStore.getState().activeItem?.rotation).toBe(90);
    });

    it('cycles rotation through 0→90→180→270→0', () => {
      useGameStore.getState().startFurniturePlacement('wine-barrel');
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

    it('handles null activeItem gracefully', () => {
      useGameStore.setState({ activeItem: null });
      useGameStore.getState().rotatePlacement();
      expect(useGameStore.getState().activeItem).toBeNull();
    });
  });

  describe('cancelPlacement', () => {
    it('clears activeItem', () => {
      useGameStore.getState().startFloorPaint('#DAA520');
      useGameStore.getState().cancelPlacement();
      expect(useGameStore.getState().activeItem).toBeNull();
    });

    it('works with floor-tile', () => {
      useGameStore.getState().startFloorPaint('#DAA520');
      useGameStore.getState().cancelPlacement();
      expect(useGameStore.getState().activeItem).toBeNull();
    });

    it('works with erase-tile', () => {
      useGameStore.getState().startFloorErase();
      useGameStore.getState().cancelPlacement();
      expect(useGameStore.getState().activeItem).toBeNull();
    });

    it('works with furniture', () => {
      useGameStore.getState().startFurniturePlacement('wine-barrel');
      useGameStore.getState().cancelPlacement();
      expect(useGameStore.getState().activeItem).toBeNull();
    });
  });

  describe('Integration: full placement cycle', () => {
    it('completes paint cycle and clears state', () => {
      useGameStore.getState().startFloorPaint('#4682B4');
      let s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('floor-tile');

      useGameStore.getState().cancelPlacement();
      s = useGameStore.getState();
      expect(s.activeItem).toBeNull();
    });

    it('startFloorPaint clears previous furniture state', () => {
      useGameStore.getState().startFurniturePlacement('wine-barrel');
      useGameStore.getState().startFloorPaint('#DAA520');

      const s = useGameStore.getState();
      expect(s.activeItem?.type).toBe('floor-tile');
      expect(s.activeItem?.furnitureType).toBeUndefined();
    });
  });

  describe('State isolation', () => {
    it('cancelPlacement does not modify guildHall', () => {
      const hall = useGameStore.getState().guildHall;
      useGameStore.getState().startFloorPaint('#DAA520');
      useGameStore.getState().cancelPlacement();

      expect(useGameStore.getState().activeItem).toBeNull();
      expect(useGameStore.getState().guildHall).toEqual(hall);
    });
  });
});
