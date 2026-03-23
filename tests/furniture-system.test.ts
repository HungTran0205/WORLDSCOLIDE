import { describe, it, expect } from 'vitest';
import {
  getFurnitureCells,
  canPlaceFurnitureOnFloor,
} from '@/game/systems/furniture-system';
import type { FloorTile, PlacedFurniture, GuildHall } from '@/game/state/game-state';

const defaultTiles: FloorTile[] = Array.from({ length: 36 }, (_, i) =>
  ({ x: i % 6, z: Math.floor(i / 6), color: '#DAA520' }));

const makeGuildHall = (tiles: FloorTile[] = defaultTiles, furniture: PlacedFurniture[] = []): GuildHall =>
  ({ level: 1, floorTiles: tiles, furniture });

describe('furniture-system (floor-based)', () => {
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

  describe('canPlaceFurnitureOnFloor', () => {
    it('allows valid placement', () => {
      const gh = makeGuildHall();
      const result = canPlaceFurnitureOnFloor(gh, 'quest-board', { x: 2, z: 2 }, 0, 1);
      expect(result.success).toBe(true);
    });

    it('rejects when no floor tile underneath', () => {
      const gh = makeGuildHall();
      const result = canPlaceFurnitureOnFloor(gh, 'quest-board', { x: 10, z: 10 }, 0, 1);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('No floor tile');
    });

    it('rejects when guild level too low', () => {
      const gh = makeGuildHall();
      // bar-counter unlocked at level 2
      const result = canPlaceFurnitureOnFloor(gh, 'bar-counter', { x: 0, z: 0 }, 0, 1);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('locked');
    });

    it('rejects when max per guild reached', () => {
      const existing: PlacedFurniture[] = [
        { id: '1', type: 'quest-board', level: 1, position: { x: 0, z: 0 }, rotation: 0 },
      ];
      const gh = makeGuildHall(defaultTiles, existing);
      const result = canPlaceFurnitureOnFloor(gh, 'quest-board', { x: 2, z: 2 }, 0, 1);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Max');
    });

    it('rejects when overlapping existing furniture', () => {
      const existing: PlacedFurniture[] = [
        { id: '1', type: 'quest-board', level: 1, position: { x: 2, z: 2 }, rotation: 0 },
      ];
      const gh = makeGuildHall(defaultTiles, existing);
      // reception-desk unlocked at level 2
      const result = canPlaceFurnitureOnFloor(gh, 'reception-desk', { x: 2, z: 2 }, 0, 2);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Overlaps');
    });

    it('handles rotation for placement validation', () => {
      const gh = makeGuildHall();
      // bar-counter is 2x1, at rotation 90 becomes 1x2
      const result = canPlaceFurnitureOnFloor(gh, 'bar-counter', { x: 0, z: 0 }, 90, 2);
      expect(result.success).toBe(true);
    });
  });
});
