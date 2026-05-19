/**
 * Guild hall walls — HD-2D diorama style.
 * Back wall + left wall planes flush with the 3D floor edges,
 * using pixel art sprites generated for the Linh Son faction aesthetic:
 * bamboo/timber + Dong Son carvings + Ether Crystal veins.
 */

import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const BACK_WALL_SPRITE = '/GuildHall/LinhSon/wall-back.png';
const LEFT_WALL_SPRITE = '/GuildHall/LinhSon/wall-left.png';

/** Preload both wall sprites */
useTexture.preload(BACK_WALL_SPRITE);
useTexture.preload(LEFT_WALL_SPRITE);

interface GuildHallWallProps {
  /** Floor grid width in world units (default: 10) */
  gridWidth?: number;
  /** Floor grid depth in world units (default: 7) */
  gridDepth?: number;
  /** Wall height in world units (default: 5) */
  wallHeight?: number;
  /** Override back-wall texture URL (default: standard Linh Son guild-hall back wall).
   *  Used by the title scene to swap in a dedicated cinematic backdrop without
   *  affecting the in-game hall. */
  backSrc?: string;
  /** Override left-wall texture URL (default: standard Linh Son guild-hall left wall). */
  leftSrc?: string;
}

const WALL_MATERIAL_PROPS = { roughness: 0.9, metalness: 0 } as const;

/**
 * Back wall — flush with z=0 edge of floor, extends slightly below floor surface
 * so there is no visible gap in isometric view.
 */
function BackWall({ gridWidth, wallHeight, texture }: {
  gridWidth: number; wallHeight: number; texture: THREE.Texture;
}) {
  const height = wallHeight + 0.3;
  return (
    <mesh position={[gridWidth / 2, height / 2 - 0.3, 0]} receiveShadow>
      <planeGeometry args={[gridWidth + 0.5, height]} />
      <meshStandardMaterial map={texture} side={THREE.FrontSide} {...WALL_MATERIAL_PROPS} />
    </mesh>
  );
}

/**
 * Left wall — flush with x=0 edge of floor, rotated 90° to face +x (camera side).
 * Uses a dedicated left wall sprite with skull trophy and battle décor.
 */
function LeftWall({ gridDepth, wallHeight, texture }: {
  gridDepth: number; wallHeight: number; texture: THREE.Texture;
}) {
  const height = wallHeight + 0.3;
  return (
    <mesh
      position={[0, height / 2 - 0.3, gridDepth / 2]}
      rotation={[0, Math.PI / 2, 0]}
      receiveShadow
    >
      {/* +0.5 extra depth to cover corner seam with back wall */}
      <planeGeometry args={[gridDepth + 0.5, height]} />
      <meshStandardMaterial map={texture} side={THREE.FrontSide} {...WALL_MATERIAL_PROPS} />
    </mesh>
  );
}

/** Diorama walls — back + left — forming an HD-2D interior corner. */
export function GuildHallWall({
  gridWidth = 10,
  gridDepth = 7,
  wallHeight = 5,
  backSrc = BACK_WALL_SPRITE,
  leftSrc = LEFT_WALL_SPRITE,
}: GuildHallWallProps) {
  const [backTexture, leftTexture] = useTexture([backSrc, leftSrc]);

  return (
    <>
      <BackWall gridWidth={gridWidth} wallHeight={wallHeight} texture={backTexture} />
      <LeftWall gridDepth={gridDepth} wallHeight={wallHeight} texture={leftTexture} />
    </>
  );
}
