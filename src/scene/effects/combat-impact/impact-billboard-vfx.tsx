/**
 * ImpactBillboardVfx — one generic component for every camera-facing planar
 * impact (slash-crescent / sword-thrust / axe-chop, and any future planar
 * silhouette). It owns NO visual identity itself: the silhouette comes entirely
 * from the `buildMaterial` factory passed in by impact-registry, and the
 * lifecycle (build, windup, progress, onComplete) comes from useImpactLifecycle.
 *
 * Adding a new planar attack type therefore needs only a material factory + a
 * registry entry — no new component. The billboard faces the camera each frame
 * so the flat silhouette always reads head-on.
 */

import { useRef } from 'react';
import { useImpactLifecycle } from './use-impact-lifecycle';
import type { ImpactMaterialHandle, PlanarImpactParams } from './impact-material-types';

export interface ImpactBillboardVfxProps {
  /** World-space center of the impact [x, y, z]. */
  position: [number, number, number];
  /** Per-instance material factory (WebGPU → handle, WebGL → null). */
  buildMaterial: (
    renderer: unknown,
    params: PlanarImpactParams,
  ) => Promise<ImpactMaterialHandle | null>;
  /** Plane geometry size [w, h] — tuned per silhouette (wide for thrust, tall for axe). */
  size: [number, number];
  /** Visible lifetime in seconds. */
  durationS: number;
  /** Ink/edge color hex. */
  color: string;
  /** Additive glow-core color hex. */
  glowColor: string;
  /** Base silhouette orientation in radians (per-shader meaning). */
  baseAngle?: number;
  /** Random angle jitter span added per mount for variety (0 = none). */
  jitterAngle?: number;
  /** Windup delay (seconds) before the impact appears. Default 0. */
  delayS?: number;
  /** Fired once after the lifetime; parent unmounts the component. */
  onComplete: () => void;
}

export function ImpactBillboardVfx({
  position,
  buildMaterial,
  size,
  durationS,
  color,
  glowColor,
  baseAngle = 0,
  jitterAngle = 0,
  delayS = 0,
  onComplete,
}: ImpactBillboardVfxProps) {
  // Orientation chosen once per mount; jitter keeps repeated slashes from
  // looking identical while deliberate types (thrust) pass jitterAngle 0.
  const angleRef = useRef(baseAngle + (jitterAngle ? (Math.random() - 0.5) * jitterAngle : 0));

  const { meshRef, handle } = useImpactLifecycle({
    build: (gl) => buildMaterial(gl, { color, glowColor, angle: angleRef.current }),
    durationS,
    delayS,
    onComplete,
    // Billboard toward the camera so the flat silhouette always faces the viewer.
    onFrame: ({ mesh, camera }) => mesh.quaternion.copy(camera.quaternion),
  });

  if (!handle) return null;

  return (
    <mesh ref={meshRef} position={position} renderOrder={10} visible={delayS <= 0}>
      <planeGeometry args={size} />
      <primitive object={handle.material} attach="material" />
    </mesh>
  );
}
