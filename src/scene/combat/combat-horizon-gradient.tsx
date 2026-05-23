/**
 * Combat horizon mist — a soft LIGHT haze band that dissolves the hard seam
 * where the realistic far/mid BG meets the brick ground plane.
 *
 * The BG layers use a flat color-multiply with no vertical falloff, so their
 * bottom edge is cut by the ground plane along a sharp horizontal line. A single
 * billboarded plane carries a vertical alpha BAND — clear in the sky, densest at
 * the seam, thinning into a light ground haze below — so the boundary washes out
 * into morning mist instead of a hard cut.
 *
 * For a bright morning scene the mist is LIGHT and warm-neutral (not a dark
 * band): it lowers contrast across the seam by lifting it toward the haze color.
 * `seam` positions the densest line (0 = plane top, 1 = bottom) so it can be
 * dialled onto the exact boundary; `peak`/`tail` control band density.
 *
 * Mounted from <CombatBgMid> (avoids editing the shared stage-render-host).
 * Canvas texture, no asset file. Tune via 'Combat / Horizon', then bake.
 */

import { useMemo } from 'react';
import { CanvasTexture, LinearFilter } from 'three';
import { useControls } from 'leva';
import { COMBAT_CAM_TILT_RAD } from './combat-camera-config';

/** Parse '#rgb' / '#rrggbb' → [r,g,b] (0–255). */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Vertical mist band: clear at top, holds clear until just above `seam`, peaks
 * at `seam`, then eases down to a light `tail` over the floor. Canvas y=0 (top)
 * maps to the plane top (CanvasTexture flipY default) → the sky side.
 */
function createMistTexture(color: string, peak: number, tail: number, seam: number): CanvasTexture {
  const w = 4;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const [r, g, b] = hexToRgb(color);
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;
  const featherTop = Math.max(0, seam - 0.18);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, rgba(0)); // sky: fully clear
  grad.addColorStop(featherTop, rgba(0)); // hold clear into lower sky
  grad.addColorStop(Math.min(1, seam), rgba(peak)); // seam: densest mist
  grad.addColorStop(1, rgba(tail)); // floor: light lingering haze
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const tex = new CanvasTexture(c);
  // Smooth ramp (photographic, not pixel art).
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  return tex;
}

export function CombatHorizonGradient() {
  const { enabled, width, height, x, y, z, color, peak, tail, seam } = useControls(
    'Combat / Horizon',
    {
      enabled: { value: true },
      width: { value: 34, min: 5, max: 80, step: 0.5 },
      height: { value: 9, min: 1, max: 30, step: 0.5 },
      x: { value: 0, min: -20, max: 20, step: 0.1 },
      y: { value: 0.1, min: -10, max: 10, step: 0.1 },
      z: { value: -6.0, min: -20, max: -1, step: 0.5 },
      // Light, warm-neutral morning haze — washes the seam toward this colour.
      color: { value: '#bcbcb0' },
      peak: { value: 0.40, min: 0, max: 1, step: 0.01 }, // density at the seam
      tail: { value: 0.12, min: 0, max: 1, step: 0.01 }, // light haze over floor
      seam: { value: 0.58, min: 0, max: 1, step: 0.01 }, // align peak to boundary
    },
    { collapsed: true },
  );

  const tex = useMemo(
    () => createMistTexture(color, peak, tail, seam),
    [color, peak, tail, seam],
  );

  if (!enabled) return null;

  return (
    <mesh position={[x, y, z]} rotation={[-COMBAT_CAM_TILT_RAD, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}
