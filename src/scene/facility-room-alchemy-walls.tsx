/**
 * GLB wall models for the Alchemy Lab room.
 * wall1.glb → back wall (facing room interior, +Z direction)
 * wall2.glb → left wall (rotated PI/2 around Y to face room interior, +X direction)
 *
 * Both models are scaled non-uniformly to cover the 7×3 wall surface.
 * The wall decoration overlay (facility-room-alchemy-wall-decor.tsx) is
 * rendered on top of these surfaces and remains unchanged.
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const BACK_WALL_GLB = '/GuildHall/LinhSon/alchemy/wall2.glb';
const LEFT_WALL_GLB = '/GuildHall/LinhSon/alchemy/wall1.glb';
useGLTF.preload(BACK_WALL_GLB);
useGLTF.preload(LEFT_WALL_GLB);

const ROOM_SIZE = 7;
const WALL_HEIGHT = 3;

function AlchemyBackWall({ cx, cz }: { cx: number; cz: number }) {
  const { scene } = useGLTF(BACK_WALL_GLB);
  const oz = cz - ROOM_SIZE / 2;

  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const sx = size.x > 0 ? ROOM_SIZE / size.x : 1;
    const sy = size.y > 0 ? WALL_HEIGHT / size.y : 1;
    clone.scale.set(sx, sy, 1);
    // Lift so the model's bottom sits at y=0 in group-local space
    clone.position.y = -box.min.y * sy;
    return clone;
  }, [scene]);

  return (
    <group position={[cx, 0, oz]} rotation={[0, Math.PI, 0]}>
      <primitive object={model} />
    </group>
  );
}

function AlchemyLeftWall({ cx, cz }: { cx: number; cz: number }) {
  const { scene } = useGLTF(LEFT_WALL_GLB);
  const ox = cx - ROOM_SIZE / 2;

  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    // After rotY = PI/2: model local-X maps to world-Z (room depth), so scale X to ROOM_SIZE
    const sx = size.x > 0 ? ROOM_SIZE / size.x : 1;
    const sy = size.y > 0 ? WALL_HEIGHT / size.y : 1;
    clone.scale.set(sx, sy, 1);
    clone.position.y = -box.min.y * sy;
    return clone;
  }, [scene]);

  return (
    <group position={[ox, 0, cz]} rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={model} />
    </group>
  );
}

/** GLB wall models for the alchemy lab's back wall and left wall. */
export function AlchemyWalls({ cx, cz }: { cx: number; cz: number }) {
  return (
    <>
      <AlchemyBackWall cx={cx} cz={cz} />
      <AlchemyLeftWall cx={cx} cz={cz} />
    </>
  );
}
