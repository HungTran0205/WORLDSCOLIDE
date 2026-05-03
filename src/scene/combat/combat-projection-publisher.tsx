/**
 * In-canvas component that projects each combat entity's world position to
 * viewport-pixel coords and publishes them to `combat-projection-store`.
 * The DOM HUD layer (HP bars, damage popups) reads from that store to
 * absolute-position itself over the canvas.
 *
 * Throttled to ~30Hz to keep React re-renders cheap; the canvas itself still
 * renders every frame.
 */

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameStore } from '@/game/state/store';
import { LANE_Y_FACTOR } from '@/game/systems/combat-arena-types';
import { useCombatProjectionStore } from './combat-projection-store';
import type { ScreenPos } from './combat-projection-store';

const PUBLISH_INTERVAL_MS = 33; // ~30Hz
const tmpVec = new Vector3();

export function CombatProjectionPublisher() {
  const { camera, size } = useThree();
  const setPositions = useCombatProjectionStore((s) => s.setPositions);
  const lastPublishRef = useRef(0);

  useFrame(() => {
    const now = performance.now();
    if (now - lastPublishRef.current < PUBLISH_INTERVAL_MS) return;
    lastPublishRef.current = now;

    const entities = useGameStore.getState().arenaEntities;
    if (entities.length === 0) {
      const current = useCombatProjectionStore.getState().positions;
      if (current.size > 0) setPositions(new Map());
      return;
    }

    const next = new Map<string, ScreenPos>();
    const halfW = size.width / 2;
    const halfH = size.height / 2;
    for (const e of entities) {
      // Anchor HP bar above the sprite head (y ≈ scale × 1.1).
      // Apply the same lane Y projection as the sprite so the bar tracks
      // each lane's vertical offset.
      const headY = (e.isBoss ? 3.2 : 2.4) * 1.05 - e.position.z * LANE_Y_FACTOR;
      tmpVec.set(e.position.x, headY, e.position.z);
      tmpVec.project(camera);
      // NDC → pixels (viewport is the canvas, which spans the full window)
      const px = tmpVec.x * halfW + halfW;
      const py = -tmpVec.y * halfH + halfH;
      next.set(e.id, { x: px, y: py, visible: tmpVec.z >= -1 && tmpVec.z <= 1 });
    }
    setPositions(next);
  });

  return null;
}
