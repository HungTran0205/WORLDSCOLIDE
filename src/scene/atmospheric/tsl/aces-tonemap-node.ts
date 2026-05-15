/**
 * ACES Filmic tonemap TSL node — chain tail, parameter-free.
 *
 * Closed-form Narkowicz fitted curve (the rational polynomial that game
 * engines treat as "good-enough ACES"):
 *   x = color * 0.6                       // pmndrs/three.js pre-exposure scale
 *   a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14
 *   out = clamp( (x*(a*x + b)) / (x*(c*x + d) + e), 0, 1 )
 *
 * Reference: https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
 * three.js core (`src/renderers/shaders/ShaderChunk/tonemapping_pars_fragment.glsl.js`)
 * uses the heavier RRT+ODT matrix form; for our HD-2D pass the Narkowicz
 * approximation tracks within visual tolerance and stays under 30 LOC of TSL.
 *
 * MUST be the LAST node in the WebGPU chain — compresses HDR→LDR, so any
 * further effect would operate on tonemapped pixels and look wrong.
 */

import { vec3, vec4, clamp } from 'three/tsl';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Wrap a color node with the Narkowicz ACES Filmic tonemap.
 *
 * @param input Color node (the current chain output).
 */
export function acesTonemapNode(input: any): any {
  const x = input.rgb.mul(0.6);
  const num = x.mul(x.mul(2.51).add(0.03));
  const denom = x.mul(x.mul(2.43).add(0.59)).add(0.14);
  return vec4(clamp(num.div(denom), vec3(0), vec3(1)), input.a);
}
