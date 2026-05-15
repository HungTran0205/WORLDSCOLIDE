/**
 * CombatPlatform — composes a single PlatformSpec into JSX:
 *   1. Top surface tile (<TiledFloor>) at the platform's center y.
 *   2. Optional camera-facing vertical face (<PlatformSideWall>) hanging down
 *      from the +Z edge for raised platforms.
 *   3. Manual decals (<FloorDecal>) hand-placed on top.
 *   4. Density-driven scatter decals (<PlatformDecalScatter>).
 *
 * Coordinate frame: a `<group position={platform.position}>` wraps everything
 * so children use platform-local coordinates (origin = platform top center).
 *  - TiledFloor mounts at (0,0,0) → platform top y.
 *  - SideWall center at [0, -sideHeight/2, depth/2 + ε] → top edge meets
 *    platform top, hangs down toward y < 0.
 *  - Manual decals: spec gives world [x,z]; we subtract platform.position to
 *    convert to local. y stays 0 (FloorDecal applies its own yOffset).
 *
 * Lighting / emissiveIntensity defaults:
 *  - `lighting` defaults to 'lit' (matches <TiledFloor> default → torch-pool
 *    reactive). Stages can override per-platform via spec when a flat unlit
 *    look is preferred (e.g. lolo-village-outskirt for visual parity with the
 *    pre-refactor TiledFloorMosaic-based scene).
 *  - `emissiveIntensity` defaults to 0.7 (matches <TiledFloor> default).
 *  - Both values pass through to the side-wall so top + face shade together.
 *
 * sideHeight default rule: omit (or 0) for ground platforms; for raised
 * platforms, default = `position.y` so the wall hangs from top down to y=0.
 * Stages override `sideHeight` to expose a "hố sụt" pit (wall extends below
 * the visible ground) or shorten a stepped tier.
 */

import { TiledFloor } from '@/scene/sprites/tiled-floor';
import { FloorDecal } from '@/scene/sprites/floor-decal';
import { PlatformSideWall } from './platform-side-wall';
import { PlatformDecalScatter } from './platform-decal-scatter';
import type { PlatformSpec } from '@/scene/combat/maps/stage-spec-types';

const SIDE_WALL_Z_EPSILON = 0.01;

export interface CombatPlatformProps {
  platform: PlatformSpec;
}

export function CombatPlatform({ platform }: CombatPlatformProps) {
  const [width, depth] = platform.size;
  const tileWorldSize = platform.tileWorldSize ?? 1;
  const lighting = platform.lighting ?? 'lit';
  const emissiveIntensity = platform.emissiveIntensity ?? 0.7;

  // Default sideHeight = platform top y (so wall hangs to y=0 ground line).
  // Negative or zero y → ground platform, no wall.
  const defaultSideHeight = platform.position[1] > 0 ? platform.position[1] : 0;
  const sideHeight = platform.sideHeight ?? defaultSideHeight;
  const showSideWall = !!platform.sideTile && sideHeight > 0;

  const manualDecals = platform.decals ?? [];

  return (
    <group position={platform.position}>
      <TiledFloor
        width={width}
        depth={depth}
        tileTexture={platform.baseTile}
        tileWorldSize={tileWorldSize}
        lighting={lighting}
        emissiveIntensity={emissiveIntensity}
      />

      {showSideWall && (
        <PlatformSideWall
          tile={platform.sideTile as string}
          position={[0, -sideHeight / 2, depth / 2 + SIDE_WALL_Z_EPSILON]}
          size={[width, sideHeight]}
          tileWorldSize={tileWorldSize}
          lighting={lighting}
          emissiveIntensity={emissiveIntensity}
        />
      )}

      {manualDecals.map((d, i) => (
        <FloorDecal
          key={`${platform.id}:m${i}`}
          // DecalPlacement.position is [x, z] in WORLD coords; convert to
          // platform-local by subtracting the group's XZ origin.
          position={[
            d.position[0] - platform.position[0],
            0,
            d.position[1] - platform.position[2],
          ]}
          size={d.size}
          texture={d.texture}
          rotation={d.rotation}
          color={d.color}
          opacity={d.opacity}
        />
      ))}

      <PlatformDecalScatter platform={platform} />
    </group>
  );
}
