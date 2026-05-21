/**
 * R3F hook: measures a prop <group>'s world-space XZ bounding box once mounted
 * and registers it as a guild-hall collision footprint. Keeps the Three.js
 * dependency out of the pure math in guild-hall-collision.ts.
 */

import { useEffect } from 'react';
import type { RefObject } from 'react';
import * as THREE from 'three';
import type { Group } from 'three';
import { registerObstacle, unregisterObstacle } from './guild-hall-collision';

/**
 * @param id  Stable obstacle id (e.g. 'throne', 'pillar-n').
 * @param ref Ref to the prop's outer <group>.
 */
export function useRegisterObstacle(id: string, ref: RefObject<Group | null>): void {
  useEffect(() => {
    const group = ref.current;
    if (!group) return;
    // GLB primitive children mount synchronously (useGLTF suspends), but their
    // world matrices aren't guaranteed current until a render — force-update
    // before measuring, otherwise setFromObject reads stale/zero transforms.
    group.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(group);
    registerObstacle(id, {
      minX: box.min.x,
      maxX: box.max.x,
      minZ: box.min.z,
      maxZ: box.max.z,
    });
    return () => unregisterObstacle(id);
  }, [id, ref]);
}
