/**
 * Shared shader helpers for the mesh-fx primitive library.
 *
 * Re-exports hexToVec3 + configureImpactMaterial from the combat-impact family
 * (DRY — same blend state, same color conversion). Adds GLSL snippets and a
 * ShaderMaterial blend configurator for the WebGL (non-TSL) paths.
 *
 * Every preset material file imports from here rather than from impact-shader-utils
 * directly, keeping the mesh-fx package self-contained.
 */

import * as THREE from 'three';

export { hexToVec3, configureImpactMaterial } from '../combat-impact/impact-shader-utils';

// ─── Common vertex shader for all mesh-fx quads ───────────────────────────────

/** Standard pass-through vertex shader for flat billboard quads. */
export const MESH_FX_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ─── GLSL utility snippets (inlined by presets into their fragment shaders) ───

/**
 * Single-octave 2-D value noise. Returns float in [0, 1].
 * Hash is a classic sin-domain trick — cheap but adequate for dissolve gates.
 */
export const GLSL_NOISE_FN = /* glsl */ `
float meshFxNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i,             vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1,0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0,1), vec2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1,1), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
`;

/**
 * Radial-UV rim proxy.
 *
 * On a billboarded flat quad there are no surface normals for real Fresnel.
 * We use distance from UV centre (length of centeredUv) as the "rim" proxy:
 * bright at the edge, dark at the centre. Pass `vUv - 0.5` as the argument.
 */
export const GLSL_RADIAL_RIM = /* glsl */ `
float radialRim(vec2 centeredUv) {
  return smoothstep(0.0, 0.5, length(centeredUv));
}
`;

// ─── Material blend setup for the GLSL (WebGL) path ─────────────────────────

/**
 * Apply the standard additive / no-depth-write / no-depth-test blend state to
 * a plain THREE.ShaderMaterial — mirrors configureImpactMaterial for the
 * WebGL path where we can't use the TSL node material.
 */
export function configureMeshFxGlslMaterial(m: THREE.ShaderMaterial): void {
  m.transparent = true;
  m.depthWrite = false;
  m.depthTest = false;
  m.blending = THREE.AdditiveBlending;
  m.side = THREE.DoubleSide;
}
