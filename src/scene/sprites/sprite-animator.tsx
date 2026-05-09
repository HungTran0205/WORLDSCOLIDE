/**
 * Guild hall sprite animator — uses sprite atlas for zero texture binding cost.
 * Walk atlas: 4 dirs × 8 frames = 32 frames in 8-col grid.
 * Animation selects frames via UV offset (no material.map swap, no needsUpdate).
 * MeshStandardMaterial so guild hall torches and ambient light affect sprites.
 *
 * NOTE (2026-05-09): Uses texture.offset/repeat for UV animation (setAtlasFrame).
 * WebGPU NodeMaterial may not propagate UV updates reliably for multi-instance
 * same-pipeline materials — symptom is "only 1 sprite animates, others freeze".
 * Hidden here because guild hall typically has 1-2 instances per spriteId. If a
 * scene with N≥3 matching sprites is added, port the uniform UV pattern from
 * `src/scene/combat/idle-sprite-material.ts` (combat panel had this exact bug
 * fixed by switching to uniform-driven UV — see plan 260509-0827).
 */

import { useRef, useMemo } from 'react';
import { useLoader, useFrame, useThree } from '@react-three/fiber';
import { TextureLoader, NearestFilter, SRGBColorSpace } from 'three';
import type { MutableRefObject } from 'react';
import type { MeshStandardMaterial } from 'three';
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
  const materialRef = useRef<MeshStandardMaterial>(null);

  /* Build atlas from loaded textures (same load as before, but packed once) */
  const allPaths = useMemo(() => {
    const p: string[] = [];
    for (const dir of DIRECTIONS) {
      for (let i = 0; i < FRAME_COUNT; i++) p.push(getWalkingFramePath(basePath, dir, i));
    }
    return p;
  }, [basePath]);

  const allTextures = useLoader(TextureLoader, allPaths);

  const { gl } = useThree();

  const atlas = useMemo<SpriteAtlas>(() => {
    for (const t of allTextures) {
      t.magFilter = NearestFilter;
      t.minFilter = NearestFilter;
      t.colorSpace = SRGBColorSpace;
    }
    return buildAtlasFromTextures(allTextures, FRAME_COUNT);
  }, [allTextures, gl]);

  /* Animation loop — only updates UV uniforms, no texture swap */
  useFrame((_, rawDelta) => {
    if (!materialRef.current) return;
    // Clamp to prevent frame-bunching after initial load freeze or tab resume
    const delta = Math.min(rawDelta, 0.1);

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
      <meshStandardMaterial ref={materialRef} map={atlas.texture} transparent alphaTest={0.1} roughness={1} metalness={0} />
    </mesh>
  );
}
