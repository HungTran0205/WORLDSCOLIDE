/** Guild hall 3D scene — GLB floor + furniture meshes + 2D diorama walls */

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/state/store';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { DEBUG_MODE } from '@/debug';
import { BuildOverlay } from './build-overlay';
import { FurnitureModel } from './furniture-model';
import { GuildHallWall } from './guild-hall-wall';
import { GuildHallFront } from './guild-hall-front';
import { GuildHallProps } from './guild-hall-props';
import { GuildHallCollisionOverlay } from './guild-hall-collision-overlay';
import { LinhSonFloor } from './linh-son-floor';

/** Directional shadow light owned by the guild hall room.
 *  castShadow is mutated via ref — R3F JSX reconciliation of this bool prop
 *  is unreliable on WebGPU, so we bypass the reconciler entirely. */
function GuildHallLighting() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const shadowsEnabled = useGameStore((s) => s.settings.shadowsEnabled);

  useEffect(() => {
    if (!lightRef.current) return;
    const light = lightRef.current;
    if (shadowsEnabled) {
      light.castShadow = true;
    } else {
      // Dispose render target before disabling — Three.js r182 WebGPU bug:
      // ShadowNode holds a stale depthTexture reference after castShadow toggle,
      // causing a null-read crash on re-enable unless map is cleanly nulled first.
      if (light.shadow.map) light.shadow.map.dispose();
      (light.shadow as { map: null }).map = null;
      light.castShadow = false;
    }
  }, [shadowsEnabled]);

  return (
    <directionalLight
      ref={lightRef}
      position={[5, 10, 5]}
      intensity={1}
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-8}
      shadow-camera-right={8}
      shadow-camera-top={8}
      shadow-camera-bottom={-8}
      shadow-camera-near={0.1}
      shadow-camera-far={20}
      shadow-radius={4}
      shadow-normalBias={0.02}
    />
  );
}

/** Guild hall floor (GLB) + furniture + build overlay */
export function GuildHall() {
  const furniture = useGameStore((s) => s.guildHall.furniture);
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  // Walls leak into combat scene on WebGPU even when the wrapping
  // `<group visible={!isCombatOpen}>` is set in world.tsx (visibility prop on
  // group doesn't always propagate to mesh descendants reliably under the
  // WebGPU renderer). Conditional unmount of the wall pair is safe — they
  // hold no VFXParticles, so disposal can't race the GPU pipeline.
  const isCombatOpen = useCombatPanelStore((s) => s.isOpen);

  return (
    <group>
      <GuildHallLighting />
      {!isCombatOpen && <GuildHallWall gridWidth={10} gridDepth={7} />}
      <LinhSonFloor gridWidth={10} gridDepth={7} />
      <GuildHallProps />
      {DEBUG_MODE && <GuildHallCollisionOverlay />}
      {furniture.map((f) => (
        <FurnitureModel key={f.id} furniture={f} />
      ))}
      {isBuildMode && <BuildOverlay />}
      {!isCombatOpen && <GuildHallFront gridWidth={10} gridDepth={7} />}
    </group>
  );
}
