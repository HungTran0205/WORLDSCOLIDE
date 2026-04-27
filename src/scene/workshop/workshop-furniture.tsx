import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RoomProp } from '../facility/room-prop';

useGLTF.preload('/models/furnitures/workbench.glb');
useGLTF.preload('/models/furnitures/alchemy-table.glb');
useGLTF.preload('/tiles/t_Obsidian_Isometric.glb');

const ROOM_SIZE = 7;

function WorkshopFloor({ cx, cz }: { cx: number; cz: number }) {
  const { scene } = useGLTF('/tiles/t_Obsidian_Isometric.glb');

  // Clone one tile per grid cell to cover the 7×7 floor
  const tiles = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const tileW = size.x || 1;
    const tileD = size.z || 1;
    // Sink tile so its TOP surface sits at y=0 (sprites walk at y=0)
    const groundY = -box.max.y;

    const cols = Math.ceil(ROOM_SIZE / tileW);
    const rows = Math.ceil(ROOM_SIZE / tileD);
    const startX = -(cols * tileW) / 2 + tileW / 2;
    const startZ = -(rows * tileD) / 2 + tileD / 2;

    const result: { x: number; z: number; model: THREE.Object3D }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const clone = scene.clone(true);
        clone.position.y = groundY;
        result.push({ x: startX + c * tileW, z: startZ + r * tileD, model: clone });
      }
    }
    return result;
  }, [scene]);

  return (
    <group position={[cx, 0.01, cz]}>
      {tiles.map(({ x, z, model }, i) => (
        <group key={i} position={[x, 0, z]}>
          <primitive object={model} />
        </group>
      ))}
    </group>
  );
}

export function WorkshopFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      <WorkshopFloor cx={cx} cz={cz} />
      <RoomProp path="/models/furnitures/workbench.glb" position={[cx + 2.2, 0, cz - 2.6]} targetHeight={1.0} rotY={-0.2} />
       <RoomProp path="/models/furnitures/Hammer_on_a_Wooden_Bl.glb" position={[cx + 0.8, 0, cz - 0.5]} targetHeight={1.0} rotY={-0.2} />
      <RoomProp path="/models/furnitures/bamboopanel.glb" position={[cx - 1, 0, cz - 2]} targetHeight={3.0} rotY={0} />
      <RoomProp path="/models/furnitures/Red_Woodworking_Workbench.glb" position={[cx - 2.7, 0, cz + 0.5]} targetHeight={1.7} rotY={1.5} />
      <RoomProp path="/models/furnitures/red_workbend_2.glb" position={[cx - 1, 0, cz + 3]} targetHeight={1.2} rotY={3.15} />
      <RoomProp path="/models/furnitures/Cozy_Brick_Fireplace.glb" position={[cx - 0.5, 0, cz - 2.55]} targetHeight={3.0} rotY={0} />
    </group>
  );
}
