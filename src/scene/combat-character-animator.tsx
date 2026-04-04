/**
 * Combat-specific character sprite animator — uses sprite atlas for ZERO
 * texture binding overhead. Walk/attack frames packed into CanvasTexture
 * grids, selected via UV offset instead of material.map swapping.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useLoader, useFrame, useThree } from '@react-three/fiber';
import { TextureLoader, MeshStandardMaterial, Mesh } from 'three';
import type { MutableRefObject } from 'react';
import type { SpriteDirection } from './sprite-path-resolver';
import { getWalkingFramePath, getAttackFramePath } from './sprite-path-resolver';
import { buildAtlasFromTextures, buildAtlasFromUrls, setAtlasFrame } from './sprite-atlas';
import type { SpriteAtlas } from './sprite-atlas';

const DIRECTIONS: SpriteDirection[] = ['north', 'south', 'east', 'west'];
const FRAME_COUNT = 8;
const WALK_FPS = 10;
const ATTACK_FPS = 12;

const DIR_OFFSET: Record<SpriteDirection, number> = {
  north: 0,
  south: FRAME_COUNT,
  east: FRAME_COUNT * 2,
  west: FRAME_COUNT * 3,
};

export type CombatAnimState = 'idle' | 'walking' | 'attacking' | 'skill' | 'hit' | 'dead';

interface CombatCharacterAnimatorProps {
  basePath: string;
  directionRef: MutableRefObject<SpriteDirection>;
  animStateRef: MutableRefObject<CombatAnimState>;
  hitTimeRef?: MutableRefObject<number>;
  size?: [number, number];
}

export function CombatCharacterAnimator({
  basePath,
  directionRef,
  animStateRef,
  hitTimeRef,
  size = [2.1, 2.1],
}: CombatCharacterAnimatorProps) {
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const prevAnimRef = useRef<CombatAnimState>('idle');

  // --- Walk atlas: load individual textures then pack into atlas ---
  const walkPaths = useMemo(() => {
    const paths: string[] = [];
    for (const dir of DIRECTIONS) {
      for (let i = 0; i < FRAME_COUNT; i++) {
        paths.push(getWalkingFramePath(basePath, dir, i));
      }
    }
    return paths;
  }, [basePath]);

  const walkTextures = useLoader(TextureLoader, walkPaths);

  const { gl } = useThree();

  // Build walk atlas once textures are loaded (32 frames → 8×4 grid)
  const walkAtlas = useMemo<SpriteAtlas>(
    () => buildAtlasFromTextures(walkTextures, 8),
    [walkTextures, gl],
  );

  // --- Attack atlas: async load, graceful 404 ---
  const attackAtlasRef = useRef<SpriteAtlas | null>(null);

  useEffect(() => {
    let cancelled = false;
    const paths: string[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      paths.push(getAttackFramePath(basePath, 'east', i));
    }
    buildAtlasFromUrls(paths, 8).then((atlas) => {
      if (!cancelled) attackAtlasRef.current = atlas;
    });
    return () => { cancelled = true; };
  }, [basePath]);

  // --- Animation loop ---
  const materialRef = useRef<MeshStandardMaterial>(null);
  const meshRef = useRef<Mesh>(null);
  // Track which atlas is currently bound to avoid unnecessary swaps
  const currentAtlasRef = useRef<'walk' | 'attack'>('walk');

  useFrame((_, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    const anim = animStateRef.current;
    const dir = directionRef.current;

    // Reset frame counter on anim state change
    if (anim !== prevAnimRef.current) {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
      prevAnimRef.current = anim;
    }

    const isAttacking = (anim === 'attacking' || anim === 'skill') && attackAtlasRef.current;

    if (isAttacking) {
      const atlas = attackAtlasRef.current!;
      // Swap to attack atlas if not already bound (rare — only on state change)
      if (currentAtlasRef.current !== 'attack') {
        materialRef.current.map = atlas.texture;
        currentAtlasRef.current = 'attack';
      }
      elapsedRef.current += delta;
      if (elapsedRef.current >= 1 / ATTACK_FPS) {
        elapsedRef.current -= 1 / ATTACK_FPS;
        frameIndexRef.current = (frameIndexRef.current + 1) % FRAME_COUNT;
      }
      // Select frame via UV offset — NO texture binding change!
      setAtlasFrame(atlas, frameIndexRef.current);
      // Mirror for west direction
      meshRef.current.scale.x = dir === 'west' ? -size[0] : size[0];
    } else {
      // Swap to walk atlas if not already bound
      if (currentAtlasRef.current !== 'walk') {
        materialRef.current.map = walkAtlas.texture;
        currentAtlasRef.current = 'walk';
      }

      if (anim === 'walking') {
        elapsedRef.current += delta;
        if (elapsedRef.current >= 1 / WALK_FPS) {
          elapsedRef.current -= 1 / WALK_FPS;
          frameIndexRef.current = (frameIndexRef.current + 1) % FRAME_COUNT;
        }
      } else {
        frameIndexRef.current = 0;
        elapsedRef.current = 0;
      }
      // Select frame via UV offset — NO texture binding change!
      const frameIdx = DIR_OFFSET[dir] + frameIndexRef.current;
      setAtlasFrame(walkAtlas, frameIdx);
      meshRef.current.scale.x = size[0];
    }

    // --- Hit Flash ---
    if (hitTimeRef) {
      if (performance.now() - hitTimeRef.current < 100) {
        materialRef.current.color.setRGB(10, 10, 10);
      } else {
        materialRef.current.color.setRGB(1, 1, 1);
      }
    }
  });

  return (
    <mesh ref={meshRef} scale={[size[0], size[1], 1]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        ref={materialRef}
        map={walkAtlas.texture}
        transparent
        alphaTest={0.1}
      />
    </mesh>
  );
}
