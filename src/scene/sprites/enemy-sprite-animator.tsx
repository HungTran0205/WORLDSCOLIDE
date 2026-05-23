/**
 * Sprite animator for enemies — uses sprite atlas for zero texture binding
 * overhead. Phase 3: loads ONE pre-packed sheet PNG per animation state
 * (walk/attack/death) via useLoader (single URL string). Geometry (cols, rows,
 * frameCount) comes from SPRITE_SHEET_MANIFEST via getSheetEntry.
 *
 * Graceful-missing: if getSheetEntry returns undefined for attack or death,
 * those atlases stay null — mirroring the previous buildAtlasFromUrls→null
 * behavior. Walk sheet is assumed always present (loaded via useLoader which
 * throws on 404 → caught by parent Suspense).
 *
 * Direction rows derived from manifest dirRows via indexOf — no hardcoded maps.
 * Enemies are single-direction (west); row index is always dirRows.indexOf('west').
 */

import { useRef, useMemo, useEffect } from 'react';
import { useLoader, useFrame, useThree } from '@react-three/fiber';
import { TextureLoader, MeshStandardMaterial, Mesh } from 'three';
import type { MutableRefObject } from 'react';
import { buildAtlasFromSheet, setAtlasFrame } from './sprite-atlas';
import type { SpriteAtlas } from './sprite-atlas';
import { getSheetEntry } from './sprite-sheet-manifest';
import { assetUrl } from '@/lib/asset-url';

const WALK_FPS = 10;
const ATTACK_FPS = 12;
const DEATH_FPS = 8;

export type EnemyAnimState = 'idle' | 'walking' | 'attacking' | 'skill' | 'hit' | 'dead';

interface EnemySpriteAnimatorProps {
  spriteId: string;
  animStateRef: MutableRefObject<EnemyAnimState>;
  facingRight: boolean;
  size?: [number, number];
}

/** Resolve sheet path + row + frameCount for one enemy animation from the manifest.
 *  Returns null if the sheet manifest has no entry (graceful-missing). */
function resolveEnemySheet(
  spriteId: string,
  anim: string,
): { sheetPath: string; row: number; frameCount: number } | null {
  const entityKey = `enemies/${spriteId}`;
  const entry = getSheetEntry(entityKey, anim);
  if (!entry) return null;
  // All enemy sheets are single-direction (west); fallback to row 0 if key absent.
  const dir = entry.dirRows.includes('west') ? 'west' : entry.dirRows[0];
  const row = entry.dirRows.indexOf(dir);
  const fc = entry.frameCounts[dir] ?? entry.cols;
  return { sheetPath: assetUrl(entry.path), row, frameCount: fc };
}

export function EnemySpriteAnimator({
  spriteId,
  animStateRef,
  facingRight,
  size = [2.1, 2.1],
}: EnemySpriteAnimatorProps) {
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const prevAnimRef = useRef<EnemyAnimState>('idle');

  // --- Walk sheet (always present — useLoader throws on 404, parent Suspense catches) ---
  const walkMeta = useMemo(() => resolveEnemySheet(spriteId, 'walk'), [spriteId]);
  const walkSheetPath = useMemo(() => {
    if (walkMeta) return walkMeta.sheetPath;
    // Fallback: best-effort path so useLoader doesn't receive undefined
    return assetUrl(`/sprites/enemies/${spriteId}/animations/walk.png`);
  }, [walkMeta, spriteId]);

  const walkSheetTexture = useLoader(TextureLoader, walkSheetPath);
  const { gl } = useThree();

  const walkAtlas = useMemo<SpriteAtlas>(() => {
    const meta = walkMeta ?? { row: 0, frameCount: 8 };
    // Walk sheets are single-row — atlasIdx = row*cols + frame. Since row≥0 and
    // cols matches the sheet, we build the atlas over the full sheet grid and let
    // setAtlasFrame index into the correct row naturally.
    const entry = getSheetEntry(`enemies/${spriteId}`, 'walk');
    const cols = entry?.cols ?? 8;
    const rows = entry?.rows ?? 1;
    return buildAtlasFromSheet(walkSheetTexture, cols, rows, meta.frameCount);
  }, [walkSheetTexture, walkMeta, spriteId, gl]);

  // --- Attack atlas (async, graceful 404) ---
  const attackAtlasRef = useRef<SpriteAtlas | null>(null);
  useEffect(() => {
    let cancelled = false;
    const meta = resolveEnemySheet(spriteId, 'attack');
    if (!meta) {
      attackAtlasRef.current = null;
      return;
    }
    const entry = getSheetEntry(`enemies/${spriteId}`, 'attack');
    if (!entry) { attackAtlasRef.current = null; return; }
    const loader = new TextureLoader();
    loader.load(
      meta.sheetPath,
      (tex) => {
        if (cancelled) return;
        attackAtlasRef.current = buildAtlasFromSheet(tex, entry.cols, entry.rows, meta.frameCount);
      },
      undefined,
      () => { if (!cancelled) attackAtlasRef.current = null; },
    );
    return () => { cancelled = true; };
  }, [spriteId]);

  // --- Death atlas (async, graceful 404) ---
  const deathAtlasRef = useRef<SpriteAtlas | null>(null);
  useEffect(() => {
    let cancelled = false;
    const meta = resolveEnemySheet(spriteId, 'death');
    if (!meta) {
      deathAtlasRef.current = null;
      return;
    }
    const entry = getSheetEntry(`enemies/${spriteId}`, 'death');
    if (!entry) return;
    const loader = new TextureLoader();
    loader.load(
      meta.sheetPath,
      (tex) => {
        if (cancelled) return;
        deathAtlasRef.current = buildAtlasFromSheet(tex, entry.cols, entry.rows, meta.frameCount);
      },
      undefined,
      () => { if (!cancelled) deathAtlasRef.current = null; },
    );
    return () => { cancelled = true; };
  }, [spriteId]);

  // --- Animation loop ---
  const materialRef = useRef<MeshStandardMaterial>(null);
  const meshRef = useRef<Mesh>(null);
  const deathFrozenRef = useRef(false);
  const currentAtlasRef = useRef<'walk' | 'attack' | 'death'>('walk');

  useFrame((_, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    const anim = animStateRef.current;

    // Reset frame on anim state change
    if (anim !== prevAnimRef.current) {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
      deathFrozenRef.current = false;
      prevAnimRef.current = anim;
    }

    // Mirror for east (enemy sprites are west-facing)
    meshRef.current.scale.x = facingRight ? -size[0] : size[0];

    // Walk atlas row offset: if walk sheet has multiple rows, offset by row index
    const walkRow = walkMeta?.row ?? 0;
    const walkCols = walkAtlas.cols;

    // --- Death ---
    if (anim === 'dead' && deathAtlasRef.current) {
      const atlas = deathAtlasRef.current;
      if (currentAtlasRef.current !== 'death') {
        materialRef.current.map = atlas.texture;
        currentAtlasRef.current = 'death';
      }
      if (!deathFrozenRef.current) {
        elapsedRef.current += delta;
        if (elapsedRef.current >= 1 / DEATH_FPS) {
          elapsedRef.current -= 1 / DEATH_FPS;
          frameIndexRef.current++;
          if (frameIndexRef.current >= atlas.frameCount) {
            frameIndexRef.current = atlas.frameCount - 1;
            deathFrozenRef.current = true;
          }
        }
      }
      // Death sheets may be multi-row (e.g. bandit death has east+west rows)
      const deathMeta = resolveEnemySheet(spriteId, 'death');
      const deathRow = deathMeta?.row ?? 0;
      setAtlasFrame(atlas, deathRow * atlas.cols + frameIndexRef.current);
      return;
    }

    // --- Attack ---
    if ((anim === 'attacking' || anim === 'skill') && attackAtlasRef.current) {
      const atlas = attackAtlasRef.current;
      if (currentAtlasRef.current !== 'attack') {
        materialRef.current.map = atlas.texture;
        currentAtlasRef.current = 'attack';
      }
      elapsedRef.current += delta;
      if (elapsedRef.current >= 1 / ATTACK_FPS) {
        elapsedRef.current -= 1 / ATTACK_FPS;
        frameIndexRef.current = (frameIndexRef.current + 1) % atlas.frameCount;
      }
      const attackMeta = resolveEnemySheet(spriteId, 'attack');
      const attackRow = attackMeta?.row ?? 0;
      setAtlasFrame(atlas, attackRow * atlas.cols + frameIndexRef.current);
      return;
    }

    // --- Walk / Idle ---
    if (currentAtlasRef.current !== 'walk') {
      materialRef.current.map = walkAtlas.texture;
      currentAtlasRef.current = 'walk';
    }
    if (anim === 'walking') {
      elapsedRef.current += delta;
      if (elapsedRef.current >= 1 / WALK_FPS) {
        elapsedRef.current -= 1 / WALK_FPS;
        frameIndexRef.current = (frameIndexRef.current + 1) % walkAtlas.frameCount;
      }
    } else {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
    }
    setAtlasFrame(walkAtlas, walkRow * walkCols + frameIndexRef.current);
  });

  const scaleX = facingRight ? -size[0] : size[0];

  return (
    <mesh ref={meshRef} scale={[scaleX, size[1], 1]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        ref={materialRef}
        map={walkAtlas.texture}
        transparent
        alphaTest={0.1}
      />
    </mesh>
  );
}
