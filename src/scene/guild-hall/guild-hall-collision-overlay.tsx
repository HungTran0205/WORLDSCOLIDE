/**
 * Dev-only collision footprint overlay for the guild hall.
 *
 * Draws a flat red plane on the floor for each registered obstacle, sized to
 * the radius-padded footprint, so over/under-sized footprints are obvious when
 * tuning. Mount gated on DEBUG_MODE by the caller (see guild-hall.tsx).
 */

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { getObstacles, DEFAULT_MEMBER_RADIUS } from './guild-hall-collision';
import type { RectObstacle } from './guild-hall-collision';

/** Compact signature so re-registers with a changed box (HMR tuning) repaint,
 *  not just count changes. */
function obstacleSignature(obstacles: { id: string; rect: RectObstacle }[]): string {
  return obstacles
    .map(({ id, rect }) => `${id}:${rect.minX},${rect.maxX},${rect.minZ},${rect.maxZ}`)
    .join('|');
}

export function GuildHallCollisionOverlay() {
  // Obstacles register in prop useEffects after first render, so poll the
  // (non-reactive) registry each frame and re-render when its content changes.
  const [obstacles, setObstacles] = useState(() => getObstacles());
  const sigRef = useRef(obstacleSignature(obstacles));

  useFrame(() => {
    const current = getObstacles();
    const sig = obstacleSignature(current);
    if (sig !== sigRef.current) {
      sigRef.current = sig;
      setObstacles(current);
    }
  });

  return (
    <group>
      {obstacles.map(({ id, rect }) => {
        const width = rect.maxX - rect.minX + DEFAULT_MEMBER_RADIUS * 2;
        const depth = rect.maxZ - rect.minZ + DEFAULT_MEMBER_RADIUS * 2;
        const cx = (rect.minX + rect.maxX) / 2;
        const cz = (rect.minZ + rect.maxZ) / 2;
        return (
          <mesh key={id} position={[cx, 0.05, cz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={999}>
            <planeGeometry args={[width, depth]} />
            <meshBasicMaterial
              color="#00e5ff"
              transparent
              opacity={0.5}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
