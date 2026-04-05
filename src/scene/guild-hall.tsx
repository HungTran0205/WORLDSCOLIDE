/** Guild hall 3D scene — GLB floor + furniture meshes + 2D diorama walls */

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

  return (
    <group>
      <GuildHallWall gridWidth={10} gridDepth={7} />
      <LinhSonFloor gridWidth={10} gridDepth={7} />
      <GuildHallProps />
      {furniture.map((f) => (
        <FurnitureModel key={f.id} furniture={f} />
      ))}
      {isBuildMode && <BuildOverlay />}
    </group>
  );
}
