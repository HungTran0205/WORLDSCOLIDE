/**
 * Guild hall sprite animator — uses sprite atlas for zero texture binding cost.
 * Walk atlas: 4 dirs × 8 frames = 32 frames in 8-col grid.
 * Animation selects frames via UV offset (no material.map swap, no needsUpdate).
 */

import { useRef, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, NearestFilter, SRGBColorSpace } from 'three';
import type { MutableRefObject } from 'react';
import type { MeshBasicMaterial } from 'three';
import type { SpriteDirection } from './sprite-path-resolver';
import { getWalkingFramePath } from './sprite-path-resolver';
import { buildAtlasFromTextures, setAtlasFrame } from './sprite-atlas';
import type { SpriteAtlas } from './sprite-atlas';

const DIRECTIONS: SpriteDirection[] = ['north', 'south', 'east', 'west'];
const FRAME_COUNT = 8;
const ANIMATION_FPS = 10;

/** Direction → row in the atlas (8-col × 4-row grid) */
const DIR_ROW: Record<SpriteDirection, number> = { north: 0, south: 1, east: 2, west: 3 };

interface SpriteAnimatorProps {
  basePath: string;
  directionRef: MutableRefObject<SpriteDirection>;
  isMovingRef: MutableRefObject<boolean>;
  size?: [number, number];
}

export function SpriteAnimator({ basePath, directionRef, isMovingRef, size = [2.1, 2.1] }: SpriteAnimatorProps) {
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const materialRef = useRef<MeshBasicMaterial>(null);

  /* Build atlas from loaded textures (same load as before, but packed once) */
  const allPaths = useMemo(() => {
    const p: string[] = [];
    for (const dir of DIRECTIONS) {
      for (let i = 0; i < FRAME_COUNT; i++) p.push(getWalkingFramePath(basePath, dir, i));
    }
    return p;
  }, [basePath]);

  const allTextures = useLoader(TextureLoader, allPaths);

  const atlas = useMemo<SpriteAtlas>(() => {
    for (const t of allTextures) {
      t.magFilter = NearestFilter;
      t.minFilter = NearestFilter;
      t.colorSpace = SRGBColorSpace;
    }
    return buildAtlasFromTextures(allTextures, FRAME_COUNT);
  }, [allTextures]);

  /* Animation loop — only updates UV uniforms, no texture swap */
  useFrame((_, delta) => {
    if (!materialRef.current) return;

    if (isMovingRef.current) {
      elapsedRef.current += delta;
      if (elapsedRef.current >= 1 / ANIMATION_FPS) {
        elapsedRef.current -= 1 / ANIMATION_FPS;
        frameIndexRef.current = (frameIndexRef.current + 1) % FRAME_COUNT;
      }
    } else {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
    }

    const atlasIdx = DIR_ROW[directionRef.current] * FRAME_COUNT + frameIndexRef.current;
    setAtlasFrame(atlas, atlasIdx);
  });

  return (
    <mesh>
      <planeGeometry args={size} />
      <meshBasicMaterial ref={materialRef} map={atlas.texture} transparent alphaTest={0.1} />
    </mesh>
  );
}
