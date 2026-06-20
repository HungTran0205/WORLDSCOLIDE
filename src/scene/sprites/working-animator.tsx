/**
 * Looped sprite animator for stationary task animations (e.g. `working/`,
 * `blacksmith/`). Phase 3: loads ONE pre-packed sheet PNG via TextureLoader
 * (single URL), wraps it with buildAtlasFromSheet. Geometry comes from
 * SPRITE_SHEET_MANIFEST. Falls back to a hardcoded 8×1 guess when no manifest
 * entry exists (sheet must still be on disk).
 *
 * NOTE (2026-05-09): texture.offset/repeat UV pattern has known multi-instance
 * issue under WebGPU (only 1 sprite animates per pipeline cache batch). Guild
 * hall scenes only render 1-2 crafters at a time so symptom is hidden. If a
 * scene needs ≥3 crafters of same spriteId, port to uniform-UV pattern —
 * see `src/scene/combat/idle-sprite-material.ts`.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import type { MeshStandardMaterial } from 'three';
import { buildAtlasFromSheet, setAtlasFrame } from './sprite-atlas';
import { getSheetEntry } from './sprite-sheet-manifest';
import { getEntityKeyFromBasePath } from './sprite-path-resolver';
import { assetUrl } from '@/lib/asset-url';

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

  // Resolve sheet geometry from manifest
  const { sheetPath, cols, rows, frameCount } = useMemo(() => {
    const entityKey = getEntityKeyFromBasePath(basePath);
    const entry = getSheetEntry(entityKey, animationName);
    if (!entry) {
      console.warn(`WorkingAnimator: no manifest entry for ${entityKey}/${animationName}`);
      return { sheetPath: assetUrl(`${basePath}/animations/${animationName}.png`), cols: 8, rows: 1, frameCount: 8 };
    }
    // Single-row sheets (working/blacksmith are always flat, one direction)
    const fc = entry.frameCounts[entry.dirRows[0]] ?? entry.cols;
    return { sheetPath: assetUrl(entry.path), cols: entry.cols, rows: entry.rows, frameCount: fc };
  }, [basePath, animationName]);

  // Single texture load — one PNG, not N frames
  const sheetTexture = useLoader(TextureLoader, sheetPath);

  const atlas = useMemo(
    () => buildAtlasFromSheet(sheetTexture, cols, rows, frameCount),
    [sheetTexture, cols, rows, frameCount],
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    const t = state.clock.elapsedTime % (frameCount / ANIMATION_FPS);
    const newIdx = Math.floor(t * ANIMATION_FPS) % frameCount;
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
