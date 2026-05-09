/**
 * Woodcutting sprite animator — plays woodcutting-8-frames/east in a loop.
 * Only east direction supported (the only direction currently provided).
 * Uses same atlas approach as SpriteAnimator for zero texture-binding overhead.
 *
 * NOTE (2026-05-09): texture.offset/repeat UV pattern has known multi-instance
 * issue under WebGPU (only 1 sprite animates per pipeline cache batch). Guild
 * hall scenes only render 1-2 woodcutters at a time so symptom is hidden. If
 * a scene needs ≥3 woodcutters of same spriteId, port to uniform-UV pattern —
 * see `src/scene/combat/idle-sprite-material.ts`.
 */

import { useRef, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, NearestFilter, SRGBColorSpace } from 'three';
import type { MeshStandardMaterial } from 'three';
import { buildAtlasFromTextures, setAtlasFrame } from './sprite-atlas';

const FRAME_COUNT = 8;
const ANIMATION_FPS = 8;

interface WoodcuttingAnimatorProps {
  basePath: string;
  size?: [number, number];
}

/** Animates the woodcutting-8-frames/east sprite atlas in a continuous loop */
export function WoodcuttingAnimator({ basePath, size = [2.1, 2.1] }: WoodcuttingAnimatorProps) {
  const frameIndexRef = useRef(0);
  const materialRef = useRef<MeshStandardMaterial>(null);

  const paths = useMemo(() => {
    return Array.from({ length: FRAME_COUNT }, (_, i) => {
      const padded = String(i).padStart(3, '0');
      return `${basePath}/animations/woodcutting-8-frames/east/frame_${padded}.png`;
    });
  }, [basePath]);

  const textures = useLoader(TextureLoader, paths);

  const atlas = useMemo(() => {
    for (const t of textures) {
      t.magFilter = NearestFilter;
      t.minFilter = NearestFilter;
      t.colorSpace = SRGBColorSpace;
    }
    // Single-row atlas: 8 cols × 1 row
    return buildAtlasFromTextures(textures, FRAME_COUNT);
  }, [textures]);

  useFrame((state) => {
    if (!materialRef.current) return;
    // Use absolute clock time to avoid delta spike when frameloop="demand" resumes
    // after idle (large delta would otherwise cause catch-up speedup).
    const totalDuration = FRAME_COUNT / ANIMATION_FPS;
    const t = state.clock.elapsedTime % totalDuration;
    const frameIndex = Math.floor(t * ANIMATION_FPS) % FRAME_COUNT;
    frameIndexRef.current = frameIndex;
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
