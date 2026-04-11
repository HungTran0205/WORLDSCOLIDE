/**
 * Woodcutting sprite animator — plays woodcutting-8-frames/east in a loop.
 * Only east direction supported (the only direction currently provided).
 * Uses same atlas approach as SpriteAnimator for zero texture-binding overhead.
 */

import { useRef, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, NearestFilter, SRGBColorSpace } from 'three';
import type { MeshStandardMaterial } from 'three';
import { buildAtlasFromTextures, setAtlasFrame } from './sprite-atlas';

const FRAME_COUNT = 8;
const ANIMATION_FPS = 6;

interface WoodcuttingAnimatorProps {
  basePath: string;
  size?: [number, number];
}

/** Animates the woodcutting-8-frames/east sprite atlas in a continuous loop */
export function WoodcuttingAnimator({ basePath, size = [2.1, 2.1] }: WoodcuttingAnimatorProps) {
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
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

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    elapsedRef.current += delta;
    if (elapsedRef.current >= 1 / ANIMATION_FPS) {
      elapsedRef.current -= 1 / ANIMATION_FPS;
      frameIndexRef.current = (frameIndexRef.current + 1) % FRAME_COUNT;
    }
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
