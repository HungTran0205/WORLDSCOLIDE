/**
 * Sprite animation component — loads walking frame PNGs and cycles through them
 * based on movement direction. Uses Billboard for camera-facing display.
 *
 * Textures use NearestFilter for crisp pixel art rendering.
 * Three.js caches textures by URL, so same archetype+gender share texture refs.
 *
 * Accepts MutableRefObjects for direction/isMoving to avoid stale-prop issues
 * (MemberSprite never re-renders, so plain props would be permanently baked).
 */

import { useRef, useMemo, useEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, NearestFilter, SRGBColorSpace, MeshBasicMaterial } from 'three';
import type { MutableRefObject } from 'react';
import type { SpriteDirection } from './sprite-path-resolver';
import { getWalkingFramePath } from './sprite-path-resolver';

const DIRECTIONS: SpriteDirection[] = ['north', 'south', 'east', 'west'];
const FRAME_COUNT = 8;
const ANIMATION_FPS = 10;

/** Direction → start index in the flat textures array */
const DIR_OFFSET: Record<SpriteDirection, number> = {
  north: 0,
  south: FRAME_COUNT,
  east: FRAME_COUNT * 2,
  west: FRAME_COUNT * 3,
};

interface SpriteAnimatorProps {
  basePath: string;
  directionRef: MutableRefObject<SpriteDirection>;
  isMovingRef: MutableRefObject<boolean>;
  size?: [number, number];
}

/**
 * Animated sprite mesh — displays walking animation frames as a textured plane.
 * Must be wrapped in <Suspense> (already done in world.tsx).
 */
export function SpriteAnimator({
  basePath,
  directionRef,
  isMovingRef,
  size = [2.1, 2.1],
}: SpriteAnimatorProps) {
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);

  // Build all 32 texture paths (4 dirs × 8 frames) in stable order
  const allPaths = useMemo(() => {
    const paths: string[] = [];
    for (const dir of DIRECTIONS) {
      for (let i = 0; i < FRAME_COUNT; i++) {
        paths.push(getWalkingFramePath(basePath, dir, i));
      }
    }
    return paths;
  }, [basePath]);

  // Batch-load all textures (Suspense handles async)
  const allTextures = useLoader(TextureLoader, allPaths);

  // Apply pixel art settings to each texture once on load
  useEffect(() => {
    for (const tex of allTextures) {
      tex.magFilter = NearestFilter;
      tex.minFilter = NearestFilter;
      tex.colorSpace = SRGBColorSpace;
    }
  }, [allTextures]);

  // Cycle animation frames via useFrame (no React re-renders)
  const materialRef = useRef<MeshBasicMaterial>(null);

  useFrame((_, delta) => {
    if (!materialRef.current) return;

    if (isMovingRef.current) {
      elapsedRef.current += delta;
      if (elapsedRef.current >= 1 / ANIMATION_FPS) {
        elapsedRef.current -= 1 / ANIMATION_FPS; // subtract instead of reset to avoid drift
        frameIndexRef.current = (frameIndexRef.current + 1) % FRAME_COUNT;
      }
    } else {
      // Idle: reset to frame 0
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
    }

    const texIndex = DIR_OFFSET[directionRef.current] + frameIndexRef.current;
    const tex = allTextures[texIndex];
    if (tex && materialRef.current.map !== tex) {
      materialRef.current.map = tex;
      materialRef.current.needsUpdate = true;
    }
  });

  // Initial texture: south frame 0 (idle default)
  const initialTex = allTextures[DIR_OFFSET.south];

  return (
    <mesh>
      <planeGeometry args={size} />
      <meshBasicMaterial
        ref={materialRef}
        map={initialTex}
        transparent
        alphaTest={0.1}
      />
    </mesh>
  );
}
