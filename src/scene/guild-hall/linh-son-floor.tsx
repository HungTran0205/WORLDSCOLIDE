/**
 * Linh Son guild hall floor — single TiledFloor plane covering the 10×7
 * world-unit room. Replaces the previous 5×4 GLB tile clone (20 instances)
 * per the Standard Tile Floor System (plans/260509-1253-standard-tile-floor-system).
 *
 * Tile choice: `wood-guild-floor_0001..0003` randomly mixed per cell
 * (D5 multi-variant blend, originally deferred). The torch
 * flicker pointLights in <GuildHallProps> illuminate furniture/walls; the
 * floor uses Phase 07 lambert+emissive (emissiveIntensity=0.3 — low baseline
 * so the torch warm pools hắt rõ lên sàn without over-exposing the room).
 *
 * Coordinate space: room occupies x:[0,gridWidth], z:[0,gridDepth]. We
 * center the plane at (gridWidth/2, 0, gridDepth/2) to match wall layout
 * in <GuildHallWall> (which positions BackWall at x=gridWidth/2, etc.).
 */

import { TiledFloor } from '@/scene/sprites/tiled-floor';

const TILE_TEXTURES = [
  '/tiles/2d/64px/wood-guild-floor_0001.png',
  '/tiles/2d/64px/wood-guild-floor_0002.png',
  '/tiles/2d/64px/wood-guild-floor_0003.png'
];

interface LinhSonFloorProps {
  gridWidth?: number;
  gridDepth?: number;
}

export function LinhSonFloor({ gridWidth = 10, gridDepth = 7 }: LinhSonFloorProps) {
  return (
    <TiledFloor
      width={gridWidth}
      depth={gridDepth}
      tileTexture={TILE_TEXTURES}
      tileWorldSize={2}
      position={[gridWidth / 2, 0, gridDepth / 2]}
      emissiveIntensity={0.3}
    />
  );
}
