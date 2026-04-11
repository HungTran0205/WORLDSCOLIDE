/**
 * Sprite path resolution — maps (civilization, archetype, gender) to sprite folder paths.
 * Sprite folders use civ prefixes that differ from CIV_CONFIG.shortName.
 */

import type { Civilization } from '@/game/data/civilization-config';

export type SpriteDirection = 'north' | 'south' | 'east' | 'west';

/** Sprite folder prefix per civilization (TS for LinhSon, not LS) */
const CIV_SPRITE_PREFIX: Record<Civilization, string> = {
  LinhSon: 'TS',
  DeQuoc: 'DQ',
  ThienLu: 'TL',
};

/** Build base path to a character's sprite folder */
export function getSpritePath(civilization: string, archetype: string, gender: 'M' | 'F'): string {
  const prefix = CIV_SPRITE_PREFIX[civilization as Civilization] ?? 'TS';
  const arch = archetype.toUpperCase();
  return `/sprites/characters/${prefix}-${arch}-${gender}`;
}

/** Build path to a specific walking animation frame */
export function getWalkingFramePath(basePath: string, direction: SpriteDirection, frame: number): string {
  const padded = String(frame).padStart(3, '0');
  return `${basePath}/animations/walking-8-frames/${direction}/frame_${padded}.png`;
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

/** Build path to an enemy animation frame (west direction only on disk) */
export function getEnemyAnimFramePath(spriteId: string, anim: string, frame: number): string {
  const padded = String(frame).padStart(3, '0');
  return `/sprites/enemies/${spriteId}/animations/${anim}/west/frame_${padded}.png`;
}

/** @deprecated Use getEnemyAnimFramePath(spriteId, 'walk', frame) */
export function getEnemyWalkFramePath(spriteId: string, frame: number): string {
  return getEnemyAnimFramePath(spriteId, 'walk', frame);
}

/** Determine sprite direction from movement delta (isometric camera at [10,10,10]) */
export function getDirectionFromMovement(dx: number, dz: number): SpriteDirection {
  if (Math.abs(dx) > Math.abs(dz)) {
    return dx > 0 ? 'east' : 'west';
  }
  return dz > 0 ? 'south' : 'north';
}
