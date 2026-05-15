/**
 * Vignette TSL node — radial darkening that matches pmndrs's
 * `VignetteEffect` (DEFAULT technique). Ported so the WebGPU pass produces
 * identical output to the WebGL `<Vignette offset={...} darkness={...} />`.
 *
 * pmndrs DEFAULT-technique GLSL (verbatim from `postprocessing` build):
 *   float d = distance(uv, vec2(0.5));
 *   color *= smoothstep(0.8, offset * 0.799, d * (darkness + offset));
 *
 * `smoothstep(edge0=0.8, edge1=offset*0.799, x)` reverses (edge0 > edge1),
 * returning 1 at the center and 0 toward the corners — so multiplying it
 * into `color` darkens the screen edges as `darkness` rises.
 *
 * Static imports of `three/tsl` are intentional: callers reach this module
 * via `await import('./vignette-node')` inside the WebGPU pass, so the
 * three/tsl dependency stays in the WebGPU-only chunk.
 */

import { vec2, vec4, distance, smoothstep, float, uv } from 'three/tsl';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Wrap a color node with the pmndrs vignette formula.
 *
 * @param input    Color node (e.g. the current chain output).
 * @param offsetU  `uniform(float)` handle for `offset` (start of darkening).
 * @param darknessU `uniform(float)` handle for `darkness` (corner depth).
 */
export function vignetteNode(input: any, offsetU: any, darknessU: any): any {
  const screenUv = uv();
  const d = distance(screenUv, vec2(0.5));
  const factor = smoothstep(float(0.8), offsetU.mul(0.799), d.mul(darknessU.add(offsetU)));
  return vec4(input.rgb.mul(factor), input.a);
}
