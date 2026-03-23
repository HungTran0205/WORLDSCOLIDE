import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkTileAdjacency,
  isCellOccupiedByFurniture,
  getWorldBounds,
} from '@/game/systems/building-system';
import { useGameStore } from '@/game/state/store';
import type { FloorTile, PlacedFurniture } from '@/game/state/game-state';

describe('building-system (tile-based)', () => {
  describe('checkTileAdjacency', () => {
    it('first tile always valid', () => {
      expect(checkTileAdjacency([], 0, 0)).toBe(true);
    });

    it('adjacent tile valid (right)', () => {
      const tiles: FloorTile[] = [{ x: 0, z: 0, color: '#DAA520' }];
      expect(checkTileAdjacency(tiles, 1, 0)).toBe(true);
    });

    it('adjacent tile valid (below)', () => {
      const tiles: FloorTile[] = [{ x: 0, z: 0, color: '#DAA520' }];
      expect(checkTileAdjacency(tiles, 0, 1)).toBe(true);
    });

    it('diagonal tile invalid', () => {
      const tiles: FloorTile[] = [{ x: 0, z: 0, color: '#DAA520' }];
      expect(checkTileAdjacency(tiles, 1, 1)).toBe(false);
    });

    it('distant tile invalid', () => {
      const tiles: FloorTile[] = [{ x: 0, z: 0, color: '#DAA520' }];
      expect(checkTileAdjacency(tiles, 3, 0)).toBe(false);
    });
  });

  describe('isCellOccupiedByFurniture', () => {
    it('returns false for empty furniture', () => {
      expect(isCellOccupiedByFurniture([], 0, 0)).toBe(false);
    });

    it('returns true when cell occupied', () => {
      const furniture: PlacedFurniture[] = [
        { id: '1', type: 'quest-board', level: 1, position: { x: 0, z: 0 }, rotation: 0 },
      ];
      expect(isCellOccupiedByFurniture(furniture, 0, 0)).toBe(true);
    });

    it('returns false for adjacent unoccupied cell', () => {
      const furniture: PlacedFurniture[] = [
        { id: '1', type: 'quest-board', level: 1, position: { x: 0, z: 0 }, rotation: 0 },
      ];
      expect(isCellOccupiedByFurniture(furniture, 1, 0)).toBe(false);
    });
  });

  describe('getWorldBounds', () => {
    it('returns default for empty tiles', () => {
      expect(getWorldBounds([])).toEqual({ minX: 0, minZ: 0, maxX: 6, maxZ: 6 });
    });

    it('computes from single tile', () => {
      const tiles: FloorTile[] = [{ x: 2, z: 3, color: '#fff' }];
      expect(getWorldBounds(tiles)).toEqual({ minX: 2, minZ: 3, maxX: 3, maxZ: 4 });
    });

    it('computes from multiple tiles', () => {
      const tiles: FloorTile[] = [
        { x: 2, z: 3, color: '#fff' },
        { x: 5, z: 1, color: '#fff' },
      ];
      expect(getWorldBounds(tiles)).toEqual({ minX: 2, minZ: 1, maxX: 6, maxZ: 4 });
    });
  });
});

describe('BuildModeSlice', () => {
  beforeEach(() => {
    useGameStore.setState({ activeItem: null });
  });

  it('startFloorPaint sets activeItem with type floor-tile', () => {
    useGameStore.getState().startFloorPaint('#DAA520');
    const s = useGameStore.getState();
    expect(s.activeItem?.type).toBe('floor-tile');
    expect(s.activeItem?.selectedColor).toBe('#DAA520');
    expect(s.activeItem?.rotation).toBe(0);
  });

  it('rotatePlacement cycles through 0→90→180→270→0', () => {
    useGameStore.getState().startFurniturePlacement('quest-board');
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
    useGameStore.getState().startFloorPaint('#DAA520');
    useGameStore.getState().cancelPlacement();
    expect(useGameStore.getState().activeItem).toBeNull();
  });
});
