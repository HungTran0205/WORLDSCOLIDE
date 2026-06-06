/**
 * Composite atlas builder — draws body animation frames with identity mask overlaid.
 *
 * Phase 3: accepts a sheet source {sheetTexture, cols, rows, row, frameCount}
 * instead of bodyTextures: Texture[]. Each body frame is sliced from the sheet
 * via canvas drawImage(sheet, srcX, srcY, frameW, frameH, 0, 0, frameW, frameH).
 *
 * One atlas per (charId × maskId × anim × row × blessed). Cache is module-level;
 * dispose on combat unmount via disposeCombatMaskCompositeAtlasCache() to avoid
 * accumulating CanvasTextures.
 *
 * Layers per frame, painted back-to-front: body slice → identity mask (per-frame
 * anchored, optional) → blessed overlay (full-frame gold outline + tattoo, optional).
 * A blessed-only ally (no identity mask) still composites; a mask-only ally is the
 * original behavior.
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

/**
 * Optional blessed-overlay layer — a single-row sheet of square frames (gold
 * outline + tattoo) drawn full-frame 1:1 over each body frame. Per-anim segment
 * offset selects the starting cell; overlay frame i = cell (segmentOffset + i).
 */
export interface BlessedOverlaySource {
  /** Full overlay sheet texture (already loaded; single row, square frames). */
  sheetTexture: THREE.Texture;
  /** First overlay cell index for this animation within the single-row sheet. */
  segmentOffset: number;
  /** Overlay frame count for this animation (matches the body frame count). */
  frameCount: number;
}

export interface BuildCombatMaskAtlasArgs {
  charId: string;
  anim: CombatMaskAnim;
  /** Identity mask id; null when compositing a blessed-only (mask-less) atlas. */
  maskId: string | null;
  /** Phase 3: sheet-based source replaces bodyTextures[]. */
  sheetSource: SheetCompositeSource;
  /** Identity mask texture; omit when maskId is null (no per-frame face mask). */
  maskTexture?: THREE.Texture;
  /** Phase 5: gold-outline + tattoo overlay drawn full-frame after body(+mask). */
  blessedOverlay?: BlessedOverlaySource;
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
  const { charId, maskId, anim, sheetSource, blessedOverlay } = args;
  // Blessed discriminator keeps blessed atlases distinct from plain identity-mask
  // atlases for the same (char, mask, anim, row, frameCount).
  const blessedKey = blessedOverlay
    ? `b${blessedOverlay.segmentOffset}:${blessedOverlay.frameCount}`
    : 'b-';
  return `${charId}|${maskId ?? 'none'}|${anim}|${sheetSource.row}|${sheetSource.frameCount}|${blessedKey}`;
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

  const { charId, anim, sheetSource, maskTexture, blessedOverlay } = args;
  const { sheetTexture, cols, rows, row, frameCount } = sheetSource;

  if (frameCount === 0) {
    throw new Error('buildCombatMaskCompositeAtlas: frameCount must be > 0');
  }
  if (!maskTexture && !blessedOverlay) {
    throw new Error('buildCombatMaskCompositeAtlas: requires maskTexture and/or blessedOverlay');
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

  const maskImg = maskTexture
    ? (maskTexture.image as HTMLImageElement | HTMLCanvasElement)
    : null;
  const overlayImg = blessedOverlay
    ? (blessedOverlay.sheetTexture.image as HTMLImageElement | HTMLCanvasElement)
    : null;

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

    // Identity mask: drawn over body at per-frame anchor position (optional)
    if (maskImg) {
      const anchor = resolveCombatMaskAnchor(charId, anim, i);
      const drawX = destX + anchor.x - anchor.size / 2;
      const drawY = destY + anchor.y - anchor.size / 2;
      ctx.drawImage(maskImg, drawX, drawY, anchor.size, anchor.size);
    }

    // Blessed overlay: full-frame gold outline + tattoo, painted last so it sits
    // on top of body (+ identity mask). Single-row sheet of square frames authored
    // 1:1 with the body; the per-anim segment offset selects the matching cell.
    // Frame size is derived from the overlay sheet itself (single-row → height), so
    // it stays correct regardless of the body frame size.
    if (overlayImg && blessedOverlay) {
      const ovFrameSize = (overlayImg as HTMLImageElement).height || frameH;
      // Clamp to this animation's own segment: if the body anim has more frames than
      // the overlay segment, hold the last overlay frame instead of bleeding into the
      // next animation's cells (segments are contiguous in a single row).
      const ovLocal = Math.min(i, blessedOverlay.frameCount - 1);
      const ovSrcX = (blessedOverlay.segmentOffset + ovLocal) * ovFrameSize;
      ctx.drawImage(overlayImg, ovSrcX, 0, ovFrameSize, ovFrameSize, destX, destY, frameW, frameH);
    }
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
