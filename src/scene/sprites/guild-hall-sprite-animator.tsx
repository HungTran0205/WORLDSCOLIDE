/**
 * Guild hall member sprite animator — east/west walking + south-facing idle.
 *
 * Phase 3: loads ONE pre-packed walking sheet PNG (same 4-dir sheet as
 * SpriteAnimator). Direction rows derived from manifest dirRows via indexOf —
 * no hardcoded DIR_ROW map. Idle is driven from the walk sheet's south row
 * frame 0, eliminating the separate idle texture load.
 *
 * The walk plane and idle plane share the atlas GPU texture but each has its
 * own MeshStandardMaterial instance so their UV offset/repeat states don't
 * interfere. useFrame locks the idle material's UV every frame while stopped
 * to guard against any drift (setAtlasFrame mutates atlas.texture.offset which
 * is shared across materials referencing the same texture object).
 *
 * Walk/idle toggled imperatively via mesh.visible to avoid per-frame re-renders.
 *
 * NOTE (2026-05-09): texture.offset/repeat UV animation has known multi-instance
 * WebGPU freeze (only 1 sprite per pipeline batch animates). Hidden at typical
 * guild hall occupancy (1-2 per spriteId). For N≥3, port to uniform-UV pattern —
 * see idle-sprite-material.ts.
 */

import { useRef, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, MeshStandardMaterial } from 'three';
import type { MutableRefObject } from 'react';
import type { Mesh } from 'three';
import type { HorizontalDirection } from './sprite-path-resolver';
import { getEntityKeyFromBasePath } from './sprite-path-resolver';
import { buildAtlasFromSheet, setAtlasFrame, getAtlasFrameUv } from './sprite-atlas';
import type { SpriteAtlas } from './sprite-atlas';
import { getSheetEntry } from './sprite-sheet-manifest';
import { assetUrl } from '@/lib/asset-url';

const ANIMATION_FPS = 10;
const WALK_ANIM = 'walking-8-frames';

interface GuildHallSpriteAnimatorProps {
  basePath: string;
  directionRef: MutableRefObject<HorizontalDirection>;
  isMovingRef: MutableRefObject<boolean>;
  size?: [number, number];
}

export function GuildHallSpriteAnimator({
  basePath,
  directionRef,
  isMovingRef,
  size = [2.1, 2.1],
}: GuildHallSpriteAnimatorProps) {
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const walkMeshRef = useRef<Mesh>(null);
  const idleMeshRef = useRef<Mesh>(null);
  // Separate material refs so we can address idle UV independently
  const walkMatRef = useRef<MeshStandardMaterial>(null);
  const idleMatRef = useRef<MeshStandardMaterial>(null);

  // Resolve sheet geometry from manifest once per basePath
  const { sheetPath, cols, rows, dirRows, frameCounts } = useMemo(() => {
    const entityKey = getEntityKeyFromBasePath(basePath);
    const entry = getSheetEntry(entityKey, WALK_ANIM);
    if (!entry) {
      console.warn(`GuildHallSpriteAnimator: no manifest entry for ${entityKey}/${WALK_ANIM}`);
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

  // Single sheet load — one PNG for all 4 dirs (Three.js cache hit if SpriteAnimator
  // already loaded the same path for this character in this scene).
  const sheetTexture = useLoader(TextureLoader, sheetPath);

  const atlas = useMemo<SpriteAtlas>(
    () => buildAtlasFromSheet(sheetTexture, cols, rows, cols * rows),
    [sheetTexture, cols, rows],
  );

  // South-row frame-0 UV — used to pin the idle material every frame
  const idleFrameIdx = useMemo(() => {
    const southRow = dirRows.indexOf('south');
    return (southRow >= 0 ? southRow : 0) * cols + 0;
  }, [dirRows, cols]);

  useFrame((_, rawDelta) => {
    const moving = isMovingRef.current;
    if (walkMeshRef.current) walkMeshRef.current.visible = moving;
    if (idleMeshRef.current) idleMeshRef.current.visible = !moving;

    if (!moving) {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
      // Pin idle material UV to south-row frame 0 every frame so walk UV drift
      // (setAtlasFrame mutates atlas.texture.offset shared across materials) is
      // immediately corrected for any frame the idle mesh becomes visible.
      if (idleMatRef.current?.map) {
        const uv = getAtlasFrameUv(atlas, idleFrameIdx);
        idleMatRef.current.map.offset.set(uv.u, uv.v);
        idleMatRef.current.map.repeat.set(uv.w, uv.h);
        idleMatRef.current.map.updateMatrix();
      }
      return;
    }

    const delta = Math.min(rawDelta, 0.1);
    const dir = directionRef.current;
    const frameCount = frameCounts[dir] ?? cols;

    elapsedRef.current += delta;
    if (elapsedRef.current >= 1 / ANIMATION_FPS) {
      elapsedRef.current -= 1 / ANIMATION_FPS;
      frameIndexRef.current = (frameIndexRef.current + 1) % frameCount;
    }

    // Row derived from manifest dirRows via indexOf — never a hardcoded map
    const row = dirRows.indexOf(dir);
    setAtlasFrame(atlas, (row >= 0 ? row : 0) * cols + frameIndexRef.current);

    // Walk material picks up the updated atlas.texture.offset automatically
    // (same texture object). Idle material is invisible during walk — its UV
    // will be re-pinned next idle frame.
  });

  return (
    <>
      {/* Walk plane — shown while moving. Starts hidden; members spawn idle. */}
      <mesh ref={walkMeshRef} visible={false}>
        <planeGeometry args={size} />
        <meshStandardMaterial
          ref={walkMatRef}
          map={atlas.texture}
          transparent
          alphaTest={0.1}
          roughness={1}
          metalness={0}
        />
      </mesh>
      {/* Idle plane — south row frame 0 from the shared walk sheet.
          Separate material instance so its UV state is set independently in useFrame. */}
      <mesh ref={idleMeshRef}>
        <planeGeometry args={size} />
        <meshStandardMaterial
          ref={idleMatRef}
          map={atlas.texture}
          transparent
          alphaTest={0.1}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </>
  );
}
