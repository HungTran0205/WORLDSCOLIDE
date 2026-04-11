/**
 * Furniture GLB props for each facility room type.
 * Stone quarry + logging-site are handled in their own decor files.
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { FacilityType } from '@/game/state/game-state';

// Preload all furniture models used in facility rooms
useGLTF.preload('/models/furnitures/bar-counter.glb');
useGLTF.preload('/models/furnitures/wine-barrel.glb');
useGLTF.preload('/models/furnitures/training-dummy.glb');
useGLTF.preload('/models/furnitures/alchemy-table.glb');
useGLTF.preload('/models/furnitures/medical-bed.glb');
useGLTF.preload('/models/furnitures/workbench.glb');

/** Scaled GLB prop placed at world-space position inside a room */
function RoomProp({ path, position, targetHeight, rotY = 0 }: {
  path: string;
  position: [number, number, number];
  targetHeight: number;
  rotY?: number;
}) {
  const { scene } = useGLTF(path);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const h = box.getSize(new THREE.Vector3()).y;
    const s = h > 0 ? targetHeight / h : 1;
    clone.scale.setScalar(s);
    clone.position.y = -box.min.y * s;
    return clone;
  }, [scene, targetHeight]);

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <primitive object={model} />
    </group>
  );
}

function TavernFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      {/* Bar counter — centered along back wall */}
      <RoomProp path="/models/furnitures/bar-counter.glb" position={[cx, 0, cz - 2.6]} targetHeight={0.9} rotY={0} />
      {/* Wine barrels — back corners */}
      <RoomProp path="/models/furnitures/wine-barrel.glb" position={[cx - 2.2, 0, cz - 2.4]} targetHeight={0.75} rotY={0.4} />
      <RoomProp path="/models/furnitures/wine-barrel.glb" position={[cx + 2.2, 0, cz - 2.4]} targetHeight={0.75} rotY={-0.3} />
    </group>
  );
}

function TrainingYardFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      {/* Training dummy — center-back, member slot 0 faces it */}
      <RoomProp path="/models/furnitures/training-dummy.glb" position={[cx, 0, cz - 1.8]} targetHeight={1.6} rotY={Math.PI} />
    </group>
  );
}

function InfirmaryFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      {/* Two medical beds along side walls */}
      <RoomProp path="/models/furnitures/medical-bed.glb" position={[cx - 2.0, 0, cz - 0.5]} targetHeight={0.7} rotY={Math.PI / 2} />
      <RoomProp path="/models/furnitures/medical-bed.glb" position={[cx + 2.0, 0, cz - 0.5]} targetHeight={0.7} rotY={-Math.PI / 2} />
      {/* Alchemy table — back wall center for treatments */}
      <RoomProp path="/models/furnitures/alchemy-table.glb" position={[cx, 0, cz - 2.6]} targetHeight={1.0} rotY={0} />
    </group>
  );
}

function WorkshopFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      {/* Workbench — back wall center */}
      <RoomProp path="/models/furnitures/workbench.glb" position={[cx, 0, cz - 2.6]} targetHeight={1.0} rotY={0} />
      {/* Alchemy table — side wall for materials */}
      <RoomProp path="/models/furnitures/alchemy-table.glb" position={[cx - 2.2, 0, cz - 1.0]} targetHeight={1.0} rotY={Math.PI / 2} />
    </group>
  );
}

interface FacilityRoomFurnitureProps {
  type: FacilityType;
  cx: number;
  cz: number;
}

/** Dispatches to the per-facility furniture layout */
export function FacilityRoomFurniture({ type, cx, cz }: FacilityRoomFurnitureProps) {
  switch (type) {
    case 'tavern':        return <TavernFurniture cx={cx} cz={cz} />;
    case 'training-yard': return <TrainingYardFurniture cx={cx} cz={cz} />;
    case 'infirmary':     return <InfirmaryFurniture cx={cx} cz={cz} />;
    case 'workshop':      return <WorkshopFurniture cx={cx} cz={cz} />;
    default:              return null;
  }
}
