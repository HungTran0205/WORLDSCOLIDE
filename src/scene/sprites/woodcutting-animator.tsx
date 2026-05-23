/**
 * Woodcutting sprite animator — plays woodcutting-8-frames/east in a loop.
 * Phase 3: loads ONE pre-packed sheet PNG via TextureLoader (single URL),
 * wraps it with buildAtlasFromSheet. Geometry (cols/rows/frameCount) comes
 * from SPRITE_SHEET_MANIFEST via getSheetEntry.
 *
 * NOTE (2026-05-09): texture.offset/repeat UV pattern has known multi-instance
 * issue under WebGPU (only 1 sprite animates per pipeline cache batch). Guild
 * hall scenes only render 1-2 woodcutters at a time so symptom is hidden. If
 * a scene needs ≥3 woodcutters of same spriteId, port to uniform-UV pattern —
 * see `src/scene/combat/idle-sprite-material.ts`.
 */

import { useRef, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import type { MeshStandardMaterial } from 'three';
import { buildAtlasFromSheet, setAtlasFrame } from './sprite-atlas';
import { getSheetEntry } from './sprite-sheet-manifest';
import { getEntityKeyFromBasePath } from './sprite-path-resolver';
import { assetUrl } from '@/lib/asset-url';

const ANIMATION_FPS = 8;
/** Animation name used for manifest look-up (single direction: east). */
const ANIM_NAME = 'woodcutting-8-frames';

interface WoodcuttingAnimatorProps {
  basePath: string;
  size?: [number, number];
}

/** Animates the woodcutting-8-frames sheet in a continuous loop. */
export function WoodcuttingAnimator({ basePath, size = [2.1, 2.1] }: WoodcuttingAnimatorProps) {
  const frameIndexRef = useRef(0);
  const materialRef = useRef<MeshStandardMaterial>(null);

  // Resolve sheet geometry from manifest
  const { sheetPath, cols, rows, frameCount } = useMemo(() => {
    const entityKey = getEntityKeyFromBasePath(basePath);
    const entry = getSheetEntry(entityKey, ANIM_NAME);
    if (!entry) {
      // Fallback geometry (first direction, 8 frames) — sheet must still exist on disk
      console.warn(`WoodcuttingAnimator: no manifest entry for ${entityKey}/${ANIM_NAME}`);
      return { sheetPath: assetUrl(`${basePath}/animations/${ANIM_NAME}.png`), cols: 8, rows: 1, frameCount: 8 };
    }
    // Single-row sheet; 'east' is the only direction
    const fc = entry.frameCounts[entry.dirRows[0]] ?? entry.cols;
    return { sheetPath: assetUrl(entry.path), cols: entry.cols, rows: entry.rows, frameCount: fc };
  }, [basePath]);

  // Single texture load — one PNG, not N frames
  const sheetTexture = useLoader(TextureLoader, sheetPath);

  const atlas = useMemo(
    () => buildAtlasFromSheet(sheetTexture, cols, rows, frameCount),
    [sheetTexture, cols, rows, frameCount],
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    const totalDuration = frameCount / ANIMATION_FPS;
    const t = state.clock.elapsedTime % totalDuration;
    const frameIndex = Math.floor(t * ANIMATION_FPS) % frameCount;
    frameIndexRef.current = frameIndex;
    setAtlasFrame(atlas, frameIndex);
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
