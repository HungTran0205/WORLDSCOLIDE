/**
 * ThrustLanceMaterial — bright additive lance; pooled, dual-path.
 *
 * White-hot core + colored rim, stretches forward along +x over lifetime,
 * noise-dissolves out at the tail as progress advances.
 *
 * Unlike sword-thrust-material (WebGPU-only) this DOES render on WebGL.
 * TSL path: MeshBasicNodeMaterial (WebGPU).
 * GLSL path: THREE.ShaderMaterial (WebGL) — compensates for no bloom with
 * a brighter core ramp (+0.8× boost on core).
 *
 * Radial-UV "rim" note: billboard quad has no surface normals → we use
 * distance from UV centre as a Fresnel proxy (bright edge, dark centre).
 */

import * as THREE from 'three';
import { configureImpactMaterial, hexToVec3 } from '../../combat-impact/impact-shader-utils';
import {
  MESH_FX_VERTEX,
  GLSL_NOISE_FN,
  configureMeshFxGlslMaterial,
} from '../mesh-fx-shader-utils';
import type { MeshFxHandle, MeshFxParams } from '../mesh-fx-types';

// ─── WebGPU (TSL) path ────────────────────────────────────────────────────────

let _tslFactory: ((p: MeshFxParams, lowQuality?: boolean) => MeshFxHandle) | null = null;

async function getTslFactory() {
  if (_tslFactory) return _tslFactory;

  const { MeshBasicNodeMaterial } = await import('three/webgpu');
  const { uniform, uv, float, sin, cos, smoothstep, mix, mx_fractal_noise_float, vec3 } =
    await import('three/tsl');

  _tslFactory = (p: MeshFxParams, lowQuality = false) => {
    const material = new MeshBasicNodeMaterial();
    configureImpactMaterial(material);

    const uProgress = uniform(0);
    const uColor    = uniform(hexToVec3(p.color));
    const uGlowColor = uniform(hexToVec3(p.glowColor));
    const uAngle    = uniform(p.axisAngle ?? 0);

    // Rotate centered UV by uAngle so lance tilts.
    const centered = uv().sub(0.5);
    const ca = cos(uAngle);
    const sa = sin(uAngle);
    const ax = centered.x.mul(ca).add(centered.y.mul(sa)); // along lance
    const ay = centered.y.mul(ca).sub(centered.x.mul(sa)); // across lance

    // Leading tip shoots forward over first 70% of life, then holds.
    const adv = smoothstep(float(0), float(0.7), uProgress);
    const tip  = float(-0.18).add(adv.mul(0.6));   // -0.18 → 0.42
    const tail = tip.sub(0.5);                      // fixed lance length

    const nose      = smoothstep(tip, tip.sub(float(0.05)), ax);
    const trailMask = smoothstep(tail.sub(float(0.14)), tail, ax);
    const along     = nose.mul(trailMask);

    // Thickness tapers to a point at the tip.
    const pos   = ax.sub(tail).div(tip.sub(tail)).clamp(0, 1);
    const halfH = mix(float(0.13), float(0.012), pos);
    const across = float(1).sub(smoothstep(float(0), halfH, ay.abs()));
    const core   = float(1).sub(smoothstep(float(0), halfH.mul(0.5), ay.abs()));

    const fade  = float(1).sub(smoothstep(float(0.5), float(1), uProgress));
    const flash = float(1).add(uProgress.oneMinus().mul(1.6));

    material.colorNode = mix(uColor, uGlowColor, core).mul(flash);
    // Noise dissolve eats the lance tail as progress advances. Skipped on 'low'
    // quality — the fractal-noise eval is the lance's only per-fragment cost.
    let opacity = along.mul(across).mul(fade);
    if (!lowQuality) {
      const noise    = mx_fractal_noise_float(vec3(uv().mul(6.0), uProgress), 2).mul(0.5).add(0.5);
      const dissolve = smoothstep(uProgress.sub(0.35), uProgress, noise);
      opacity = opacity.mul(dissolve);
    }
    material.opacityNode = opacity;

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

/**
 * Build the lance fragment shader. On 'low' quality the dissolve-noise term
 * (and its noise helper) are omitted entirely so the eval is compiled out.
 */
function buildLanceFrag(lowQuality: boolean): string {
  const dissolveDecl = lowQuality
    ? ''
    : `  // Noise dissolve — WebGL has no bloom; core boost (+0.8) compensates.
  float n        = meshFxNoise(vUv * 6.0 + uProgress * 2.0);
  float dissolve = smoothstep(uProgress - 0.35, uProgress + 0.001, n);`;
  const alphaExpr = lowQuality
    ? 'along * across * fade'
    : 'along * across * fade * dissolve';

  return /* glsl */ `
${lowQuality ? '' : GLSL_NOISE_FN}
uniform float uProgress;
uniform vec3  uColor;
uniform vec3  uGlowColor;
uniform float uAngle;
varying vec2  vUv;

void main() {
  vec2  c  = vUv - 0.5;
  float ca = cos(uAngle), sa = sin(uAngle);
  float ax = c.x * ca + c.y * sa;
  float ay = c.y * ca - c.x * sa;

  float adv      = smoothstep(0.0, 0.7, uProgress);
  float tip      = -0.18 + adv * 0.6;
  float tail     = tip - 0.5;
  float nose     = smoothstep(tip, tip - 0.05, ax);
  float trailMsk = smoothstep(tail - 0.14, tail, ax);
  float along    = nose * trailMsk;

  float denom = max(tip - tail, 0.001);
  float pos   = clamp((ax - tail) / denom, 0.0, 1.0);
  float halfH = mix(0.13, 0.012, pos);
  float across = 1.0 - smoothstep(0.0, halfH, abs(ay));
  float core   = 1.0 - smoothstep(0.0, halfH * 0.5, abs(ay));

  float fade  = 1.0 - smoothstep(0.5, 1.0, uProgress);
  float flash = 1.0 + (1.0 - uProgress) * 1.6;
${dissolveDecl}
  vec3 col = mix(uColor, uGlowColor, core) * flash * (1.0 + core * 0.8);
  gl_FragColor = vec4(col, ${alphaExpr});
}
`;
}

function createGlslHandle(p: MeshFxParams, lowQuality = false): MeshFxHandle {
  const material = new THREE.ShaderMaterial({
    vertexShader: MESH_FX_VERTEX,
    fragmentShader: buildLanceFrag(lowQuality),
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

/**
 * WebGPU → TSL MeshBasicNodeMaterial; WebGL → THREE.ShaderMaterial. Never null.
 * `lowQuality` drops the dissolve-noise eval (the lance's only per-fragment cost).
 */
export async function createThrustLanceMaterial(
  renderer: unknown,
  params: MeshFxParams,
  lowQuality = false,
): Promise<MeshFxHandle> {
  const isWebGPU = !!renderer && !('isWebGLRenderer' in (renderer as object));
  if (isWebGPU) {
    const factory = await getTslFactory();
    return factory(params, lowQuality);
  }
  return createGlslHandle(params, lowQuality);
}
