/**
 * Sprite path resolution — maps (civilization, archetype, gender) to sprite folder paths.
 * Sprite folders use civ prefixes that differ from CIV_CONFIG.shortName.
 *
 * Phase 3 adds sheet-path helpers (getSheetPath) that return a single PNG path
 * for a pre-packed sprite sheet. Animators call getSheetPath + getSheetEntry for
 * geometry, then use buildAtlasFromSheet instead of loading N per-frame images.
 *
 * Per-frame path builders (getWalkingFramePath etc.) are KEPT for now — remove
 * only after confirming zero refs repo-wide (post Phase 2 frame pruning).
 */

import type { Civilization } from '@/game/data/civilization-config';
import { assetUrl } from '@/lib/asset-url';
import { getSheetEntry } from './sprite-sheet-manifest';

export type SpriteDirection = 'north' | 'south' | 'east' | 'west';

/** Guild hall members walk in east/west only (idle faces south separately). */
export type HorizontalDirection = 'east' | 'west';

/** Sprite folder prefix per civilization — matches CIV_CONFIG.shortName. */
const CIV_SPRITE_PREFIX: Record<Civilization, string> = {
  LinhSon: 'LS',
  DeQuoc: 'DQ',
  ThienLu: 'TL',
};

/** Build base path to a character's sprite folder */
export function getSpritePath(civilization: string, archetype: string, gender: 'M' | 'F'): string {
  const prefix = CIV_SPRITE_PREFIX[civilization as Civilization] ?? 'LS';
  const arch = archetype.toUpperCase();
  return assetUrl(`/sprites/characters/${prefix}-${arch}-${gender}`);
}

/**
 * Build path to a character's static portrait avatar — a single-frame image that
 * the packer leaves un-bundled (single-image sets are not packed into sheets, so
 * this file survives frame pruning). Used by UI <img> portraits (tavern cards,
 * facility member avatar). Every character ships an avatar/frame_000.png, so this
 * never 404s — unlike the old battle-idle-frame-0 portraits, which were missing
 * for `south` and for characters without a battle-idle animation.
 */
export function getAvatarPath(basePath: string): string {
  return `${basePath}/animations/avatar/frame_000.png`;
}

/** Build path to a specific walking animation frame */
export function getWalkingFramePath(basePath: string, direction: SpriteDirection, frame: number): string {
  const padded = String(frame).padStart(3, '0');
  return `${basePath}/animations/walking-8-frames/${direction}/frame_${padded}.png`;
}

/** Build path to a specific running animation frame */
export function getRunningFramePath(basePath: string, direction: SpriteDirection, frame: number): string {
  const padded = String(frame).padStart(3, '0');
  return `${basePath}/animations/running-8-frames/${direction}/frame_${padded}.png`;
}

/** Build path to a generic working/crafting animation frame (no direction subdir) */
export function getWorkingFramePath(basePath: string, frame: number): string {
  const padded = String(frame).padStart(3, '0');
  return `${basePath}/animations/working/frame_${padded}.png`;
}

/** Build path to a woodcutting animation frame */
export function getWoodcuttingFramePath(basePath: string, direction: SpriteDirection, frame: number): string {
  const padded = String(frame).padStart(3, '0');
  return `${basePath}/animations/woodcutting-8-frames/${direction}/frame_${padded}.png`;
}

/** Build path to a character attack animation frame */
export function getAttackFramePath(basePath: string, direction: SpriteDirection, frame: number): string {
  const padded = String(frame).padStart(3, '0');
  return `${basePath}/animations/attack/${direction}/frame_${padded}.png`;
}

/** Build path to a character battle-idle animation frame (combat stance) */
export function getBattleIdleFramePath(basePath: string, direction: SpriteDirection, frame: number): string {
  const padded = String(frame).padStart(3, '0');
  return `${basePath}/animations/battle-idle/${direction}/frame_${padded}.png`;
}

/** Build path to a character blocking animation frame */
export function getBlockingFramePath(basePath: string, direction: SpriteDirection, frame: number): string {
  const padded = String(frame).padStart(3, '0');
  return `${basePath}/animations/blocking/${direction}/frame_${padded}.png`;
}

/** Build path to a character back-jump animation frame (warrior return animation) */
export function getBackFramePath(basePath: string, direction: SpriteDirection, frame: number): string {
  const padded = String(frame).padStart(3, '0');
  return `${basePath}/animations/back/${direction}/frame_${padded}.png`;
}

/** Build path to an enemy animation frame (west direction only on disk) */
export function getEnemyAnimFramePath(spriteId: string, anim: string, frame: number): string {
  const padded = String(frame).padStart(3, '0');
  return assetUrl(`/sprites/enemies/${spriteId}/animations/${anim}/west/frame_${padded}.png`);
}

/** @deprecated Use getEnemyAnimFramePath(spriteId, 'walk', frame) */
export function getEnemyWalkFramePath(spriteId: string, frame: number): string {
  return getEnemyAnimFramePath(spriteId, 'walk', frame);
}

/** Determine sprite direction from movement delta (isometric camera at [10,10,10]).
 *  World XZ axes are rotated ~45° relative to the screen, so we rotate the
 *  movement vector into screen space before bucketing into 4 cardinal directions.
 *  Without this rotation, screen-horizontal/vertical motion has |dx| ≈ |dz| and
 *  float jitter flips the chosen direction (e.g. moving left → 'south'). */
export function getDirectionFromMovement(dx: number, dz: number): SpriteDirection {
  const screenRight = dx - dz;
  const screenDown = dx + dz;
  if (Math.abs(screenRight) > Math.abs(screenDown)) {
    return screenRight > 0 ? 'east' : 'west';
  }
  return screenDown > 0 ? 'south' : 'north';
}

/**
 * Return the full public URL for a pre-packed sprite sheet PNG.
 * entityKey: e.g. 'characters/LS-SWORD-M'  anim: e.g. 'walking-8-frames'
 * Returns undefined if the manifest has no entry for that key/anim combo.
 */
export function getSheetPath(entityKey: string, anim: string): string | undefined {
  const entry = getSheetEntry(entityKey, anim);
  if (!entry) return undefined;
  return assetUrl(entry.path);
}

/**
 * Derive the entity key (e.g. 'characters/LS-SWORD-M') from a basePath produced
 * by getSpritePath (e.g. 'http://…/sprites/characters/LS-SWORD-M').
 * Used by animators to look up manifest entries from the basePath they already have.
 */
export function getEntityKeyFromBasePath(basePath: string): string {
  // basePath after assetUrl may be './sprites/characters/LS-SWORD-M' or an absolute URL.
  // We only care about the 'characters/<ID>' suffix.
  const match = basePath.match(/sprites\/(characters\/[^/]+)/);
  return match?.[1] ?? '';
}

/**
 * Idle frame path for guild hall members.
 * Phase 3 note: guild-hall-sprite-animator.tsx now drives idle from the walk
 * sheet (south row, frame 0 via getAtlasFrameUv) instead of loading a separate
 * image — keeping this fn for backward compat with the existing test only.
 * Returns the per-frame path so the test assertion is stable.
 */
export function getGuildHallIdleFramePath(basePath: string): string {
  return getWalkingFramePath(basePath, 'south', 0);
}

/** Horizontal facing from movement on the tilted (~45°) iso floor.
 *  Facing comes from the screen-horizontal projection `screenRight = dx - dz`:
 *  moving toward -Z reads as moving right (east), toward +Z as left (west).
 *  Only hold the previous facing when movement is almost purely screen-vertical
 *  (dx ≈ dz, so screenRight ≈ 0), where east/west is genuinely ambiguous —
 *  otherwise the sprite "moonwalks" (faces opposite its travel) on Z-dominant
 *  paths, because |screenRight| ties |screenDown| there. */
export function getHorizontalDirectionFromMovement(
  dx: number,
  dz: number,
  previous: HorizontalDirection,
): HorizontalDirection {
  const screenRight = dx - dz;
  if (Math.abs(screenRight) < 1e-3) return previous;
  return screenRight > 0 ? 'east' : 'west';
}
