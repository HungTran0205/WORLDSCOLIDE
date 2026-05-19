/**
 * Pixelation TSL node — snap UV into a granularity-pixel grid, sample once
 * per cell. Matches pmndrs `PixelationEffect`:
 *
 *   vec2 res = resolution / granularity;
 *   vec2 snapped = floor(uv * res) / res;
 *   color = texture(input, snapped);
 *
 * `granularity = 1` collapses to identity (no-op). Higher = chunkier.
 *
 * `convertToTexture(input)` materialises the upstream graph into a render
 * target so `.sample(snapped)` works — same pattern as chromatic-aberration.
 *
 * Caveat: this pixelates EVERYTHING in the input chain (3D meshes, sprites,
 * text). Sprite layers are already pixel art, so applying this naively
 * double-pixelates them. Layer-split (separate pass for 3D vs sprite) is the
 * proper fix; this node intentionally stays scene-agnostic so the host pass
 * can decide which subtree to feed it.
 */

import { vec4, floor, screenSize, screenUV, convertToTexture } from 'three/tsl';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @param input         Color node (chain output to pixelate).
 * @param granularityU  `uniform(float)` — cell size in screen pixels.
 *                      1 = no-op, 4 = chunky, 8+ = retro heavy.
 */
export function pixelationNode(input: any, granularityU: any): any {
  const tex = (convertToTexture as any)(input);
  const res = (screenSize as any).div(granularityU);
  const snapped = floor((screenUV as any).mul(res)).div(res);
  return vec4(tex.sample(snapped).rgb, 1.0);
}
