/** Guild hall 3D scene — GLB floor + furniture meshes + 2D diorama walls */

import { ContactShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useGameStore } from '@/game/state/store';
import { BuildOverlay } from './build-overlay';
import { FurnitureModel } from './furniture-model';
import { GuildHallWall } from './guild-hall-wall';
import { GuildHallProps } from './guild-hall-props';
import { LinhSonFloor } from './linh-son-floor';

/** Guild hall floor (GLB) + furniture + build overlay */
export function GuildHall() {
  const furniture = useGameStore((s) => s.guildHall.furniture);
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  const shadowsEnabled = useGameStore((s) => s.settings.shadowsEnabled);
  const gl = useThree((s) => s.gl);
  // ContactShadows uses WebGLRenderTarget internally — not compatible with WebGPURenderer
  const isWebGPU = 'isWebGPURenderer' in gl;

  return (
    <group>
      <GuildHallWall gridWidth={10} gridDepth={7} />
      <LinhSonFloor gridWidth={10} gridDepth={7} />
      <GuildHallProps />
      {furniture.map((f) => (
        <FurnitureModel key={f.id} furniture={f} />
      ))}
      {shadowsEnabled && !isWebGPU && (
        <ContactShadows
          position={[5, 0.06, 3.5]}
          opacity={0.5}
          scale={[13, 9]}
          blur={2}
          far={3}
          resolution={512}
        />
      )}
      {isBuildMode && <BuildOverlay />}
    </group>
  );
}
