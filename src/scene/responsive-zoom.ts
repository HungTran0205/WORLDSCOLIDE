/**
 * Responsive orthographic zoom for the guild-hall camera.
 *
 * The Canvas uses an orthographic camera, so the visible world width =
 * canvasWidthPx / zoom. A fixed zoom (190) frames the hall nicely on desktop
 * but glues the camera to the hall on narrow phones (390px → ~2 world units).
 *
 * Desktop is left byte-identical: at width >= MOBILE_BREAKPOINT we return the
 * original DESKTOP_ZOOM and the original 180/220 OrbitControls clamps. Only
 * below the breakpoint do we scale zoom down to fit the hall in frame.
 */

export const DESKTOP_ZOOM = 190;
export const MOBILE_BREAKPOINT = 1024;

// Original OrbitControls clamp band (desktop). Scaled proportionally on mobile.
export const DESKTOP_MIN_ZOOM = 180;
export const DESKTOP_MAX_ZOOM = 220;

// Target "world view" extents that should fit on screen on mobile. The hall
// footprint is 10x7 viewed at a 45° isometric angle (projected horizontal
// extent ~12u). Tunable by eye in the browser — see responsive-zoom plan.
export const FIT_W = 12;
export const FIT_H = 10;

// Safety floor for degenerate viewport sizes (e.g. 0px during layout) — a
// positive zoom keeps the projection valid. Real phones fit well above this.
export const MIN_ZOOM = 10;

export interface ViewportSize {
  width: number;
  height: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Base orthographic zoom for a given viewport. Desktop (>= breakpoint) keeps
 * DESKTOP_ZOOM exactly; mobile fits the hall in both axes (min of the two so a
 * short landscape phone isn't clipped vertically).
 */
export function computeBaseZoom({ width, height }: ViewportSize): number {
  if (width >= MOBILE_BREAKPOINT) return DESKTOP_ZOOM;
  const fit = Math.min(width / FIT_W, height / FIT_H);
  return clamp(fit, MIN_ZOOM, DESKTOP_ZOOM);
}

/**
 * OrbitControls min/max zoom clamps scaled to the base zoom so pinch-zoom keeps
 * the same relative range on mobile. Desktop scale = 1 → original 180/220.
 */
export function computeZoomClamps(baseZoom: number): { minZoom: number; maxZoom: number } {
  const s = baseZoom / DESKTOP_ZOOM;
  return { minZoom: DESKTOP_MIN_ZOOM * s, maxZoom: DESKTOP_MAX_ZOOM * s };
}
