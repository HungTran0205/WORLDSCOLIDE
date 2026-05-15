/**
 * Looped sprite animator for stationary task animations (e.g. `working/`,
 * `blacksmith/`). 8 frames, 8 FPS, east-facing only.
 *
 * Fallback: if texture load fails (e.g. archetype lacks this animation
 * folder), parent Suspense renders nothing.
 *
 * NOTE (2026-05-09): texture.offset/repeat UV pattern has known multi-instance
 * issue under WebGPU (only 1 sprite animates per pipeline cache batch). Guild
 * hall scenes only render 1-2 crafters at a time so symptom is hidden. If a
 * scene needs ≥3 crafters of same spriteId, port to uniform-UV pattern —
 * see `src/scene/combat/idle-sprite-material.ts`.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, NearestFilter, SRGBColorSpace } from 'three';
import type { MeshStandardMaterial } from 'three';
import { buildAtlasFromTextures, setAtlasFrame } from './sprite-atlas';

const FRAME_COUNT = 8;
const ANIMATION_FPS = 8;

interface WorkingAnimatorProps {
  basePath: string;
  size?: [number, number];
  /** Animation subdirectory under `${basePath}/animations/`. Default 'working'.
   *  Workshop slot 0 passes 'blacksmith' here. */
  animationName?: string;
  /** Fires exactly once per frame transition (idx changes). Lets the host
   *  trigger discrete events synced to the animation — e.g. blacksmith
   *  hammer spark on frame 3. Captured via ref so prop identity churn
   *  doesn't break the animation loop. */
  onFrame?: (frameIndex: number) => void;
}

export function WorkingAnimator({
  basePath,
  size = [2.1, 2.1],
  animationName = 'working',
  onFrame,
}: WorkingAnimatorProps) {
  const frameIndexRef = useRef(0);
  const prevFrameRef  = useRef(-1);
  const materialRef   = useRef<MeshStandardMaterial>(null);
  // Ref-pattern keeps the useFrame closure capturing the latest callback
  // without re-subscribing every render.
  const onFrameRef = useRef(onFrame);
  useEffect(() => { onFrameRef.current = onFrame; }, [onFrame]);

  const paths = useMemo(() => (
    Array.from({ length: FRAME_COUNT }, (_, i) => {
      const padded = String(i).padStart(3, '0');
      return `${basePath}/animations/${animationName}/frame_${padded}.png`;
    })
  ), [basePath, animationName]);

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
    const newIdx = Math.floor(t * ANIMATION_FPS) % FRAME_COUNT;
    if (prevFrameRef.current !== newIdx) {
      onFrameRef.current?.(newIdx);
      prevFrameRef.current = newIdx;
    }
    frameIndexRef.current = newIdx;
    setAtlasFrame(atlas, newIdx);
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
