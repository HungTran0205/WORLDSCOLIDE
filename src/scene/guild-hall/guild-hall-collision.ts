/**
 * Guild hall walk-collision registry + pure point-vs-rect tests.
 *
 * Footprints are NOT hardcoded — each static prop registers its real
 * world-space XZ AABB at runtime (see use-register-obstacle.ts), so collision
 * stays in sync with prop position/scale automatically and never drifts.
 *
 * This module holds the registry plus PURE math helpers (no React/Three
 * import) so the math stays unit-testable in isolation.
 */

/** World-space XZ axis-aligned bounding box for a static obstacle. */
export interface RectObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Member half-width padding so sprites don't visually clip obstacle edges. */
export const DEFAULT_MEMBER_RADIUS = 0.28;

/** Module-level registry. Non-reactive — read per-frame in useFrame. */
const registry = new Map<string, RectObstacle>();

/** Register (or replace) a prop's footprint by stable id. */
export function registerObstacle(id: string, rect: RectObstacle): void {
  registry.set(id, rect);
}

/** Remove a prop's footprint (called on unmount). */
export function unregisterObstacle(id: string): void {
  registry.delete(id);
}

/** Snapshot of all registered footprints — used by the debug overlay. */
export function getObstacles(): { id: string; rect: RectObstacle }[] {
  return Array.from(registry, ([id, rect]) => ({ id, rect }));
}

/** Pure: is the (radius-padded) point inside a single rect? */
export function isRectBlocked(
  x: number,
  z: number,
  rect: RectObstacle,
  radius = DEFAULT_MEMBER_RADIUS,
): boolean {
  return (
    x >= rect.minX - radius &&
    x <= rect.maxX + radius &&
    z >= rect.minZ - radius &&
    z <= rect.maxZ + radius
  );
}

/**
 * Is the (radius-padded) point blocked by ANY registered obstacle?
 * Returns false when the registry is empty (props not loaded yet) so movement
 * stays free until footprints register — graceful, self-healing.
 */
export function isGuildHallPointBlocked(
  x: number,
  z: number,
  radius = DEFAULT_MEMBER_RADIUS,
): boolean {
  for (const rect of registry.values()) {
    if (isRectBlocked(x, z, rect, radius)) return true;
  }
  return false;
}
