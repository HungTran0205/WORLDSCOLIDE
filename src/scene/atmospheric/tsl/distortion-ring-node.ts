/**
 * Distortion ring TSL node — radial screen-space UV warp driven by ring impulses.
 *
 * Each ring's slot carries [centerU, centerV, radius01, strength] from the
 * distortion-ring-store. The shader displaces screenUV radially from each ring
 * center, peaking at the current ring radius (thin annulus falloff) and decaying
 * with strength → 0 as the ring fades out. Distance is aspect-corrected so
 * rings appear circular, not oval.
 *
 * Disabled state: when all ring slots have strength (w) = 0, all displacements
 * collapse to vec2(0) → uv unchanged → exact identity sample. No chain rebuild
 * required — zero-strength is a mathematical no-op.
 *
 * Mirrors heat-haze-node.ts pattern: (input, uniforms) → warped texture sample.
 *
 * Math derivation:
 *   dx = (screenUV.x - cx), dy = (screenUV.y - cy)
 *   d_screen = length(vec2(dx * aspect, dy))     // aspect-correct circle
 *   falloff   = smoothstep(HALF, 0, |d_screen - radius01|) // annulus crest
 *   disp_mag  = strength * falloff / (d_screen + EPSILON)
 *   disp_uv   = (dx, dy) * disp_mag               // radial outward in UV space
 */

import { vec2, vec4, uv, float, length, smoothstep, convertToTexture } from 'three/tsl';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Annulus falloff half-width. 0.18 = ring is visible for ~36% of the screen
 *  radius range; narrower feels like a tighter wave front. */
const FALLOFF_HALF = 0.18;
/** Prevents divide-by-zero at ring center. 0.0001 = sub-pixel clamp. */
const EPSILON = 0.0001;

/**
 * @param input    Upstream chain color node (post-bloom, post-heat-haze).
 * @param rings    Array of 4 TSL vec4 uniform nodes. Each slot:
 *                   x = centerU (screen UV 0..1)
 *                   y = centerV (screen UV 0..1)
 *                   z = radius01 (0 = just spawned, 1 = fully expanded)
 *                   w = strength (maxStrength → 0 over lifetime; 0 = inactive)
 * @param aspectU  Viewport aspect ratio uniform (width/height). Keeps rings
 *                 circular on non-square screens.
 */
export function distortionRingNode(input: any, rings: any[], aspectU: any): any {
  const tex = (convertToTexture as any)(input);
  const screenUv = uv();

  let displX: any = float(0);
  let displY: any = float(0);

  for (const ring of rings) {
    const cx       = ring.x;
    const cy       = ring.y;
    const radius01 = ring.z;
    const strength = ring.w;

    const dx = screenUv.x.sub(cx);
    const dy = screenUv.y.sub(cy);
    // Aspect-corrected distance: ensures rings look circular on 16:9 screens.
    const dScreen = length(vec2(dx.mul(aspectU), dy));
    // Annulus: peaks at dScreen == radius01, fades to 0 beyond FALLOFF_HALF.
    const falloff = smoothstep(float(FALLOFF_HALF), float(0), dScreen.sub(radius01).abs());
    // Radial displacement magnitude — bounded because dx,dy → 0 as dScreen → 0.
    const mag = strength.mul(falloff).div(dScreen.add(float(EPSILON)));
    displX = displX.add(dx.mul(mag));
    displY = displY.add(dy.mul(mag));
  }

  const warped = screenUv.add(vec2(displX, displY));
  return vec4(tex.sample(warped));
}
