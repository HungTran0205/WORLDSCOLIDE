/**
 * Shared combat camera constants — single source of truth for the
 * isometric tilt angle, position, and zoom. Used by:
 *  - world.tsx (mounts the drei OrthographicCamera + force-resets it on
 *    every combat-open transition to defeat external mutations)
 *  - combat-idle-sprite.tsx (billboards each sprite plane around X by
 *    TILT_RAD so sprites stay full-height under the tilted view)
 *
 * Geometry: camera positioned at (0, h, d) looking at origin, where
 * h = d * tan(TILT_RAD). This gives an elevation angle of TILT_RAD
 * above the battlefield plane (Y=0).
 */

/** Sprite billboard tilt — combat-idle-sprite.tsx rotates each sprite plane
 *  around X by this so sprites stay full-height under the tilted view.
 *  This is NOT the same as the camera's real viewing angle (which depends
 *  on lookAt target). Tuned visually with leva. */
export const COMBAT_CAM_TILT_DEG = 22;
export const COMBAT_CAM_TILT_RAD = (COMBAT_CAM_TILT_DEG * Math.PI) / 180;
export const COMBAT_CAM_DIST = 12;

/** Elevation multiplier — scales tilt-derived height. Decouples camera Y
 *  position from sprite billboard angle. Baked from leva `elev mult 1.55`. */
export const COMBAT_CAM_ELEV_MULT = 1.65;

/** Camera Y position — DIST * tan(TILT) * ELEV_MULT. */
export const COMBAT_CAM_HEIGHT = COMBAT_CAM_DIST * Math.tan(COMBAT_CAM_TILT_RAD) * COMBAT_CAM_ELEV_MULT;

// Zoom 64 — paired with the enlarged battle panel (~80% screen, see
// `.combat-panel--phase-battle` in combat-panel.css). Bumped from 42 so the
// fighters fill the larger rect instead of sitting small in empty arena.
// Coverage constraint: panel-visible world width = panel_px / zoom must stay
// ≤ far-bg width (25.5u) or the bg edge shows. At 1536px / 64 = 24u ≤ 25.5u ✓.
// Keep zoom ≥ ~63 at this panel width; if lowered, widen far/mid bg planes.
// Live-tune via leva `Combat / Camera`, then bake the final value here.
export const COMBAT_CAM_ZOOM = 64;

/** Look-at point — Y=3.0 pushes ground (y=0) toward bottom of viewport so
 *  foreground ground is visible under sprites instead of dominating
 *  mid-panel. Baked from leva `lookAt Y 3.0`. */
export const COMBAT_CAM_TARGET: [number, number, number] = [0, 3.5, 0];

/** Base sprite world-height (un-foreshortened). Boss = 5.4, regular = 3.96.
 *  Phase 1 polish: scale up ~1.65x from original to make sprites dominant.
 *  History: original 2.4/3.2 → 4.4/6.0 (too big) → 3.96/5.4 (-10% trim). */
export const COMBAT_SPRITE_BASE_SCALE = 3.96;
export const COMBAT_SPRITE_BOSS_SCALE = 5.4;

/**
 * Foreshortening factor per +1 unit of z (camera at +Z, looking down at origin).
 * Front-row entities (z > 0, closer to camera) appear larger; back-row (z < 0)
 * smaller. Linear scaling because it's a fake — actual orthographic camera
 * has no foreshortening. Tune via PSEUDO_FORESHORTEN_PER_Z; 0.03 → ±9% at z=±3.
 */
export const COMBAT_SPRITE_FORESHORTEN_PER_Z = 0.03;

/** Compute sprite scale incorporating fake foreshortening from lane z. */
export function getCombatSpriteScale(z: number, isBoss: boolean): number {
  const base = isBoss ? COMBAT_SPRITE_BOSS_SCALE : COMBAT_SPRITE_BASE_SCALE;
  return base * (1 + z * COMBAT_SPRITE_FORESHORTEN_PER_Z);
}
