/**
 * SlashArcMaterial — generic curved streak; pooled, dual-path.
 *
 * Polar-coord arc in a UV quad: an angular band at a radius that expands
 * outward over progress. Design parity with slash-crescent-material (which
 * is WebGPU-only) so non-Pierce skills can adopt cue sheets later without
 * requiring the WebGPU backend.
 *
 * `axisAngle` sets the arc sweep centre in radians (default 0 = 3 o'clock).
 * Both WebGPU (TSL) and WebGL (GLSL) paths render.
 */

import * as THREE from 'three';
import { configureImpactMaterial, hexToVec3 } from '../../combat-impact/impact-shader-utils';
import { MESH_FX_VERTEX, configureMeshFxGlslMaterial } from '../mesh-fx-shader-utils';
import type { MeshFxHandle, MeshFxParams } from '../mesh-fx-types';

// ─── WebGPU (TSL) path ────────────────────────────────────────────────────────

let _tslFactory: ((p: MeshFxParams) => MeshFxHandle) | null = null;

async function getTslFactory() {
  if (_tslFactory) return _tslFactory;

  const { MeshBasicNodeMaterial } = await import('three/webgpu');
  const { uniform, uv, float, atan2, smoothstep, mix } = await import('three/tsl');

  _tslFactory = (p: MeshFxParams) => {
    const material = new MeshBasicNodeMaterial();
    configureImpactMaterial(material);

    const uProgress  = uniform(0);
    const uColor     = uniform(hexToVec3(p.color));
    const uGlowColor = uniform(hexToVec3(p.glowColor));
    const uAngle     = uniform(p.axisAngle ?? 0);

    const centered = uv().sub(0.5);
    const r        = centered.length();
    const theta    = atan2(centered.y, centered.x);

    // Angular span of the arc; soft tapering to points at the tips.
    const angDist = theta.sub(uAngle).abs();
    const arcSpan = smoothstep(float(0.9), float(0.15), angDist);

    // Thin band that expands outward as the arc sweeps.
    const targetR = float(0.15).add(uProgress.mul(0.28));
    const band    = float(1).sub(smoothstep(float(0), float(0.1), r.sub(targetR).abs()));

    const fade = float(1).sub(smoothstep(float(0.4), float(1), uProgress));

    material.colorNode   = mix(uColor, uGlowColor, band.mul(0.7));
    material.opacityNode = arcSpan.mul(band).mul(fade).mul(float(1.4));

    return {
      material,
      setProgress: (t) => { (uProgress as unknown as { value: number }).value = t; },
      setColor:    (hex) => { (uColor.value as THREE.Vector3).copy(hexToVec3(hex)); },
      dispose:     () => material.dispose(),
    };
  };

  return _tslFactory;
}

// ─── WebGL (GLSL ShaderMaterial) path ────────────────────────────────────────

const ARC_FRAG = /* glsl */ `
uniform float uProgress;
uniform vec3  uColor;
uniform vec3  uGlowColor;
uniform float uAngle;
varying vec2  vUv;

void main() {
  vec2  c       = vUv - 0.5;
  float r       = length(c);
  // atan(y, x) — two-argument form gives full -PI..PI range.
  float theta   = atan(c.y, c.x);
  float angDist = abs(theta - uAngle);
  float arcSpan = smoothstep(0.9, 0.15, angDist);

  float targetR = 0.15 + uProgress * 0.28;
  float band    = 1.0 - smoothstep(0.0, 0.1, abs(r - targetR));
  float fade    = 1.0 - smoothstep(0.4, 1.0, uProgress);
  // Brightness boost compensates for no WebGL bloom.
  vec3 col = mix(uColor, uGlowColor, band * 0.7) * (1.0 + band * 0.6);
  gl_FragColor = vec4(col, arcSpan * band * fade * 1.4);
}
`;

function createGlslHandle(p: MeshFxParams): MeshFxHandle {
  const material = new THREE.ShaderMaterial({
    vertexShader: MESH_FX_VERTEX,
    fragmentShader: ARC_FRAG,
    uniforms: {
      uProgress:  { value: 0 },
      uColor:     { value: hexToVec3(p.color) },
      uGlowColor: { value: hexToVec3(p.glowColor) },
      uAngle:     { value: p.axisAngle ?? 0 },
    },
  });
  configureMeshFxGlslMaterial(material);

  return {
    material,
    setProgress: (t) => { material.uniforms.uProgress.value = t; },
    setColor:    (hex) => { (material.uniforms.uColor.value as THREE.Vector3).copy(hexToVec3(hex)); },
    dispose:     () => material.dispose(),
  };
}

// ─── Public factory ───────────────────────────────────────────────────────────

/** WebGPU → TSL MeshBasicNodeMaterial; WebGL → THREE.ShaderMaterial. Never null. */
export async function createSlashArcMaterial(
  renderer: unknown,
  params: MeshFxParams,
): Promise<MeshFxHandle> {
  const isWebGPU = !!renderer && !('isWebGLRenderer' in (renderer as object));
  if (isWebGPU) {
    const factory = await getTslFactory();
    return factory(params);
  }
  return createGlslHandle(params);
}
