/**
 * BeamFlashMaterial — the ranged bolt (scout / scholar / philosopher). A thin
 * cylinder stretched from attacker to target renders a bright energy core with
 * tapered tips, flashing hot then dimming over a very short lifetime.
 *
 * WebGPU-only (same rationale as slash-crescent-material): returns null on a
 * WebGL fallback. Per-instance material so uProgress animates independently.
 */

import { configureImpactMaterial, hexToVec3 } from '../impact-shader-utils';
import type { ImpactMaterialHandle, BeamImpactParams } from '../impact-material-types';

let _nodeFactory: ((p: BeamImpactParams) => ImpactMaterialHandle) | null = null;

async function getNodeFactory() {
  if (_nodeFactory) return _nodeFactory;

  const { MeshBasicNodeMaterial } = await import('three/webgpu');
  const { uniform, uv, float, smoothstep } = await import('three/tsl');

  _nodeFactory = (p: BeamImpactParams) => {
    const material = new MeshBasicNodeMaterial();
    configureImpactMaterial(material);

    const uProgress = uniform(0);
    const uColor = uniform(hexToVec3(p.color));

    // uv().y runs 0→1 along the cylinder length (attacker → target). Bright
    // across the whole span with soft tapered ends, so it reads as a continuous
    // beam rather than a blob floating at the midpoint.
    const y = uv().y;
    const body = smoothstep(float(0), float(0.05), y).mul(smoothstep(float(1), float(0.95), y));
    // Lifetime fade and an initial hot flash (bright → dim).
    const fade = float(1).sub(smoothstep(float(0.3), float(1), uProgress));
    const flash = float(1).add(uProgress.oneMinus().mul(2.0));

    material.colorNode = uColor.mul(flash);
    material.opacityNode = body.mul(fade);

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

/** WebGPU → TSL NodeMaterial; WebGL → null (no ranged VFX on the WebGL fallback). */
export async function createBeamMaterial(
  renderer: unknown,
  params: BeamImpactParams,
): Promise<ImpactMaterialHandle | null> {
  if (!renderer || 'isWebGLRenderer' in (renderer as object)) return null;
  const factory = await getNodeFactory();
  return factory(params);
}
