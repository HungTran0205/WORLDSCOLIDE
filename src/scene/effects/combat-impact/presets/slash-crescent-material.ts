/**
 * SlashCrescentMaterial — the generic melee slash (default attack). A centered
 * billboard renders a procedural ink crescent (fBm-noised edges) with an
 * additive glow core, sweeping outward and fading over a short lifetime.
 *
 * This is the fallback impact for every melee archetype that lacks a bespoke
 * silhouette (dualblade, engineer, enemies, unknown) — see impact-registry.
 *
 * WebGPU-only: MeshBasicNodeMaterial compiles to WGSL via the node system; a
 * raw GLSL ShaderMaterial would be invisible on WebGPURenderer, so the public
 * factory returns null on a WebGL fallback. Per-instance material so uProgress
 * animates independently (a shared, pipeline-cache-deduped material would
 * freeze on one binding). BASIC lighting → ~1 sampler, under the iGPU ceiling.
 */

import { configureImpactMaterial, hexToVec3 } from '../impact-shader-utils';
import type { ImpactMaterialHandle, PlanarImpactParams } from '../impact-material-types';

// ─── WebGPU path (TSL NodeMaterial) ──────────────────────────────────────────

let _nodeFactory: ((p: PlanarImpactParams) => ImpactMaterialHandle) | null = null;

async function getNodeFactory() {
  if (_nodeFactory) return _nodeFactory;

  const { MeshBasicNodeMaterial } = await import('three/webgpu');
  const { uniform, uv, vec3, float, atan2, smoothstep, mix, mx_fractal_noise_float } =
    await import('three/tsl');

  _nodeFactory = (p: PlanarImpactParams) => {
    const material = new MeshBasicNodeMaterial();
    configureImpactMaterial(material);

    const uProgress = uniform(0);
    const uColor = uniform(hexToVec3(p.color));
    const uGlowColor = uniform(hexToVec3(p.glowColor));
    const uAngle = uniform(p.angle);

    // Polar coords centered on the quad. atan2 (NOT atan — single-arg in r182)
    // gives the full -π..π angle. Seam is at ±π; uAngle stays within ±π/4 so the
    // crescent never straddles it.
    const centered = uv().sub(0.5);
    const r = centered.length();
    const theta = atan2(centered.y, centered.x);

    // Angular sector the blade sweeps, centered on uAngle. Soft edges taper the
    // crescent to points at its tips (~±0.8 rad span).
    const angDist = theta.sub(uAngle).abs();
    const arcSpan = smoothstep(float(0.95), float(0.12), angDist);

    // Thin crescent band at a radius that expands outward over the lifetime, so
    // the slash reads as a blade sweeping THROUGH the target rather than a disc.
    const targetR = float(0.16).add(uProgress.mul(0.26)); // 0.16 → 0.42
    const band = float(1).sub(smoothstep(float(0), float(0.09), r.sub(targetR).abs()));

    // fBm ink texture broken up along the arc for a hand-inked edge.
    const ink = mx_fractal_noise_float(vec3(uv().mul(5.0), uProgress), 2).mul(0.5).add(0.5);

    // Quick lifetime fade — bright on impact, gone by the tail.
    const fade = float(1).sub(smoothstep(float(0.45), float(1), uProgress));

    // Hot glow along the crescent core; amber ink toward the tapering tips.
    material.colorNode = mix(uColor, uGlowColor, band.mul(0.8));
    material.opacityNode = arcSpan.mul(band).mul(ink).mul(fade);

    return {
      material,
      setProgress: (t: number) => {
        (uProgress as unknown as { value: number }).value = t;
      },
      dispose: () => material.dispose(),
    };
  };

  return _nodeFactory;
}

// ─── Public factory ──────────────────────────────────────────────────────────

/** WebGPU → TSL NodeMaterial; WebGL → null (no melee VFX on the WebGL fallback). */
export async function createSlashCrescentMaterial(
  renderer: unknown,
  params: PlanarImpactParams,
): Promise<ImpactMaterialHandle | null> {
  // WebGL renderers expose `isWebGLRenderer`; WebGPURenderer does not.
  if (!renderer || 'isWebGLRenderer' in (renderer as object)) return null;
  const factory = await getNodeFactory();
  return factory(params);
}
