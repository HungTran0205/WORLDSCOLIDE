/**
 * Guild hall sprite animator — uses sprite atlas for zero texture binding cost.
 * Phase 3: loads ONE pre-packed walking sheet PNG via TextureLoader (single URL).
 * Direction row derived from manifest dirRows via indexOf — no hardcoded DIR_ROW map.
 * Animation selects frames via UV offset (setAtlasFrame); no material.map swap.
 *
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
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import type { MutableRefObject } from 'react';
import type { MeshStandardMaterial } from 'three';
import type { SpriteDirection } from './sprite-path-resolver';
import { getEntityKeyFromBasePath } from './sprite-path-resolver';
import { buildAtlasFromSheet, setAtlasFrame } from './sprite-atlas';
import type { SpriteAtlas } from './sprite-atlas';
import { getSheetEntry } from './sprite-sheet-manifest';
import { assetUrl } from '@/lib/asset-url';

const ANIMATION_FPS = 10;
const WALK_ANIM = 'walking-8-frames';

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

  // Resolve sheet geometry from manifest once per basePath
  const { sheetPath, cols, rows, dirRows, frameCounts } = useMemo(() => {
    const entityKey = getEntityKeyFromBasePath(basePath);
    const entry = getSheetEntry(entityKey, WALK_ANIM);
    if (!entry) {
      console.warn(`SpriteAnimator: no manifest entry for ${entityKey}/${WALK_ANIM}`);
      // Fallback: assume 8-col × 4-row, directions north/south/east/west
      return {
        sheetPath: assetUrl(`${basePath}/animations/${WALK_ANIM}.png`),
        cols: 8, rows: 4,
        dirRows: ['north', 'south', 'east', 'west'],
        frameCounts: { north: 8, south: 8, east: 8, west: 8 } as Record<string, number>,
      };
    }
    return {
      sheetPath: assetUrl(entry.path),
      cols: entry.cols,
      rows: entry.rows,
      dirRows: entry.dirRows,
      frameCounts: entry.frameCounts,
    };
  }, [basePath]);

  // Single sheet load — one PNG for all 4 directions
  const sheetTexture = useLoader(TextureLoader, sheetPath);

  const atlas = useMemo<SpriteAtlas>(
    () => buildAtlasFromSheet(sheetTexture, cols, rows, cols * rows),
    [sheetTexture, cols, rows],
  );

  /* Animation loop — only updates UV uniforms, no texture swap */
  useFrame((_, rawDelta) => {
    if (!materialRef.current) return;
    const delta = Math.min(rawDelta, 0.1);

    const dir = directionRef.current;
    const frameCount = frameCounts[dir] ?? cols;

    if (isMovingRef.current) {
      elapsedRef.current += delta;
      if (elapsedRef.current >= 1 / ANIMATION_FPS) {
        elapsedRef.current -= 1 / ANIMATION_FPS;
        frameIndexRef.current = (frameIndexRef.current + 1) % frameCount;
      }
    } else {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
    }

    // Row derived from manifest dirRows — never a hardcoded local map
    const row = dirRows.indexOf(dir);
    const atlasIdx = (row >= 0 ? row : 0) * cols + frameIndexRef.current;
    setAtlasFrame(atlas, atlasIdx);
  });

  return (
    <mesh>
      <planeGeometry args={size} />
      <meshStandardMaterial ref={materialRef} map={atlas.texture} transparent alphaTest={0.1} roughness={1} metalness={0} />
    </mesh>
  );
}
