/**
 * Single source of truth for the guild hall floor grid size (world units).
 *
 * Consumed by:
 * - guild-slice.ts `createDefaultFloor` → seeds the logical floorTiles set.
 * - guild-hall.tsx → sizes the visual floor plane + walls + front frame.
 * - camera-slice.ts → derives GUILD_HALL_CAMERA_TARGET (room center).
 *
 * Note: this only governs the DEFAULT grid. Persisted saves keep their own
 * floorTiles snapshot, and build mode can edit tiles into a non-rectangular
 * shape — so logical floorTiles may diverge from this rectangle at runtime.
 */

export const GUILD_HALL_GRID_WIDTH = 10;
export const GUILD_HALL_GRID_DEPTH = 7;
