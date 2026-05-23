/**
 * Title-scene masked figures — 5 Linh Son characters standing behind the
 * drum, each wearing a different ceremonial mask. Composition is a loose
 * triangle: 1 center cult leader + 2 flanking + 2 far back.
 *
 * Each figure = avatar sprite billboard + mask sprite overlay anchored at
 * the head area (maskOffsetY per figure). Avatars are static — these are
 * silhouettes against firelight, no animation needed.
 *
 * Assets reused: existing Linh Son character sprites (rotations/south.png
 * for SCOUT, animations/walking south frame_000 for WARRIOR — WARRIOR has
 * no rotations folder). Mask picks are tentative; swap freely in polish.
 */

import { Billboard, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface MaskedFigureSpec {
  /** Avatar sprite path — Linh Son character. */
  avatar: string;
  /** Mask sprite path — gasf-* or half-* series. */
  mask: string;
  /** World-space position (x, y, z). z = depth into scene. */
  position: [number, number, number];
  /** Uniform scale multiplier; smaller for back-row figures. */
  scale: number;
  /** Horizontal offset of mask overlay relative to avatar center (world units,
   *  pre-scale). Use to nudge masks left/right when sprite head is off-axis. */
  maskOffsetX?: number;
  /** Vertical offset of mask overlay relative to avatar center (world units,
   *  pre-scale). Calibrated per-figure since head position varies by sprite. */
  maskOffsetY: number;
  /** Mask sprite size as fraction of avatar plane (typically ~0.45). */
  maskScale: number;
  /** Optional per-figure tint override. Defaults to SHADOW_TINT (warm).
   *  Side/back NPCs use SHADOW_TINT_DEEP to push their silhouettes into
   *  shadow, lifting the center cult leader's prominence. */
  tint?: string;
}

const AVATAR_PLANE: [number, number] = [1, 1.5];
// Warmer tint — keeps figures readable against dark walls without washing
// the firelight gradient. Brightened so cult leader is clearly visible.
const SHADOW_TINT = '#d8b894';
// Flanking-NPC tint — still cooler/dimmer than center so silhouette
// hierarchy holds, but bright enough that masks + body details read.
const SHADOW_TINT_DEEP = '#fff237';

const FIGURES: MaskedFigureSpec[] = [
  // Center cult leader — tallest, front-most of the back group.
  // maskOffsetY tuned for sprite-head position (top of 1.5-tall plane).
  // Stays on the warm SHADOW_TINT so the underlight reads on this figure only.
  {
    avatar: '/sprites/characters/LS-SWORD-M/animations/avatar/frame_000.png',
    mask: '/sprites/mask/mask-056.png',
    position: [0, 1, -1],
    scale: 1.5,
    maskOffsetX: 0,
    maskOffsetY: 0,
    maskScale: 0.3,
  },
    {
    avatar: '/sprites/characters/LS-SWORD-M/animations/avatar/frame_000.png',
    mask: '/sprites/mask/mask-056.png',
    position: [-0.4, 0.3, 1.5],
    scale: 1,
    maskOffsetX: 0,
    maskOffsetY: 0,
    maskScale: 0.3,
  },
  {
    avatar: '/sprites/characters/LS-WARRIOR-M/animations/avatar/frame_000.png',
    mask: '/sprites/mask/mask-101.png',
    position: [0.5  , 0.9, -1.5],
    scale: 1.3,
    maskOffsetX: 0,
    maskOffsetY: 0.12,
    maskScale: 0.3,
    tint: SHADOW_TINT_DEEP,
  },
  {
    avatar: '/sprites/characters/LS-WARRIOR-F/animations/avatar/frame_000.png',
    mask: '/sprites/mask/mask-010.png',
    position: [-0.7 , 0.8, -1.5],
    scale: 1.3,
    maskOffsetX: 0.01,
    maskOffsetY: 0.25,
    maskScale: 0.35,
    tint: SHADOW_TINT_DEEP,
  }
  ,
  // Front-left flanking — deeper shadow for silhouette contrast
  {
    avatar: '/sprites/characters/LS-SCOUT-F/animations/walking-8-frames/south/frame_000.png',
    mask: '/sprites/mask/half-mask10.png',
    position: [-1.3, 0.9, -1.7],
    scale: 1.0,
    maskOffsetX: 0,
    maskOffsetY: 0.006,
    maskScale: 0.3,
    tint: SHADOW_TINT_DEEP,
  },
  // Front-right flanking — deeper shadow for silhouette contrast
  {
    avatar: '/sprites/characters/LS-WARRIOR-M/animations/walking-8-frames/south/frame_000.png',
    mask: '/sprites/mask/mask-039.png',
    position: [1.3, 1.05, -1.7],
    scale: 1.0,
    maskOffsetX: 0,
    maskOffsetY: 0.01,
    maskScale: 0.3,
    tint: SHADOW_TINT_DEEP,
  },
  // Back-left, dimmer + smaller
  {
    avatar: '/sprites/characters/LS-WARRIOR-F/animations/avatar/frame_000.png',
    mask: '/sprites/mask/gasf-mask64.png',
    position: [-2.1, 0.9, -2.3],
    scale: 0.85,
    maskOffsetX: 0.01,
    maskOffsetY: 0.12,
    maskScale: 0.25,
    tint: SHADOW_TINT_DEEP,
  },
  // Back-right — reuses SCOUT-M at a different rotation; the mask change
  // is what reads them as separate figures, not the avatar identity.
  {
    avatar: '/sprites/characters/LS-SCOUT-M/animations/avatar/frame_000.png',
    mask: '/sprites/mask/mask-061.png',
    position: [2.1, 0.95, -2.3],
    scale: 0.85,
    maskOffsetX: 0,
    maskOffsetY: 0.2,
    maskScale: 0.3,
    tint: SHADOW_TINT_DEEP,
  },
];

function MaskedFigure({
  avatar,
  mask,
  position,
  scale,
  maskOffsetX = 0,
  maskOffsetY,
  maskScale,
  tint = SHADOW_TINT,
}: MaskedFigureSpec) {
  const avatarTex = useTexture(avatar);
  const maskTex = useTexture(mask);

  // Pixel art needs nearest filter to keep crisp edges.
  avatarTex.magFilter = THREE.NearestFilter;
  avatarTex.minFilter = THREE.NearestFilter;
  maskTex.magFilter = THREE.NearestFilter;
  maskTex.minFilter = THREE.NearestFilter;

  return (
    <Billboard position={position} follow={false}>
      {/* Avatar plane — tinted darker so figures read as shadowed silhouettes
       *  rather than fully-lit characters lifted from the in-game world. */}
      <mesh scale={[scale, scale, 1]}>
        <planeGeometry args={AVATAR_PLANE} />
        <meshStandardMaterial
          map={avatarTex}
          transparent
          alphaTest={0.1}
          color={tint}
          depthWrite={false}
        />
      </mesh>
      {/* Mask overlay — sits +0.01 in z so it always wins depth test. */}
      <mesh
        position={[maskOffsetX * scale, maskOffsetY * scale, 0.01]}
        scale={[scale * maskScale, scale * maskScale, 1]}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={maskTex}
          transparent
          alphaTest={0.5}
          depthWrite={false}
        />
      </mesh>
    </Billboard>
  );
}

export function MaskedFiguresCircle() {
  return (
    <>
      {FIGURES.map((fig, i) => (
        <MaskedFigure key={i} {...fig} />
      ))}
    </>
  );
}
