/**
 * CombatCameraShake — applies decaying-oscillator shake offsets to the
 * orthographic combat camera each frame via pushCameraImpulse() from the
 * camera-impulse-store.
 *
 * Design invariants:
 *  - Base position recomputed from constants every frame (never reads the
 *    live, possibly-mutated camera.position) — drift is impossible even across
 *    impulse overlap and force-reset cycles.
 *  - No per-frame allocation: scratch object is module-level, reused in-place.
 *  - Skipped (camera reset to base) under 'low' quality or prefers-reduced-motion.
 *  - Shake uses wall-clock performance.now() — independent of speedMultiplier.
 */

import { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import {
  COMBAT_CAM_HEIGHT,
  COMBAT_CAM_DIST,
} from '../combat-camera-config';
import { getStoredGraphicsQuality } from '@/game/state/guild-slice';
import { sampleOffset, clearImpulses } from './camera-impulse-store';

/** One-time check at component module load — SSR-safe, won't change mid-session. */
const _reducedMotion =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

/** Module-level scratch — reused every useFrame tick, no per-frame allocation. */
const _scratch = { x: 0, y: 0, zoom: 0 };

export function CombatCameraShake() {
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    // Clear stale impulses from any previous combat session on mount/unmount
    // so a prior-fight shake can't bleed into the next open cycle.
    return () => { clearImpulses(); };
  }, []);

  useFrame(() => {
    if (getStoredGraphicsQuality() === 'low' || _reducedMotion) {
      // Snap to exact base — clears any residual offset if quality dropped mid-shake
      camera.position.set(0, COMBAT_CAM_HEIGHT, COMBAT_CAM_DIST);
      return;
    }

    sampleOffset(performance.now(), _scratch);

    // Base recomputed from constants each frame — never reads camera.position,
    // so no drift accumulates across impulses or open/close force-resets.
    camera.position.set(
      _scratch.x,
      COMBAT_CAM_HEIGHT + _scratch.y,
      COMBAT_CAM_DIST,
    );
    // No updateProjectionMatrix() needed: position changes don't affect the
    // ortho frustum. Zoom-punch omitted for POC (zoom ≥ ~63 constraint, see config).
  });

  return null;
}
