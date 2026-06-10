/**
 * Training Yard walls — HD-2D diorama corner for the open-air grass yard.
 * - Back wall (north, along X): a low bamboo/timber RAILING with an open
 *   (transparent) top, so a blurred exterior backdrop layer can show through
 *   and sell the "wide outdoor yard" feeling.
 * - Left wall (west, along Z): a solid ROCK CLIFF face with cyan ether-crystal
 *   veins (Linh Son cavern).
 *
 * Both are flat sprite planes (like guild-hall-wall) flush with the 7×7 floor
 * edges. Lit via the emissiveMap trick so the painterly art stays bright under
 * the room's single daylight point light (matching the floor's Phase-07 rig).
 *
 * To swap sides, exchange RAILING_TEX / CLIFF_TEX between the two walls below.
 */

import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { assetUrl } from '@/lib/asset-url';

const RAILING_TEX = '/training-yard/LinhSon/wall-railing.png';
const CLIFF_TEX = '/training-yard/LinhSon/wall-cliff.png';

useTexture.preload(assetUrl(RAILING_TEX));
useTexture.preload(assetUrl(CLIFF_TEX));

const ROOM_SIZE = 7;
const WALL_HEIGHT = 5;
/** Extend planes below the floor so the iso view shows no base gap. */
const EXTRA = 0.3;
/** Plane wider than the room so the back/left planes overlap at the corner. */
const SEAM = 0.5;

const PLANE_H = WALL_HEIGHT + EXTRA;
const Y_CENTER = PLANE_H / 2 - EXTRA;

export function TrainingYardWalls({ cx, cz }: { cx: number; cz: number }) {
  const ox = cx - ROOM_SIZE / 2;
  const oz = cz - ROOM_SIZE / 2;
  const [railingTex, cliffTex] = useTexture([assetUrl(RAILING_TEX), assetUrl(CLIFF_TEX)]);

  // The railing is a HALF wall: size its plane to the texture's native aspect
  // so the bamboo posts aren't vertically stretched by the tall (5u) cliff
  // height. Base sits on the floor; the transparent upper band is the open top
  // a blurred exterior layer shows through.
  const wallWidth = ROOM_SIZE + SEAM;
  const railImg = railingTex.image as { width?: number; height?: number } | undefined;
  const railAspect = railImg?.width && railImg?.height ? railImg.width / railImg.height : 1584 / 672;
  const railH = wallWidth / railAspect;
  const railY = railH / 2 - EXTRA; // base flush with floor (matches cliff base)

  return (
    <group>
      {/* Back wall (north, z=oz) — bamboo railing, open transparent top.
          Own (shorter, aspect-correct) height so posts read at true scale. */}
      <mesh position={[cx , railY+0.25, oz]}>
        <planeGeometry args={[wallWidth, railH]} />
        <meshStandardMaterial
          map={railingTex}
          emissive="#ffffff"
          emissiveMap={railingTex}
          emissiveIntensity={0.55}
          roughness={0.9}
          metalness={0}
          transparent
          alphaTest={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Left wall (west, x=ox) — solid rock cliff, rotated to face +X. */}
      <mesh position={[ox, Y_CENTER, cz]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_SIZE + SEAM, PLANE_H]} />
        <meshStandardMaterial
          map={cliffTex}
          emissive="#ffffff"
          emissiveMap={cliffTex}
          emissiveIntensity={0.6}
          roughness={0.95}
          metalness={0}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}
