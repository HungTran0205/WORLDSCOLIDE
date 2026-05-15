/**
 * Leva-driven combat camera tweakables — zoom + tilt + foreshortening factor.
 * Mounts inside CombatScene; reads the active default camera (which is the
 * combat ortho cam during combat-open) and applies live values each frame.
 *
 * This gives the user a sandbox to dial in how panel <-> world unit ratio
 * feels without code reloads. Defaults match COMBAT_CAM_ZOOM / TILT_DEG so
 * leaving the panel alone preserves current behavior.
 *
 * Note: foreshortening factor here is read-only — sprite component reads from
 * COMBAT_SPRITE_FORESHORTEN_PER_Z directly. Live tuning sprite scale would
 * require pushing this value through context, which is out of current scope.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import type { OrthographicCamera } from 'three';
import {
  COMBAT_CAM_DIST,
  COMBAT_CAM_ELEV_MULT,
  COMBAT_CAM_TARGET,
  COMBAT_CAM_TILT_RAD,
  COMBAT_CAM_ZOOM,
} from './combat-camera-config';

export function CombatCameraDebug() {
  const camera = useThree(s => s.camera);

  const { zoom, targetY, posY } = useControls('Combat / Camera', {
    zoom:    { value: COMBAT_CAM_ZOOM, min: 10, max: 120, step: 1 },
    // Camera lookAt Y — positive shifts the look-at point up, which moves
    // the ground (y=0) DOWN in the viewport. Use this to push the
    // battlefield toward the bottom of the panel (so foreground ground is
    // visible under the sprites instead of dominating mid-panel).
    targetY: { value: COMBAT_CAM_TARGET[1], min: -3, max: 6, step: 0.1, label: 'lookAt Y' },
    // Camera elevation tweak — higher = more top-down. Multiplies the
    // tilt-derived base height. Default = baked COMBAT_CAM_ELEV_MULT.
    posY:    { value: COMBAT_CAM_ELEV_MULT, min: 0.4, max: 3.0, step: 0.05, label: 'elev mult' },
  }, { collapsed: true });

  // Apply per frame — the world.tsx layoutEffect resets these on combat
  // open, so we re-apply continuously to keep Leva live.
  useFrame(() => {
    const cam = camera as OrthographicCamera;
    if (!cam.isOrthographicCamera) return;

    if (cam.zoom !== zoom) {
      // eslint-disable-next-line react-hooks/immutability
      cam.zoom = zoom;
      cam.updateProjectionMatrix();
    }

    // Tilt-derived base height (no elevation mult) × leva mult. Baked
    // baseline corresponds to mult = COMBAT_CAM_ELEV_MULT.
    const baseH = COMBAT_CAM_DIST * Math.tan(COMBAT_CAM_TILT_RAD);
    const desiredY = baseH * posY;
    if (Math.abs(cam.position.y - desiredY) > 0.001) {
      // eslint-disable-next-line react-hooks/immutability
      cam.position.y = desiredY;
    }

    // lookAt(0, targetY, 0) — pushes ground (y=0) below view center when
    // targetY > 0. updateMatrix automatically by lookAt.
    cam.lookAt(0, targetY, 0);
  });

  return null;
}
