/**
 * Tilt-Shift TSL node — Gaussian-blurred top/bottom, sharp focus strip across
 * screen-Y centerline. HD-2D diorama band that mimics miniature-scene look.
 *
 * Approach (Option A from phase plan): reuse three's built-in
 * `gaussianBlur(node, direction, sigma, {resolutionScale})` helper — it
 * already handles separable H+V passes via two intermediate render targets
 * (see `GaussianBlurNode.updateBefore`), so we don't need to spike RT wiring
 * ourselves. We then mix sharp ↔ blurred based on screen-Y distance from
 * focal strip.
 *
 * Mask formula (matches WebGL pmndrs `<TiltShift focusArea={1-strength}
 * feather={0.3} />` semantics):
 *   focusBandHalfWidth = (1 - strength) * 0.5    // strength=0 → 0.5 (all sharp)
 *                                                // strength=1 → 0   (all blurred)
 *   bandDist = abs(uv.y - 0.5) - focusBandHalfWidth
 *   mask = smoothstep(0, FEATHER, bandDist)      // 0 in focus, 1 outside
 *   out = mix(sharp, blurred, mask)
 *
 * Why `(1-strength)*0.5` maps to pmndrs's `focusArea`: pmndrs computes the
 * mask in normalized -1..1 Y-space (`vUv2.y = (uv.y - 0.5) * 2`) and uses
 * `focusArea` as the half-width there. So in 0..1 UV space the equivalent
 * half-width is `focusArea / 2 = (1 - strength) / 2`. WebGL stack passes
 * `focusArea = 1 - strength`, so the result matches exactly.
 *
 * Disabled state: when `strengthU.value = 0`, focusBandHalfWidth = 0.5 →
 * bandDist ≤ 0 everywhere → smoothstep → 0 → mask = 0 → output = sharp
 * unchanged. No chain rebuild needed when preset toggles `enabled`. The
 * Gaussian pass still runs (≈half-res, ~1ms on dev machine); acceptable
 * given preset toggles are rare. Phase 06 profiles before optimizing.
 *
 * Why share `convertToTexture` between sharp + blurred: the input chain is
 * a graph op (post-bloom, pre-grade), not a texture. We materialize it once
 * into a render target so both the sharp sample and the Gaussian pass read
 * from the same texture — avoids evaluating the upstream chain twice. Same
 * pattern as `chromatic-aberration-node.ts`.
 *
 * Chain position (set by `atmospheric-webgpu-pass.tsx`): after bloom-add,
 * before colorGrade/vignette/chromAb/ACES. Matches WebGL ordering where
 * TiltShift sits early in the post stack (before grade).
 */

import { vec2, vec4, uv, abs, mix, smoothstep, float, convertToTexture } from 'three/tsl';
import { gaussianBlur } from 'three/examples/jsm/tsl/display/GaussianBlurNode.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Soft falloff width on either side of the focus band (matches WebGL `feather`). */
const FEATHER = 0.3;
/** Gaussian sigma. kernelSize = 3 + 2*sigma = 11 taps each pass. */
const SIGMA = 4;
/** Half-res blur — keeps perf under the 3ms budget without visible aliasing. */
const RESOLUTION_SCALE = 0.5;

/**
 * Result handle returned by `tiltShiftNode`. The host must call `dispose()`
 * on chain teardown — `GaussianBlurNode` owns two internal `RenderTarget`s
 * that `PostProcessing.dispose()` does NOT walk (it only frees its own quad
 * material). Without an explicit call here, each chain rebuild / HMR cycle
 * leaks two GPU textures.
 */
export interface TiltShiftNodeResult {
  /** Composed chain output (mix of sharp + Gaussian-blurred input). */
  output: any;
  /** Frees the two internal blur render targets. */
  dispose: () => void;
}

/**
 * @param input     Color node (chain output to soft-band).
 * @param strengthU `uniform(float)` handle — preset `tiltShift.strength` (0..1).
 *                  `0` = all sharp (also the disabled-state value).
 */
export function tiltShiftNode(input: any, strengthU: any): TiltShiftNodeResult {
  const tex = (convertToTexture as any)(input);
  const sharp = tex.sample(uv());
  // Pass the already-materialized `tex` (an RTTNode, which extends TextureNode).
  // `gaussianBlur`'s internal `convertToTexture` short-circuits for nodes that
  // are already textures (`RTTNode.js:284`), so sharp + blurred share one
  // upstream materialization rather than triggering a second RT for the same
  // input chain.
  const blurNode = (gaussianBlur as any)(tex, vec2(1, 1), SIGMA, {
    resolutionScale: RESOLUTION_SCALE,
  });

  const focusBandHalfWidth = float(0.5).sub(strengthU.mul(0.5));
  const bandDist = abs(uv().y.sub(0.5)).sub(focusBandHalfWidth);
  const mask = smoothstep(float(0), float(FEATHER), bandDist);

  return {
    output: vec4(mix(sharp, blurNode, mask)),
    dispose: () => blurNode.dispose?.(),
  };
}
