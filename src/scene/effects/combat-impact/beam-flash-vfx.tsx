/**
 * BeamFlashVfx — self-contained ranged beam between two points. A thin cylinder
 * is stretched from `from` to `to`, flashed over a very short lifetime, then
 * unmounted via onComplete. Distinct from ImpactBillboardVfx because it orients
 * a stretched cylinder along a segment rather than billboarding a flat quad —
 * so it shares only the lifecycle hook, not the mesh wrapper.
 *
 * Orientation: the cylinder's default axis is +Y, so we lookAt the target then
 * rotateX(π/2) to align Y along the beam, scale Y to the segment length, and
 * place the mesh at the segment midpoint.
 */

import { useEffect, useMemo } from 'react';
import { Vector3 } from 'three';
import { useImpactLifecycle } from './use-impact-lifecycle';
import { createBeamMaterial } from './presets/beam-flash-material';

const DURATION_S = 0.2;

export interface BeamFlashVfxProps {
  /** World-space beam origin (attacker) [x, y, z]. */
  from: [number, number, number];
  /** World-space beam end (target) [x, y, z]. */
  to: [number, number, number];
  /** Beam color hex. Default cyan-white. */
  color?: string;
  /** Windup delay (seconds) before the beam appears. Default 0. */
  delayS?: number;
  /** Fired once after the beam lifetime; parent unmounts the component. */
  onComplete: () => void;
}

export function BeamFlashVfx({
  from,
  to,
  color = '#aaffff',
  delayS = 0,
  onComplete,
}: BeamFlashVfxProps) {
  // Segment geometry — stable per mount.
  const { midpoint, distance, target } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    return {
      midpoint: a.clone().add(b).multiplyScalar(0.5),
      distance: a.distanceTo(b),
      target: b,
    };
  }, [from, to]);

  const { meshRef, handle } = useImpactLifecycle({
    build: (gl) => createBeamMaterial(gl, { color }),
    durationS: DURATION_S,
    delayS,
    onComplete,
  });

  // Orient + stretch the cylinder once the mesh exists.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.lookAt(target);
    mesh.rotateX(Math.PI / 2); // align default +Y axis along the beam
    mesh.scale.set(1, distance, 1);
  }, [meshRef, handle, target, distance]);

  if (!handle) return null;

  return (
    <mesh
      ref={meshRef}
      position={[midpoint.x, midpoint.y, midpoint.z]}
      renderOrder={10}
      visible={delayS <= 0}
    >
      <cylinderGeometry args={[0.04, 0.04, 1.0, 6]} />
      <primitive object={handle.material} attach="material" />
    </mesh>
  );
}
