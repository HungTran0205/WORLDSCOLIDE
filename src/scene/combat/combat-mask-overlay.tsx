/**
 * R3F mask overlay mesh — small plane positioned above a combat character's
 * head, rendered as a sibling of the character mesh inside a parent group.
 * Mirrors the character's billboard tilt (-COMBAT_CAM_TILT_RAD around X) so
 * it faces the camera the same way.
 *
 * Texture: `east.png` (sprite source is east-facing; mirror via scale.x = -1
 * for west). Per phase-03-combat-overlay.md (260519-1641-mask-overlay-poc).
 */

import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, NearestFilter, SRGBColorSpace, type Mesh } from 'three';
import { getMaskAssetPath } from '@/scene/sprites/mask-pool';
import { COMBAT_CAM_TILT_RAD } from './combat-camera-config';

// Active combat animation states from combat-idle-sprite. `attacking`/`skill`
// share the attack pose; `hit`/`blocking`/`battle-idle` collapse onto idle.
type CombatAnimStateKey = 'idle' | 'walking' | 'attacking' | 'skill' | 'hit' | 'dead';

/**
 * Per-state [offsetX, offsetY] in world units, *added* to the base head
 * anchor (charScale * HEAD_ANCHOR_FRACTION). Small values — these are
 * deltas, not absolute positions.
 */
const MASK_OFFSET_BY_STATE: Record<CombatAnimStateKey, [number, number]> = {
  idle:      [0,     0   ],
  walking:   [0,     0   ],
  attacking: [0.15, -0.15], // lunge forward + head dip
  skill:     [0.15, -0.15],
  hit:       [0,     0.15], // recoil up
  dead:      [0,    -1.5 ], // collapsed (hidden anyway via `hidden` prop)
};
const DEFAULT_OFFSET: [number, number] = [0, 0];

/** Mask sits at charScale × this fraction above the entity ground anchor. */
const HEAD_ANCHOR_FRACTION = 0.55;
/** Static horizontal shift in world units (independent of facing/state).
 *  Positive = shift east (right); negative = shift west (left). */
const MASK_BASE_X_OFFSET = -0.5;
const LERP_FACTOR = 0.25;
/** Approx pixel-parity with character (char scale ≈ 3.96u rendered from
 *  128px source ≈ 0.031 u/px; mask 32px → ~1u). Tunable. */
const MASK_PLANE_SIZE = 1.1;

interface CombatMaskOverlayProps {
  maskId: string;
  /** Live character scale (foreshortening already applied). */
  charScale: number;
  animStateRef: RefObject<string>;
  facingRightRef: RefObject<boolean>;
  hidden?: boolean;
}

export function CombatMaskOverlay({
  maskId,
  charScale,
  animStateRef,
  facingRightRef,
  hidden,
}: CombatMaskOverlayProps) {
  const meshRef = useRef<Mesh>(null);
  const texture = useLoader(TextureLoader, getMaskAssetPath(maskId, 'east'));

  useEffect(() => {
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  const baseY = charScale * HEAD_ANCHOR_FRACTION;

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.visible = !hidden;
    if (hidden) return;

    const state = animStateRef.current as CombatAnimStateKey;
    const [rawX, deltaY] = MASK_OFFSET_BY_STATE[state] ?? DEFAULT_OFFSET;

    // Forward lunge mirrors facing: +x east, -x west. Allies always face east
    // in this engine, so dirSign is effectively +1, but keep the math correct.
    const dirSign = facingRightRef.current === false ? -1 : 1;
    const targetX = MASK_BASE_X_OFFSET + rawX * dirSign;
    const targetY = baseY + deltaY;

    mesh.position.x += (targetX - mesh.position.x) * LERP_FACTOR;
    mesh.position.y += (targetY - mesh.position.y) * LERP_FACTOR;

    // Source is east-facing — mirror only when char faces west.
    mesh.scale.x = facingRightRef.current === false ? -1 : 1;
  });

  return (
    <mesh
      ref={meshRef}
      position={[MASK_BASE_X_OFFSET, baseY, 0.5]}
      rotation={[-COMBAT_CAM_TILT_RAD, 0, 0]}
      renderOrder={10}
    >
      <planeGeometry args={[MASK_PLANE_SIZE, MASK_PLANE_SIZE]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.1}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
