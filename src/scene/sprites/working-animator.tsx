/**
 * Working/crafting sprite animator — plays the `working/` animation in a loop.
 * No direction subdirectory; east-facing frames are used for all placements.
 * Fallback: if texture load fails, parent Suspense renders nothing.
 *
 * NOTE (2026-05-09): texture.offset/repeat UV pattern has known multi-instance
 * issue under WebGPU (only 1 sprite animates per pipeline cache batch). Guild
 * hall scenes only render 1-2 crafters at a time so symptom is hidden. If a
 * scene needs ≥3 crafters of same spriteId, port to uniform-UV pattern —
 * see `src/scene/combat/idle-sprite-material.ts`.
 */

import { useRef, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, NearestFilter, SRGBColorSpace } from 'three';
import type { MeshStandardMaterial } from 'three';
import { buildAtlasFromTextures, setAtlasFrame } from './sprite-atlas';

const FRAME_COUNT = 8;
const ANIMATION_FPS = 8;

interface WorkingAnimatorProps {
  basePath: string;
  size?: [number, number];
}

export function WorkingAnimator({ basePath, size = [2.1, 2.1] }: WorkingAnimatorProps) {
  const frameIndexRef = useRef(0);
  const materialRef   = useRef<MeshStandardMaterial>(null);

  const paths = useMemo(() => (
    Array.from({ length: FRAME_COUNT }, (_, i) => {
      const padded = String(i).padStart(3, '0');
      return `${basePath}/animations/working/frame_${padded}.png`;
    })
  ), [basePath]);

  const textures = useLoader(TextureLoader, paths);

  const atlas = useMemo(() => {
    for (const t of textures) {
      t.magFilter = NearestFilter;
      t.minFilter = NearestFilter;
      t.colorSpace = SRGBColorSpace;
    }
    return buildAtlasFromTextures(textures, FRAME_COUNT);
  }, [textures]);

  useFrame((state) => {
    if (!materialRef.current) return;
    const t = state.clock.elapsedTime % (FRAME_COUNT / ANIMATION_FPS);
    frameIndexRef.current = Math.floor(t * ANIMATION_FPS) % FRAME_COUNT;
    setAtlasFrame(atlas, frameIndexRef.current);
    materialRef.current.map = atlas.texture;
    materialRef.current.needsUpdate = false;
  });

  return (
    <mesh>
      <planeGeometry args={size} />
      <meshStandardMaterial
        ref={materialRef}
        map={atlas.texture}
        transparent
        alphaTest={0.1}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}
