/**
 * ImpactStarMaterial — radial 6-spike burst on hit; pooled, dual-path.
 *
 * Uses atan2/theta to modulate max radius per angle, creating 6 spike tips
 * that scale in immediately and contract+fade over progress.
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
  const { uniform, uv, float, sin, atan2, smoothstep, mix } = await import('three/tsl');

  _tslFactory = (p: MeshFxParams) => {
    const material = new MeshBasicNodeMaterial();
    configureImpactMaterial(material);

    const uProgress  = uniform(0);
    const uColor     = uniform(hexToVec3(p.color));
    const uGlowColor = uniform(hexToVec3(p.glowColor));

    const centered = uv().sub(0.5);
    const r        = centered.length();
    const theta    = atan2(centered.y, centered.x);

    // 6 spikes via sin(theta * 6): 0 = valley, 1 = spike tip.
    const spike  = float(0.5).add(sin(theta.mul(6)).mul(0.5));
    // Spikes shrink and contract as progress advances (burst then fade).
    const scale  = float(1).sub(uProgress.mul(0.6));
    const maxR   = scale.mul(float(0.4)).mul(spike.add(float(0.1)));
    // Solid fill below maxR, sharp falloff above.
    const mask   = float(1).sub(smoothstep(maxR.sub(float(0.04)), maxR, r));

    const fade   = float(1).sub(smoothstep(float(0.3), float(1), uProgress));
    // Hot flash at impact — bright white on first frame.
    const flash  = float(2).mul(float(1).sub(uProgress)).add(float(1));

    material.colorNode   = mix(uColor, uGlowColor, mask).mul(flash);
    material.opacityNode = mask.mul(fade);

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

const STAR_FRAG = /* glsl */ `
uniform float uProgress;
uniform vec3  uColor;
uniform vec3  uGlowColor;
varying vec2  vUv;

void main() {
  vec2  c     = vUv - 0.5;
  float r     = length(c);
  float theta = atan(c.y, c.x);

  float spike = 0.5 + sin(theta * 6.0) * 0.5;
  float scale = 1.0 - uProgress * 0.6;
  float maxR  = scale * 0.4 * (spike + 0.1);
  float mask  = 1.0 - smoothstep(maxR - 0.04, maxR, r);

  float fade  = 1.0 - smoothstep(0.3, 1.0, uProgress);
  // Flash + extra core boost for no-bloom WebGL path.
  float flash = 2.0 * (1.0 - uProgress) + 1.0;
  vec3 col = mix(uColor, uGlowColor, mask) * flash * (1.0 + mask * 0.5);
  gl_FragColor = vec4(col, mask * fade);
}
`;

function createGlslHandle(p: MeshFxParams): MeshFxHandle {
  const material = new THREE.ShaderMaterial({
    vertexShader: MESH_FX_VERTEX,
    fragmentShader: STAR_FRAG,
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
export async function createImpactStarMaterial(
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
