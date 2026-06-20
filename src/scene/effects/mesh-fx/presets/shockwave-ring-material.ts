/**
 * ShockwaveRingMaterial — expanding ring that fades as it grows.
 *
 * Shader computes r = length(vUv - 0.5); a soft band sits at
 * ringRadius = progress * 0.45, expanding outward and becoming more
 * transparent over life. Two instances stacked with a phase offset
 * read as "radiating shockwave rings" (Phase 07 distortion layer uses
 * this mesh as its base).
 *
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
  const { uniform, uv, float, smoothstep, mix } = await import('three/tsl');

  _tslFactory = (p: MeshFxParams) => {
    const material = new MeshBasicNodeMaterial();
    configureImpactMaterial(material);

    const uProgress  = uniform(0);
    const uColor     = uniform(hexToVec3(p.color));
    const uGlowColor = uniform(hexToVec3(p.glowColor));

    const centered    = uv().sub(0.5);
    const r           = centered.length();
    const ringRadius  = uProgress.mul(0.45);
    const ringWidth   = float(0.07);
    const dist        = r.sub(ringRadius).abs();
    const band        = float(1).sub(smoothstep(float(0), ringWidth, dist));
    const fade        = float(1).sub(uProgress);

    // Glow brightest at peak ring (band=1), blends to rim color at edges.
    material.colorNode   = mix(uColor, uGlowColor, band.mul(0.7)).mul(float(1.5));
    material.opacityNode = band.mul(fade);

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

const RING_FRAG = /* glsl */ `
uniform float uProgress;
uniform vec3  uColor;
uniform vec3  uGlowColor;
varying vec2  vUv;

void main() {
  vec2  c          = vUv - 0.5;
  float r          = length(c);
  float ringRadius = uProgress * 0.45;
  float ringWidth  = 0.07;
  float band       = 1.0 - smoothstep(0.0, ringWidth, abs(r - ringRadius));
  float fade       = 1.0 - uProgress;
  // +1.5× and extra glow boost compensate for no WebGL bloom.
  vec3 col = mix(uColor, uGlowColor, band * 0.7) * 1.5 * (1.0 + band * 0.5);
  gl_FragColor = vec4(col, band * fade);
}
`;

function createGlslHandle(p: MeshFxParams): MeshFxHandle {
  const material = new THREE.ShaderMaterial({
    vertexShader: MESH_FX_VERTEX,
    fragmentShader: RING_FRAG,
    uniforms: {
      uProgress:  { value: 0 },
      uColor:     { value: hexToVec3(p.color) },
      uGlowColor: { value: hexToVec3(p.glowColor) },
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
export async function createShockwaveRingMaterial(
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
