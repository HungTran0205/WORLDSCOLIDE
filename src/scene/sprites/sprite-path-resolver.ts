/**
 * Sprite path resolution — maps (civilization, archetype, gender) to sprite folder paths.
 * Sprite folders use civ prefixes that differ from CIV_CONFIG.shortName.
 */

import type { Civilization } from '@/game/data/civilization-config';
import { assetUrl } from '@/lib/asset-url';

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

/** Idle frame for guild hall members — south frame_000 from their own folder. */
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
