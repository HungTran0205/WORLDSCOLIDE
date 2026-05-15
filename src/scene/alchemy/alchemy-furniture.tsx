import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useControls } from 'leva';
import { RoomProp } from '../facility/room-prop';
import { AlchemyWallDecor } from './facility-room-alchemy-wall-decor';
import { TorchFireVfx } from '../vfx/torch-fire-vfx';
import { TorchFireEffect as TorchFireEffectLegacy } from '../vfx/torch-fire-particles';
import { CandleFireEffect } from '../vfx/candle-fire-effect';
import { SteamVentEffect } from '../vfx/steam-vent-effect';
import { FloorDecal } from '../sprites/floor-decal';
import { useGraphicsQuality } from '../world';
import { useGameStore } from '@/game/state/store';

useGLTF.preload('/models/furnitures/alchemy_reactor.glb');
useGLTF.preload('/models/furnitures/alchemy_shelf.glb');
useGLTF.preload('/models/furnitures/alchemy_silo.glb');
useGLTF.preload('/models/furnitures/alchemy_workbend.glb');

/** Point light với flicker nhẹ dùng cho candle */
function FlickerPointLight({ position, color, baseIntensity, distance, decay = 2 }: {
  position: [number, number, number];
  color: string;
  baseIntensity: number;
  distance: number;
  decay?: number;
}) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const f = 0.82 + 0.12 * Math.sin(t * 3.7) * Math.sin(t * 2.1 + 1.3) + 0.06 * Math.sin(t * 7.3 + 0.5);
    ref.current.intensity = baseIntensity * f;
  });
  return <pointLight ref={ref} position={position} color={color} intensity={baseIntensity} distance={distance} decay={decay} />;
}

export function AlchemyLabFurniture({ cx, cz }: { cx: number; cz: number }) {
  const quality = useGraphicsQuality();
  const FireVfx = quality === 'high' ? TorchFireVfx : TorchFireEffectLegacy;

  const spotL = useControls('Reactor Spot — Left', {
    posX: { value: -2, min: -6, max: 6, step: 0.1 },
    posY: { value: 5, min: 1, max: 10, step: 0.1 },
    posZ: { value: 3, min: -3, max: 8, step: 0.1 },
    color: { value: '#ff7722' },
    intensity: { value: 10, min: 0, max: 30, step: 0.5 },
    distance: { value: 10, min: 2, max: 20, step: 0.5 },
    angle: { value: Math.PI / 3.5, min: 0.1, max: Math.PI / 2, step: 0.01 },
    penumbra: { value: 0.4, min: 0, max: 1, step: 0.05 },
  }, { collapsed: true });

  const spotR = useControls('Reactor Spot — Right', {
    posX: { value: 2.5, min: -6, max: 6, step: 0.1 },
    posY: { value: 5, min: 1, max: 10, step: 0.1 },
    posZ: { value: 3, min: -3, max: 8, step: 0.1 },
    color: { value: '#ff8833' },
    intensity: { value: 12, min: 0, max: 30, step: 0.5 },
    distance: { value: 10, min: 2, max: 20, step: 0.5 },
    angle: { value: Math.PI / 3.5, min: 0.1, max: Math.PI / 2, step: 0.01 },
    penumbra: { value: 0.4, min: 0, max: 1, step: 0.05 },
  }, { collapsed: true });

  const shadowsEnabled = useGameStore((s) => s.settings.shadowsEnabled);
  const spot1Ref = useRef<THREE.SpotLight>(null);
  const spot2Ref = useRef<THREE.SpotLight>(null);

  useEffect(() => {
    [spot1Ref, spot2Ref].forEach(r => {
      if (!r.current) return;
      const light = r.current;
      if (shadowsEnabled) {
        // Configure shadow camera trước khi enable để tránh init race trên WebGPU
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 15;
        light.shadow.camera.updateProjectionMatrix();
        // Force ShadowNode rebuild từ đầu — tránh stale depthTexture reference
        light.shadow.needsUpdate = true;
        light.castShadow = true;
      } else {
        // Dispose map trước castShadow=false để ShadowNode không access null map
        if (light.shadow.map) {
          light.shadow.map.dispose();
          (light.shadow as { map: null }).map = null;
        }
        light.castShadow = false;
      }
    });
  }, [shadowsEnabled]);

  // Targets cho 2 spot light chiếu từ reactor ra 2 phía của phòng
  const reactorTarget1 = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(cx - 3, 0, cz + 2); // phía trái phòng
    return obj;
  }, [cx, cz]);
  const reactorTarget2 = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(cx + 3, 0, cz + 2); // phía phải phòng
    return obj;
  }, [cx, cz]);

  return (
    <group>
      {/* Reactor directional light targets phải nằm trong scene graph */}
      <primitive object={reactorTarget1} />
      <primitive object={reactorTarget2} />

      <AlchemyWallDecor cx={cx} cz={cz} />

      {/* Phase 07 — magic rune circle decal beneath the reactor (purple ring,
          static). Pure overlay; gives the reactor base a sense of arcane
          place-holding even when the reactor light is dim. */}
      <FloorDecal
        position={[cx, 0.01, cz - 0.2]}
        size={[3, 3]}
        texture="/decals/floor/magic-rune-circle.png"
      />

      <RoomProp castShadow path="/models/furnitures/Verdant_Pipe_Crossroa.glb" position={[cx  - 2.55 , 0, cz - 0.2]} targetHeight={0.5} rotY={0} />
      <RoomProp castShadow path="/models/furnitures/alchemy_reactor.glb" position={[cx, 0, cz - 0.2]} targetHeight={3.1} rotY={0} />
      <RoomProp castShadow path="/models/furnitures/Green_bamboo_tube.glb" position={[cx, 0, cz - 2.1]} targetHeight={0.5} rotY={1.5} />
      <SteamVentEffect position={[cx + 1.5, 3.3, cz - 0.1]} scale={1.5} />
      <RoomProp castShadow path="/models/furnitures/alchemy_shelf.glb" position={[cx - 2.7, 0, cz - 2.5]} targetHeight={2.7} rotY={Math.PI / 2} />
      <RoomProp castShadow path="/models/furnitures/alchemy_silo.glb" position={[cx - 2.8, 0, cz + 1.2]} targetHeight={2.4} rotY={Math.PI / 0.4} />
      <RoomProp castShadow path="/models/furnitures/alchemy_workbend.glb" position={[cx - 1, 0, cz + 3]} targetHeight={1.5} rotY={Math.PI / -1} />
      <pointLight position={[cx - 1, 1.1, cz + 3]} color="#66ffcc" intensity={0.7} distance={1.8} decay={2} />
      <RoomProp castShadow path="/models/furnitures/p_vibrant_han_2.glb" position={[cx - 2.6, 0, cz + 3.0]} targetHeight={0.9} rotY={1.5} />
      <RoomProp castShadow path="/models/furnitures/alchemists-curio-cab.glb" position={[cx + 2, -0.1, cz - 3]} targetHeight={1.5} rotY={0} />

      {/* Oil lamp — dimmed */}
      <group position={[cx + 2.4, 0.5, cz - 2.8]}>
        <RoomProp castShadow path="/models/furnitures/oil-lamp.glb" position={[0, 0, 0]} targetHeight={0.4} rotY={0} />
        <FireVfx offsetY={0.42} scale={0.35} debugLabel="Alchemy OilLamp" />
        <pointLight position={[0, 0.55, 0]} color="#ff9944" intensity={1} distance={2} decay={1} />
      </group>

      {/* Candle tome tower — flicker nhẹ */}
      <group position={[cx + 3, 0, cz + 2.0]}>
        <RoomProp castShadow path="/models/furnitures/candlelit-tome-tower.glb" position={[0, 0, 0]} targetHeight={1.2} rotY={1.5} />
        <CandleFireEffect offsetY={1.25} scale={0.9} />
        <group position={[-0.12, 0.2, 0.06]}>
          <CandleFireEffect offsetY={0.82} scale={0.9} />
        </group>
        <group position={[0.14, 0.4, -0.06]}>
          <CandleFireEffect offsetY={0.78} scale={0.9} />
        </group>
        <FlickerPointLight position={[0, 1.1, 0]} color="#ffbb55" baseIntensity={1} distance={1} />
      </group>

      {/* Reactor — 2 spot lights, castShadow toggled via ref (WebGPU reconciliation workaround) */}
      <spotLight ref={spot1Ref} position={[cx + spotL.posX, spotL.posY, cz + spotL.posZ]} target={reactorTarget1} color={spotL.color} intensity={spotL.intensity} distance={spotL.distance} angle={spotL.angle} penumbra={spotL.penumbra} decay={2} />
      <spotLight ref={spot2Ref} position={[cx + spotR.posX, spotR.posY, cz + spotR.posZ]} target={reactorTarget2} color={spotR.color} intensity={spotR.intensity} distance={spotR.distance} angle={spotR.angle} penumbra={spotR.penumbra} decay={2} />

      {/* Accent/ambient lights — dimmed */}
      <pointLight position={[cx - 1.2, 1.6, cz - 3.2]} color="#00ddcc" intensity={0.7} distance={3.5} decay={2} />
      <pointLight position={[cx + 1.8, 0.9, cz - 3.2]} color="#00ddcc" intensity={0.5} distance={2.5} decay={2} />
      <pointLight position={[cx - 3.2, 1.5, cz + 0.5]} color="#00ddcc" intensity={0.7} distance={3.0} decay={2} />
      <pointLight position={[cx - 3.2, 0.8, cz + 2.0]} color="#00ddcc" intensity={0.5} distance={2.5} decay={2} />
      <pointLight position={[cx - 2.6, 0.6, cz + 3.0]} color="#9944cc" intensity={2.0} distance={1} decay={1} />
      <pointLight position={[cx - 3, 1.9, cz - 2.5]} color="#88ffaa" intensity={0.9} distance={3.0} decay={2} />
    </group>
  );
}
