/** Guild hall 3D scene — per-cell floor tiles + furniture meshes (no rooms) */

import { useMemo } from 'react';
import { useGameStore } from '@/game/state/store';
import { BuildOverlay } from './build-overlay';
import { FurnitureModel } from './furniture-model';
import { getFloorTileTexture } from './floor-tile-texture-generator';
import type { FloorTile } from '@/game/state/game-state';

function FloorTileCell({ tile }: { tile: FloorTile }) {
  const texture = useMemo(() => getFloorTileTexture(tile.color), [tile.color]);

  return (
    <mesh position={[tile.x + 0.5, 0, tile.z + 0.5]}>
      <boxGeometry args={[0.98, 0.1, 0.98]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

/** Guild hall floor tiles + furniture + build overlay */
export function GuildHall() {
  const floorTiles = useGameStore((s) => s.guildHall.floorTiles);
  const furniture = useGameStore((s) => s.guildHall.furniture);
  const isBuildMode = useGameStore((s) => s.isBuildMode);

  return (
    <group>
      {floorTiles.map((tile) => (
        <FloorTileCell key={`${tile.x},${tile.z}`} tile={tile} />
      ))}
      {furniture.map((f) => (
        <FurnitureModel key={f.id} furniture={f} />
      ))}
      {isBuildMode && <BuildOverlay />}
    </group>
  );
}
