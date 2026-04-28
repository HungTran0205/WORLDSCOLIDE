/**
 * Pure factory for building a horizontal arc slash MeshLine instance.
 * Shape + material tuned in the VFX playground (ml-slash-horizontal preset).
 * Shared by the pool — each slot holds one MeshLine built here.
 */

import { MeshLine } from 'makio-meshline';
import { AdditiveBlending, Color } from 'three/webgpu';

export interface SlashArcConfig {
  segments: number;
  radius: number;
  arcAngle: number;
}

const DEFAULT_ARC: SlashArcConfig = {
  segments: 46,
  radius: 0.9,
  arcAngle: 2.55,
};

/** Generate arc point list in XY plane, centered on origin. */
export function buildArcPoints(cfg: SlashArcConfig = DEFAULT_ARC): Float32Array {
  const { segments, radius, arcAngle } = cfg;
  const arr = new Float32Array(segments * 3);
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const a = -arcAngle / 2 + t * arcAngle;
    arr[i * 3 + 0] = Math.cos(a) * radius;
    arr[i * 3 + 1] = Math.sin(a) * radius;
    arr[i * 3 + 2] = 0;
  }
  return arr;
}

/** Build a single slash MeshLine with tested playground preset. */
export function createSlashMeshline(): MeshLine {
  const ml = new MeshLine();
  ml.configure({
    lines: buildArcPoints(),
    color: new Color('#ffffff'),
    gradientColor: new Color('#f7ff8a'),
    lineWidth: 13,
    // Start at 1.0 so peak luminance passes the bloom threshold (0.80).
    // Runtime fade handled by combat-slash-pool.
    opacity: 1.0,
    transparent: true,
    sizeAttenuation: false,
  });
  // Additive blending for that bloom-friendly glow + skip depth test so the
  // slash always draws on top of sprites/HP bars (VFX convention).
  const mat = ml.material as unknown as {
    blending: number;
    transparent: boolean;
    depthWrite: boolean;
    depthTest: boolean;
  };
  mat.blending = AdditiveBlending;
  mat.transparent = true;
  mat.depthWrite = false;
  mat.depthTest = false;
  // Render after opaque sprites so additive color lands on their pixels.
  ml.renderOrder = 999;
  // Disable frustum culling — MeshLine's bounding sphere depends on lazy build
  // and can be wrong on fresh instances, hiding the slash entirely.
  ml.frustumCulled = false;
  return ml;
}
