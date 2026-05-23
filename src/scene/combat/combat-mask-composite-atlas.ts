/**
 * Composite atlas builder — draws body animation frames with identity mask overlaid.
 *
 * Phase 3: accepts a sheet source {sheetTexture, cols, rows, row, frameCount}
 * instead of bodyTextures: Texture[]. Each body frame is sliced from the sheet
 * via canvas drawImage(sheet, srcX, srcY, frameW, frameH, 0, 0, frameW, frameH).
 *
 * One atlas per (charId × maskId × anim × row). Cache is module-level; dispose
 * on combat unmount via disposeCombatMaskCompositeAtlasCache() to avoid
 * accumulating CanvasTextures.
 *
 * Coordinate convention: top-left, matches canvas 2D and combat-mask-anchors.ts.
 */

import * as THREE from 'three';
import type { SpriteAtlas } from '../sprites/sprite-atlas';
import { resolveCombatMaskAnchor, type CombatMaskAnim } from './combat-mask-anchors';

/** Sheet-based source for composite atlas — replaces the old bodyTextures[] array. */
export interface SheetCompositeSource {
  /** Full pre-packed sheet texture (already loaded via useLoader/TextureLoader). */
  sheetTexture: THREE.Texture;
  /** Grid dimensions of the sheet (cols × rows). */
  cols: number;
  rows: number;
  /** Which row in the sheet holds this animation's frames. */
  row: number;
  /** Number of frames to composite (≤ cols). */
  frameCount: number;
}

export interface BuildCombatMaskAtlasArgs {
  charId: string;
  anim: CombatMaskAnim;
  maskId: string;
  /** Phase 3: sheet-based source replaces bodyTextures[]. */
  sheetSource: SheetCompositeSource;
  maskTexture: THREE.Texture;
}

const atlasCache = new Map<string, SpriteAtlas>();

// Version counter — increments on each per-char invalidation so components
// subscribed via useSyncExternalStore can re-evaluate their composite atlas memos.
let invalidationVersion = 0;
const invalidationListeners = new Set<() => void>();

export function subscribeToAtlasInvalidations(listener: () => void): () => void {
  invalidationListeners.add(listener);
  return () => { invalidationListeners.delete(listener); };
}

export function getAtlasInvalidationVersion(): number {
  return invalidationVersion;
}

function makeCacheKey(args: BuildCombatMaskAtlasArgs): string {
  const { charId, maskId, anim, sheetSource } = args;
  return `${charId}|${maskId}|${anim}|${sheetSource.row}|${sheetSource.frameCount}`;
}

/**
 * Build (or return cached) a composite SpriteAtlas with the identity mask drawn
 * over each body frame at its per-frame anchor position.
 *
 * Body frames are sliced from the pre-packed sheet via canvas drawImage — no
 * per-frame texture load needed. maskTexture must already be loaded.
 * Returned atlas is shared — do NOT dispose it per-sprite; use disposeCombatMaskCompositeAtlasCache().
 */
export function buildCombatMaskCompositeAtlas(args: BuildCombatMaskAtlasArgs): SpriteAtlas {
  const key = makeCacheKey(args);
  const cached = atlasCache.get(key);
  if (cached) return cached;

  const { charId, anim, sheetSource, maskTexture } = args;
  const { sheetTexture, cols, rows, row, frameCount } = sheetSource;

  if (frameCount === 0) {
    throw new Error('buildCombatMaskCompositeAtlas: frameCount must be > 0');
  }

  // Derive frame dimensions from the sheet's image (sheet is rows×cols grid).
  const sheetImg = sheetTexture.image as HTMLImageElement | HTMLCanvasElement;
  const sheetW = sheetImg.width || 128 * cols;
  const sheetH = sheetImg.height || 128 * rows;
  const frameW = Math.floor(sheetW / cols);
  const frameH = Math.floor(sheetH / rows);

  // Output atlas layout: frameCount cols × 1 row (one strip per animation).
  const atlasCols = frameCount;
  const atlasRows = 1;

  const canvas = document.createElement('canvas');
  canvas.width = atlasCols * frameW;
  canvas.height = atlasRows * frameH;
  const ctx = canvas.getContext('2d')!;
  // Pixel-art: no bilinear smoothing for body or mask
  ctx.imageSmoothingEnabled = false;

  const maskImg = maskTexture.image as HTMLImageElement | HTMLCanvasElement;

  for (let i = 0; i < frameCount; i++) {
    // Source cell in the sheet: (col, row) in sheet grid
    const srcCol = i % cols;
    // Frames within a row run left-to-right; row is fixed for this animation
    const srcX = srcCol * frameW;
    const srcY = row * frameH;

    const destX = i * frameW;
    const destY = 0;

    // Body: slice frame from the sheet
    ctx.drawImage(sheetImg, srcX, srcY, frameW, frameH, destX, destY, frameW, frameH);

    // Mask: drawn over body at per-frame anchor position
    const anchor = resolveCombatMaskAnchor(charId, anim, i);
    const drawX = destX + anchor.x - anchor.size / 2;
    const drawY = destY + anchor.y - anchor.size / 2;
    ctx.drawImage(maskImg, drawX, drawY, anchor.size, anchor.size);
  }

  const atlasTexture = new THREE.CanvasTexture(canvas);
  atlasTexture.magFilter = THREE.NearestFilter;
  atlasTexture.minFilter = THREE.NearestMipmapNearestFilter;
  atlasTexture.colorSpace = THREE.SRGBColorSpace;
  atlasTexture.generateMipmaps = true;

  // Set initial UV to frame 0
  atlasTexture.repeat.set(1 / atlasCols, 1 / atlasRows);
  atlasTexture.offset.set(0, 1 - 1 / atlasRows);

  const atlas: SpriteAtlas = { texture: atlasTexture, cols: atlasCols, rows: atlasRows, frameCount };
  atlasCache.set(key, atlas);
  return atlas;
}

/**
 * Dispose all cached composite atlases and clear the cache.
 * Wire this to the combat scene root unmount — not per-sprite — to prevent GPU texture leaks.
 */
export function disposeCombatMaskCompositeAtlasCache(): void {
  atlasCache.forEach((atlas) => atlas.texture.dispose());
  atlasCache.clear();
}

/**
 * Invalidate cached atlases for one character (used by dev tuner after anchor edits).
 * Disposes the GPU texture for each affected entry.
 */
export function invalidateCombatMaskCompositeByChar(charId: string): void {
  const toDelete: string[] = [];
  atlasCache.forEach((_, key) => {
    if (key.startsWith(`${charId}|`)) toDelete.push(key);
  });
  toDelete.forEach((key) => {
    atlasCache.get(key)?.texture.dispose();
    atlasCache.delete(key);
  });
  invalidationVersion++;
  invalidationListeners.forEach((l) => l());
}
