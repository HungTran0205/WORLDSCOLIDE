/**
 * Composite atlas builder — draws body animation frames with identity mask overlaid.
 *
 * One atlas per (charId × maskId × anim). Cache is module-level; dispose on combat unmount
 * via disposeCombatMaskCompositeAtlasCache() to avoid accumulating CanvasTextures.
 *
 * Coordinate convention: top-left, matches canvas 2D and combat-mask-anchors.ts.
 */

import * as THREE from 'three';
import type { SpriteAtlas } from '../sprites/sprite-atlas';
import { resolveCombatMaskAnchor, type CombatMaskAnim } from './combat-mask-anchors';

export interface BuildCombatMaskAtlasArgs {
  charId: string;
  anim: CombatMaskAnim;
  maskId: string;
  bodyTextures: THREE.Texture[];
  maskTexture: THREE.Texture;
  cols: number;
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
  return `${args.charId}|${args.maskId}|${args.anim}|${args.bodyTextures.length}`;
}

/**
 * Build (or return cached) a composite SpriteAtlas with the identity mask drawn
 * over each body frame at its per-frame anchor position.
 *
 * Caller must ensure bodyTextures and maskTexture are already loaded.
 * Returned atlas is shared — do NOT dispose it per-sprite; use disposeCombatMaskCompositeAtlasCache().
 */
export function buildCombatMaskCompositeAtlas(args: BuildCombatMaskAtlasArgs): SpriteAtlas {
  const key = makeCacheKey(args);
  const cached = atlasCache.get(key);
  if (cached) return cached;

  const { charId, anim, bodyTextures, maskTexture, cols } = args;

  if (bodyTextures.length === 0) {
    throw new Error('buildCombatMaskCompositeAtlas: bodyTextures must not be empty');
  }

  const frameCount = bodyTextures.length;
  const rows = Math.ceil(frameCount / cols);

  const firstImage = bodyTextures[0].image as HTMLImageElement | HTMLCanvasElement;
  const frameW = firstImage.width || 128;
  const frameH = firstImage.height || 128;

  const canvas = document.createElement('canvas');
  canvas.width = cols * frameW;
  canvas.height = rows * frameH;
  const ctx = canvas.getContext('2d')!;
  // Mask source is 32×32 upscaled to anchor.size — bilinear would blur it against crisp body pixels
  ctx.imageSmoothingEnabled = false;

  const maskImg = maskTexture.image as HTMLImageElement | HTMLCanvasElement;

  for (let i = 0; i < frameCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellX = col * frameW;
    const cellY = row * frameH;

    // Body first (1:1, no scaling)
    const bodyImg = bodyTextures[i].image as HTMLImageElement | HTMLCanvasElement;
    ctx.drawImage(bodyImg, cellX, cellY, frameW, frameH);

    // Mask second — drawn over body at per-frame anchor
    const anchor = resolveCombatMaskAnchor(charId, anim, i);
    const drawX = cellX + anchor.x - anchor.size / 2;
    const drawY = cellY + anchor.y - anchor.size / 2;
    ctx.drawImage(maskImg, drawX, drawY, anchor.size, anchor.size);
  }

  const atlasTexture = new THREE.CanvasTexture(canvas);
  atlasTexture.magFilter = THREE.NearestFilter;
  atlasTexture.minFilter = THREE.NearestMipmapNearestFilter;
  atlasTexture.colorSpace = THREE.SRGBColorSpace;
  atlasTexture.generateMipmaps = true;

  // Set initial UV to frame 0
  atlasTexture.repeat.set(1 / cols, 1 / rows);
  atlasTexture.offset.set(0, 1 - 1 / rows);

  const atlas: SpriteAtlas = { texture: atlasTexture, cols, rows, frameCount };
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
