/**
 * Furniture GLB props for each facility room type.
 * Stone quarry + logging-site are handled in their own decor files.
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { FacilityType } from '@/game/state/game-state';
import { AlchemyWallDecor } from './facility-room-alchemy-wall-decor';
import { TorchFireVfx } from './torch-fire-vfx';
import { TorchFireEffect as TorchFireEffectLegacy } from './torch-fire-particles';
import { CandleFireEffect } from './candle-fire-effect';
import { SteamVentEffect } from './steam-vent-effect';
import { useGraphicsQuality } from './world';

// Preload all furniture models used in facility rooms
useGLTF.preload('/models/furnitures/bar-counter.glb');
useGLTF.preload('/models/furnitures/wine-barrel.glb');
useGLTF.preload('/models/furnitures/training-dummy.glb');
useGLTF.preload('/models/furnitures/alchemy-table.glb');
useGLTF.preload('/models/furnitures/alchemy_reactor.glb');
useGLTF.preload('/models/furnitures/alchemy_shelf.glb');
useGLTF.preload('/models/furnitures/alchemy_silo.glb');
useGLTF.preload('/models/furnitures/alchemy_workbend.glb');
useGLTF.preload('/tiles/t_ancient-manuscript.glb');
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

/** Single rock tile scaled to fit tileSize × tileSize footprint */
function FloorTile({ position, tileSize }: {
  position: [number, number, number];
  tileSize: number;
}) {
  const { scene } = useGLTF('/tiles/t_Obsidian_Isometric.glb');
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const sx = tileSize / (size.x || 1);
    const sz = tileSize / (size.z || 1);
    const sy = 0.12 / (size.y || 1);
    clone.scale.set(sx, sy, sz);
    clone.position.y = -box.min.y * sy;
    return clone;
  }, [scene, tileSize]);

  return (
    <group position={position}>
      <primitive object={model} />
    </group>
  );
}

/** 3×3 grid of rock tiles covering the 7×7 alchemy room floor */
function AlchemyFloor({ cx, cz }: { cx: number; cz: number }) {
  const TILE_SIZE = 7 / 3;
  const positions = useMemo<[number, number, number][]>(() => {
    const result: [number, number, number][] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        result.push([
          cx - 3.5 + TILE_SIZE * 0.5 + col * TILE_SIZE,
          0,
          cz - 3.5 + TILE_SIZE * 0.5 + row * TILE_SIZE,
        ]);
      }
    }
    return result;
  }, [cx, cz]);

  return (
    <>
      {positions.map((pos, i) => (
        <FloorTile key={i} position={pos} tileSize={TILE_SIZE} />
      ))}
    </>
  );
}

function AlchemyLabFurniture({ cx, cz }: { cx: number; cz: number }) {
  const quality = useGraphicsQuality();
  const FireVfx = quality === 'high' ? TorchFireVfx : TorchFireEffectLegacy;

  return (
    <group>
      <AlchemyFloor cx={cx} cz={cz} />
      {/* Cave wall decor: copper pipes on back and left walls */}
      <AlchemyWallDecor cx={cx} cz={cz} />

      {/* Reactor — hero prop, center-back */}
      <RoomProp path="/models/furnitures/alchemy_reactor.glb" position={[cx, 0, cz - 0.2]} targetHeight={3.1} rotY={0} />
      {/* Steam vent on the right-side pipe nozzle at reactor top */}
      <SteamVentEffect position={[cx + 1.5, 3.3, cz - 0.1]} scale={1.5} />
      {/* Shelf — back wall left, potion display */}
      <RoomProp path="/models/furnitures/alchemy_shelf.glb" position={[cx - 2.7, 0, cz - 2.5]} targetHeight={2.7} rotY={Math.PI / 2} />
      {/* Silo — left side wall */}
      <RoomProp path="/models/furnitures/alchemy_silo.glb" position={[cx - 2.8, 0, cz + 1.2]} targetHeight={2.4} rotY={Math.PI / 0.4} />
      {/* Workbench — left front corner */}
      <RoomProp path="/models/furnitures/alchemy_workbend.glb" position={[cx - 1, 0, cz + 3]} targetHeight={1.5} rotY={Math.PI / -1} />
      {/* Soft glow from potion bottles on workbench surface */}
      <pointLight position={[cx - 1, 1.1, cz + 3]} color="#66ffcc" intensity={1.4} distance={1.8} decay={2} />
      {/* Ambient accent props */}
      <RoomProp path="/models/furnitures/p_vibrant_han_2.glb" position={[cx - 2.6, 0, cz + 3.0]} targetHeight={0.9} rotY={1.5} />
      <RoomProp path="/models/furnitures/alchemists-curio-cab.glb" position={[cx + 2, -0.1, cz - 3]} targetHeight={1.5} rotY={0} />

      {/* Oil lamp — wall-mounted, right side back; fire sits atop the lamp head */}
      <group position={[cx + 2.4, 0.5, cz - 2.8]}>
        <RoomProp path="/models/furnitures/oil-lamp.glb" position={[0, 0, 0]} targetHeight={0.4} rotY={0} />
        <FireVfx offsetY={0.42} scale={0.35} debugLabel="Alchemy OilLamp" />
        <pointLight position={[0, 0.55, 0]} color="#ff9944" intensity={4} distance={5} decay={2} />
      </group>

      {/* Candlelit tome tower — right front corner; 3 calm candle flames */}
      <group position={[cx + 3, 0, cz + 2.0]}>
        <RoomProp path="/models/furnitures/candlelit-tome-tower.glb" position={[0, 0, 0]} targetHeight={1.2} rotY={1.5} />
        {/* Tall center candle */}
        <CandleFireEffect offsetY={1.25} scale={0.9} />
        {/* Short left candle */}
        <group position={[-0.12, 0.2, 0.06]}>
          <CandleFireEffect offsetY={0.82} scale={0.9} />
        </group>
        {/* Short right candle */}
        <group position={[0.14, 0.4, -0.06]}>
          <CandleFireEffect offsetY={0.78} scale={0.9} />
        </group>
        <pointLight position={[0, 1.1, 0]} color="#ffbb55" intensity={2} distance={1} decay={2} />
      </group>

      {/* Teal glow for ether cracks baked into back wall */}
      <pointLight position={[cx - 1.2, 1.6, cz - 3.2]} color="#00ddcc" intensity={1.8} distance={3.5} decay={2} />
      <pointLight position={[cx + 1.8, 0.9, cz - 3.2]} color="#00ddcc" intensity={1.4} distance={3.0} decay={2} />
      {/* Teal glow for ether cracks on left wall — two lights covering upper and lower crack areas */}
      <pointLight position={[cx - 3.2, 1.5, cz + 0.5]} color="#00ddcc" intensity={2.5} distance={3.5} decay={2} />
      <pointLight position={[cx - 3.2, 0.8, cz + 2.0]} color="#00ddcc" intensity={1.8} distance={3.0} decay={2} />

      {/* Purple crystal cluster (p_vibrant_han_2) — violet glow illuminates front-left corner */}
      <pointLight position={[cx - 2.6, 0.6, cz + 3.0]} color="#bb66ff" intensity={5.2} distance={4.0} decay={2} />

      {/* Potion shelf — boosted green-tinted glow so bottles are clearly lit */}
      <pointLight position={[cx - 3, 1.9, cz - 2.5]} color="#88ffaa" intensity={1.8} distance={3.0} decay={2} />

      {/* Ceiling fill lights — cover the 7×7 room floor without bleeding globally */}
      <pointLight position={[cx, 4.5, cz]} color="#45e293" intensity={8} distance={9} decay={2} />
      <pointLight position={[cx - 2, 4.0, cz + 2]} color="#1ec268" intensity={5} distance={6} decay={2} />
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
    case 'tavern': return <TavernFurniture cx={cx} cz={cz} />;
    case 'training-yard': return <TrainingYardFurniture cx={cx} cz={cz} />;
    case 'infirmary': return <InfirmaryFurniture cx={cx} cz={cz} />;
    case 'workshop': return <WorkshopFurniture cx={cx} cz={cz} />;
    case 'alchemy-lab': return <AlchemyLabFurniture cx={cx} cz={cz} />;
    default: return null;
  }
}
