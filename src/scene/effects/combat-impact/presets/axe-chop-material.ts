/**
 * AxeChopMaterial — the Warrior (`warrior`) overhead cleave. A bright vertical
 * column whose leading tip drops from the top of the quad to its base over the
 * first half of life, then blooms an impact flare at the base — reading as an
 * axe falling THROUGH the target from above. `angle` nudges the cleave line
 * laterally for a touch of variety.
 *
 * WebGPU-only (same rationale as slash-crescent-material): returns null on a
 * WebGL fallback. Per-instance material so uProgress animates independently.
 */

import { configureImpactMaterial, hexToVec3 } from '../impact-shader-utils';
import type { ImpactMaterialHandle, PlanarImpactParams } from '../impact-material-types';

let _nodeFactory: ((p: PlanarImpactParams) => ImpactMaterialHandle) | null = null;

async function getNodeFactory() {
  if (_nodeFactory) return _nodeFactory;

  const { MeshBasicNodeMaterial } = await import('three/webgpu');
  const { uniform, uv, float, vec2, smoothstep, mix, length } = await import('three/tsl');

  _nodeFactory = (p: PlanarImpactParams) => {
    const material = new MeshBasicNodeMaterial();
    configureImpactMaterial(material);

    const uProgress = uniform(0);
    const uColor = uniform(hexToVec3(p.color));
    const uGlowColor = uniform(hexToVec3(p.glowColor));
    const uAngle = uniform(p.angle);

    const x = uv().x.sub(0.5); // -0.5..0.5 (lateral)
    const y = uv().y; // 0 = base (impact) → 1 = top
    const offset = uAngle.mul(0.35); // small lateral shift of the cleave line

    // Leading tip descends from near the top (0.6) to the base (0.0) in the
    // first half of life; the streak fills from the tip up to the top edge.
    const drop = smoothstep(float(0), float(0.5), uProgress).clamp(0, 1);
    const tipY = mix(float(0.6), float(0.0), drop);
    const lower = smoothstep(tipY.sub(float(0.06)), tipY, y); // 0 below tip, 1 above
    const upper = smoothstep(float(1.0), float(0.86), y); // fade near the top edge
    const vert = lower.mul(upper);

    // Thin vertical band (the cleave line), centered on the lateral offset.
    const band = float(1).sub(smoothstep(float(0), float(0.06), x.sub(offset).abs()));
    const column = vert.mul(band);

    // Impact flare blooms at the base once the blade lands (second half), then fades.
    const bloom = smoothstep(float(0.4), float(0.95), uProgress).clamp(0, 1);
    const flareR = mix(float(0.05), float(0.4), bloom);
    const dist = length(vec2(x.sub(offset), y.sub(float(0.08))));
    const flare = float(1).sub(smoothstep(float(0), flareR, dist));
    const flareMask = flare.mul(bloom.oneMinus());

    // Shape = brighter of the column or the flare; core (centerline + flare
    // hot-spot) reads as the hot glow color.
    const shape = column.max(flareMask);
    const core = column.mul(0.7).add(flareMask).clamp(0, 1);
    const life = float(1).sub(smoothstep(float(0.75), float(1), uProgress));

    material.colorNode = mix(uColor, uGlowColor, core);
    material.opacityNode = shape.mul(life);

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
export async function createAxeChopMaterial(
  renderer: unknown,
  params: PlanarImpactParams,
): Promise<ImpactMaterialHandle | null> {
  if (!renderer || 'isWebGLRenderer' in (renderer as object)) return null;
  const factory = await getNodeFactory();
  return factory(params);
}
