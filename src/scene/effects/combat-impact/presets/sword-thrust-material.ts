/**
 * SwordThrustMaterial — the Templar (`sword`) stab. Unlike the sweeping
 * crescent, this is a bright horizontal lance: a tapered streak that extends
 * forward (+x) to a sharp leading point over its life, tilted slightly upward
 * by `angle`. Reads as a deliberate thrust THROUGH the target rather than an
 * arc across it.
 *
 * WebGPU-only (same rationale as slash-crescent-material): the node material
 * compiles to WGSL; the factory returns null on a WebGL fallback. Per-instance
 * material so uProgress animates independently.
 */

import { configureImpactMaterial, hexToVec3 } from '../impact-shader-utils';
import type { ImpactMaterialHandle, PlanarImpactParams } from '../impact-material-types';

let _nodeFactory: ((p: PlanarImpactParams) => ImpactMaterialHandle) | null = null;

async function getNodeFactory() {
  if (_nodeFactory) return _nodeFactory;

  const { MeshBasicNodeMaterial } = await import('three/webgpu');
  const { uniform, uv, float, sin, cos, smoothstep, mix } = await import('three/tsl');

  _nodeFactory = (p: PlanarImpactParams) => {
    const material = new MeshBasicNodeMaterial();
    configureImpactMaterial(material);

    const uProgress = uniform(0);
    const uColor = uniform(hexToVec3(p.color));
    const uGlowColor = uniform(hexToVec3(p.glowColor));
    const uAngle = uniform(p.angle);

    // Rotate the quad's centered UV by uAngle so the whole lance tilts up.
    const centered = uv().sub(0.5); // -0.5..0.5
    const ca = cos(uAngle);
    const sa = sin(uAngle);
    const ax = centered.x.mul(ca).add(centered.y.mul(sa)); // along the lance
    const ay = centered.y.mul(ca).sub(centered.x.mul(sa)); // across the lance

    // Leading tip shoots forward over the first ~70% of life, then holds. The
    // tail trails a fixed length behind, so the lance grows then dwells.
    const adv = smoothstep(float(0), float(0.7), uProgress); // 0→1
    const tip = float(-0.18).add(adv.mul(0.6)); // -0.18 → 0.42
    const tail = tip.sub(0.5); // fixed lance length

    // Longitudinal mask: a sharp nose at the tip, a soft trailing edge at the tail.
    const nose = smoothstep(tip, tip.sub(float(0.05)), ax); // 1 behind tip, 0 ahead
    const trail = smoothstep(tail.sub(float(0.14)), tail, ax); // 0 before tail, 1 after
    const along = nose.mul(trail);

    // Thickness tapers to a point at the tip (pos 0=tail → 1=tip).
    const pos = ax.sub(tail).div(tip.sub(tail)).clamp(0, 1);
    const halfH = mix(float(0.13), float(0.012), pos);
    const across = float(1).sub(smoothstep(float(0), halfH, ay.abs()));

    // Hot glow down the centerline; amber ink toward the edges.
    const core = float(1).sub(smoothstep(float(0), halfH.mul(0.5), ay.abs()));

    // Quick fade with a hot flash on contact.
    const fade = float(1).sub(smoothstep(float(0.5), float(1), uProgress));
    const flash = float(1).add(uProgress.oneMinus().mul(1.6));

    material.colorNode = mix(uColor, uGlowColor, core).mul(flash);
    material.opacityNode = along.mul(across).mul(fade);

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

/** WebGPU → TSL NodeMaterial; WebGL → null (no melee VFX on the WebGL fallback). */
export async function createSwordThrustMaterial(
  renderer: unknown,
  params: PlanarImpactParams,
): Promise<ImpactMaterialHandle | null> {
  if (!renderer || 'isWebGLRenderer' in (renderer as object)) return null;
  const factory = await getNodeFactory();
  return factory(params);
}
