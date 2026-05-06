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
import { useCombatProjectionStore } from './combat-projection-store';
import type { ScreenPos } from './combat-projection-store';
import { getCombatSpriteScale } from './combat-camera-config';

const PUBLISH_INTERVAL_MS = 33; // ~30Hz
const tmpVec = new Vector3();

export function CombatProjectionPublisher() {
  const { camera, size } = useThree();
  const setPositions = useCombatProjectionStore((s) => s.setPositions);
  const lastPublishRef = useRef(0);
  // DEBUG: log camera state on first frame of each combat session
  const loggedRef = useRef(false);

  useFrame(() => {
    if (!loggedRef.current) {
      loggedRef.current = true;
      const cam = camera as unknown as {
        type: string;
        isOrthographicCamera?: boolean;
        zoom: number;
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
        near: number;
        far: number;
        uuid: string;
      };
      console.log('[combat-cam] mount frame', {
        uuid: cam.uuid,
        type: cam.type,
        isOrtho: !!cam.isOrthographicCamera,
        pos: camera.position.toArray(),
        rot: camera.rotation.toArray(),
        up: camera.up.toArray(),
        zoom: cam.zoom,
        frustum: { left: cam.left, right: cam.right, top: cam.top, bottom: cam.bottom },
        near: cam.near,
        far: cam.far,
        viewport: { w: size.width, h: size.height },
      });
    }

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
      // Anchor HP bar above the sprite head. Sprite uses
      // getCombatSpriteScale(z) for lane foreshortening — apply same factor
      // here so HP bars track the visually-scaled head, not the un-scaled
      // base height.
      const liveScale = getCombatSpriteScale(e.position.z, !!e.isBoss);
      const headY = liveScale * 1.05;
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
