/**
 * Chromatic Aberration TSL node — pmndrs-style UV-offset RGB split.
 *
 * Matches pmndrs `ChromaticAberrationEffect` (no radial modulation):
 *   shift = offset
 *   R samples at uv + shift
 *   G samples at uv (centered)
 *   B samples at uv - shift
 *
 * Reference (verbatim sign convention from
 * `postprocessing/src/effects/glsl/chromatic-aberration.{vert,frag}`):
 *   vUvR = uv + shift; vUvB = uv - shift;
 *   outputColor = vec4(texture(vUvR).r, inputColor.g, texture(vUvB).b, ...)
 *
 * Why `convertToTexture(input)`: intermediate chain nodes (results of
 * vignette/colorGrade) are graph ops, not texture-backed, so they can't be
 * sampled at offset UVs. `convertToTexture` materializes the upstream chain
 * into a render target so `.sample(uv ± offset)` works correctly. Adds one
 * pass-through render target (negligible at our resolution); this is the
 * same pattern three's built-in `ChromaticAberrationNode` uses.
 *
 * Disabled state: when `offsetU.value = (0, 0)` all three samples collapse
 * to the same UV — TSL/driver should fold to a single fetch. No rebuild
 * needed when the host preset toggles `chromaticAberration` off.
 *
 * Known parity deviation vs WebGL: pmndrs's vertex stage multiplies Y by
 * screen aspect (`shift = offset * vec2(1.0, aspect)`). This node uses
 * offset unscaled — Y fringing magnitude will differ on non-square
 * viewports. Acceptable today (all 9 presets pass `chromaticAberration:
 * null`); revisit in Phase 06 parity-validation if a preset opts in.
 */

import { vec4, uv, convertToTexture } from 'three/tsl';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @param input    Color node (chain output to split).
 * @param offsetU  `uniform(Vector2)` handle — UV offset in screen space.
 */
export function chromaticAberrationNode(input: any, offsetU: any): any {
  const tex = (convertToTexture as any)(input);
  const screenUv = uv();
  // Share the center fetch for G + A so a zero-offset chain folds to three
  // identical sample calls (TSL/driver collapse to one) instead of four.
  const center = tex.sample(screenUv);
  const r = tex.sample(screenUv.add(offsetU)).r;
  const b = tex.sample(screenUv.sub(offsetU)).b;
  return vec4(r, center.g, b, center.a);
}
