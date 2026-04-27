import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useControls } from 'leva';
import { RoomProp } from '../facility/room-prop';
import { AlchemyWallDecor } from './facility-room-alchemy-wall-decor';
import { TorchFireVfx } from '../vfx/torch-fire-vfx';
import { TorchFireEffect as TorchFireEffectLegacy } from '../vfx/torch-fire-particles';
import { CandleFireEffect } from '../vfx/candle-fire-effect';
import { SteamVentEffect } from '../vfx/steam-vent-effect';
import { useGraphicsQuality } from '../world';

useGLTF.preload('/models/furnitures/alchemy_reactor.glb');
useGLTF.preload('/models/furnitures/alchemy_shelf.glb');
useGLTF.preload('/models/furnitures/alchemy_silo.glb');
useGLTF.preload('/models/furnitures/alchemy_workbend.glb');
useGLTF.preload('/tiles/t_ancient-manuscript.glb');
useGLTF.preload('/tiles/t_woodentiles.glb');

/** Single wooden tile scaled to fit tileSize × tileSize footprint */
function FloorTile({ position, tileSize }: {
  position: [number, number, number];
  tileSize: number;
}) {
  const { scene } = useGLTF('/tiles/t_woodentiles.glb');
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

/** 3×3 grid of wooden tiles covering the 7×7 alchemy room floor */
function AlchemyFloor({ cx, cz }: { cx: number; cz: number }) {
  const TILE_SIZE = 7 / 3;
  const positions = useMemo<[number, number, number][]>(() => {
    const result: [number, number, number][] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        result.push([
          cx - 3.5 + TILE_SIZE * 0.5 + col * TILE_SIZE,
          -0.12,
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

export function AlchemyLabFurniture({ cx, cz }: { cx: number; cz: number }) {
  const quality = useGraphicsQuality();
  const FireVfx = quality === 'high' ? TorchFireVfx : TorchFireEffectLegacy;

  const reactorL = useControls('Reactor Light — Left', {
    offsetX: { value: -0.9, min: -3, max: 0, step: 0.05 },
    offsetY: { value: 0.7, min: 0, max: 3, step: 0.05 },
    offsetZ: { value: 0.3, min: -2, max: 3, step: 0.05 },
    color: { value: '#ff7722' },
    intensity: { value: 5, min: 0, max: 20, step: 0.1 },
    distance: { value: 4.5, min: 0.5, max: 12, step: 0.1 },
  }, { collapsed: true });

  const reactorR = useControls('Reactor Light — Right', {
    offsetX: { value: 1.0, min: 0, max: 3, step: 0.05 },
    offsetY: { value: 0.8, min: 0, max: 3, step: 0.05 },
    offsetZ: { value: 0.3, min: -2, max: 3, step: 0.05 },
    color: { value: '#ff7722' },
    intensity: { value: 5, min: 0, max: 20, step: 0.1 },
    distance: { value: 4.5, min: 0.5, max: 12, step: 0.1 },
  }, { collapsed: true });

  return (
    <group>
      <AlchemyFloor cx={cx} cz={cz} />
      <AlchemyWallDecor cx={cx} cz={cz} />
      <RoomProp path="/models/furnitures/Verdant_Pipe_Crossroa.glb" position={[cx  - 2.55 , 0, cz - 0.2]} targetHeight={0.5} rotY={0} />
      <RoomProp path="/models/furnitures/alchemy_reactor.glb" position={[cx, 0, cz - 0.2]} targetHeight={3.1} rotY={0} />
      <RoomProp path="/models/furnitures/Green_bamboo_tube.glb" position={[cx, 0, cz - 2.1]} targetHeight={0.5} rotY={1.5} />
      <SteamVentEffect position={[cx + 1.5, 3.3, cz - 0.1]} scale={1.5} />
      <RoomProp path="/models/furnitures/alchemy_shelf.glb" position={[cx - 2.7, 0, cz - 2.5]} targetHeight={2.7} rotY={Math.PI / 2} />
      <RoomProp path="/models/furnitures/alchemy_silo.glb" position={[cx - 2.8, 0, cz + 1.2]} targetHeight={2.4} rotY={Math.PI / 0.4} />
      <RoomProp path="/models/furnitures/alchemy_workbend.glb" position={[cx - 1, 0, cz + 3]} targetHeight={1.5} rotY={Math.PI / -1} />
      <pointLight position={[cx - 1, 1.1, cz + 3]} color="#66ffcc" intensity={1.4} distance={1.8} decay={2} />
      <RoomProp path="/models/furnitures/p_vibrant_han_2.glb" position={[cx - 2.6, 0, cz + 3.0]} targetHeight={0.9} rotY={1.5} />
      <RoomProp path="/models/furnitures/alchemists-curio-cab.glb" position={[cx + 2, -0.1, cz - 3]} targetHeight={1.5} rotY={0} />

      <group position={[cx + 2.4, 0.5, cz - 2.8]}>
        <RoomProp path="/models/furnitures/oil-lamp.glb" position={[0, 0, 0]} targetHeight={0.4} rotY={0} />
        <FireVfx offsetY={0.42} scale={0.35} debugLabel="Alchemy OilLamp" />
        <pointLight position={[0, 0.55, 0]} color="#ff9944" intensity={3.0} distance={4.5} decay={2} />
      </group>

      <group position={[cx + 3, 0, cz + 2.0]}>
        <RoomProp path="/models/furnitures/candlelit-tome-tower.glb" position={[0, 0, 0]} targetHeight={1.2} rotY={1.5} />
        <CandleFireEffect offsetY={1.25} scale={0.9} />
        <group position={[-0.12, 0.2, 0.06]}>
          <CandleFireEffect offsetY={0.82} scale={0.9} />
        </group>
        <group position={[0.14, 0.4, -0.06]}>
          <CandleFireEffect offsetY={0.78} scale={0.9} />
        </group>
        <pointLight position={[0, 1.1, 0]} color="#ffbb55" intensity={1.5} distance={1} decay={2} />
      </group>

      <pointLight position={[cx + 0.05, reactorL.offsetY, cz + reactorL.offsetZ]} color={reactorL.color} intensity={reactorL.intensity} distance={reactorL.distance} decay={2} />
      <pointLight position={[cx + reactorR.offsetX, reactorR.offsetY, cz + reactorR.offsetZ]} color={reactorR.color} intensity={reactorR.intensity} distance={reactorR.distance} decay={2} />
      <pointLight position={[cx - 1.2, 1.6, cz - 3.2]} color="#00ddcc" intensity={1.4} distance={3.5} decay={2} />
      <pointLight position={[cx + 1.8, 0.9, cz - 3.2]} color="#00ddcc" intensity={1.0} distance={2.5} decay={2} />
      <pointLight position={[cx - 3.2, 1.5, cz + 0.5]} color="#00ddcc" intensity={1.5} distance={3.0} decay={2} />
      <pointLight position={[cx - 3.2, 0.8, cz + 2.0]} color="#00ddcc" intensity={1.0} distance={2.5} decay={2} />
      <pointLight position={[cx - 2.6, 0.6, cz + 3.0]} color="#9944cc" intensity={3.5} distance={3.5} decay={2} />
      <pointLight position={[cx - 3, 1.9, cz - 2.5]} color="#88ffaa" intensity={1.8} distance={3.0} decay={2} />
      <pointLight position={[cx, 4.5, cz]} color="#45e293" intensity={6} distance={9} decay={2} />
      <pointLight position={[cx - 2, 4.0, cz + 2]} color="#1ec268" intensity={3.5} distance={6} decay={2} />
    </group>
  );
}
