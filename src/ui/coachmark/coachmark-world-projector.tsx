/**
 * In-Canvas component that projects a world-space coachmark target to viewport
 * pixel coords and writes them to coachmark-target-store each frame.
 *
 * Must be mounted INSIDE the R3F <Canvas> tree to access useThree/useFrame.
 * Mirrors the projection math from combat-projection-publisher.tsx exactly.
 *
 * Throttled to ~30–60Hz via performance.now ref to avoid React re-render churn
 * (writes to zustand store, not component state).
 */

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useCoachmarkTargetStore } from './coachmark-target-store';

// ~30Hz throttle — matches combat publisher cadence
const PUBLISH_INTERVAL_MS = 33;

/** Reusable Vector3 to avoid per-frame allocation */
const tmpVec = new Vector3();

/**
 * Mount once inside the Canvas (e.g. in WorldSceneContent).
 * Cheap no-op when worldTarget is null — safe to always keep mounted.
 */
export function CoachmarkWorldProjector() {
  const { camera, size } = useThree();
  const setScreen = useCoachmarkTargetStore((s) => s.setScreen);
  const lastPublishRef = useRef(0);

  useFrame(() => {
    // Read worldTarget directly from store state (no subscription overhead)
    const worldTarget = useCoachmarkTargetStore.getState().worldTarget;

    if (!worldTarget) {
      // Clear screen coords when no world target is active
      const current = useCoachmarkTargetStore.getState().screen;
      if (current !== null) setScreen(null);
      return;
    }

    const now = performance.now();
    if (now - lastPublishRef.current < PUBLISH_INTERVAL_MS) return;
    lastPublishRef.current = now;

    const halfW = size.width / 2;
    const halfH = size.height / 2;

    // Project world position → NDC → CSS pixels
    // Mirrors combat-projection-publisher.tsx: tmpVec.project(camera) → NDC → px
    tmpVec.set(worldTarget[0], worldTarget[1], worldTarget[2]);
    tmpVec.project(camera);

    const px = tmpVec.x * halfW + halfW;
    const py = -tmpVec.y * halfH + halfH;

    // visible = false when point is behind the camera (NDC z > 1)
    const visible = tmpVec.z >= -1 && tmpVec.z <= 1;

    // Skip store write if unchanged to avoid triggering DOM re-renders
    const current = useCoachmarkTargetStore.getState().screen;
    if (
      current &&
      Math.abs(current.x - px) < 0.5 &&
      Math.abs(current.y - py) < 0.5 &&
      current.visible === visible
    ) {
      return;
    }

    setScreen({ x: px, y: py, visible });
  });

  return null;
}
