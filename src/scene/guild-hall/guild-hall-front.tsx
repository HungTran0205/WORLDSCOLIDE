/**
 * Guild hall foreground frame — Octopath Traveler-style 2D diorama overlay.
 *
 * The iso camera (zoom/pan only, fixed angle ~+x+z) makes a single static
 * billboard sufficient: we rotate the plane 45° around Y so its normal aligns
 * with the camera's viewing direction, then center it on the room. The
 * painted left/right pillars in front.png then sit near the front-left and
 * back-right corners of the iso-projected room, framing the diorama.
 *
 * Render order > walls so it draws on top; alphaTest=0.1 keeps the
 * transparent center fully see-through while opaque pillar pixels write
 * depth and naturally occlude any character standing behind them.
 */

import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { assetUrl } from '@/lib/asset-url';

const FRONT_SPRITE = '/GuildHall/LinhSon/front.png';

useTexture.preload(assetUrl(FRONT_SPRITE));

interface GuildHallFrontProps {
  /** Floor grid width in world units (must match GuildHallWall) */
  gridWidth?: number;
  /** Floor grid depth in world units (must match GuildHallWall) */
  gridDepth?: number;
  /** Wall height in world units (must match GuildHallWall) */
  wallHeight?: number;
}

// Source PNG dimensions — used to preserve aspect ratio when sizing the plane
const SPRITE_W = 681;
const SPRITE_H = 365;

export function GuildHallFront({
  gridWidth = 10,
  gridDepth = 10,
  wallHeight = 6.8,
}: GuildHallFrontProps) {
  const texture = useTexture(assetUrl(FRONT_SPRITE));

  const aspect = SPRITE_W / SPRITE_H;
  const planeHeight = wallHeight;
  const planeWidth = planeHeight * aspect;

  return (
    <mesh
      position={[gridWidth / 2 + 2.8, planeHeight / 2 - 0.5, gridDepth / 2 + 3]}
      rotation={[0, Math.PI / 4, 0]}
      renderOrder={10}
    >
      <planeGeometry args={[planeWidth, planeHeight]} />
      <meshStandardMaterial
        map={texture}
        transparent
        alphaTest={0.1}
        side={THREE.FrontSide}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}
