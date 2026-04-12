/**
 * Arena-specific types and constants for the real-time combat system.
 * Keeps combat-types.ts focused on shared types used by both auto-resolve and arena.
 */

import type { CombatEntity } from './combat-types';

/** CombatEntity with all spatial fields guaranteed present (arena code type safety) */
export interface ArenaEntity extends CombatEntity {
  position: { x: number; z: number };
  targetId: string | null;
  attackRange: number;
  moveSpeed: number;
  animState: 'idle' | 'walking' | 'attacking' | 'skill' | 'hit' | 'dead' | 'battle-idle' | 'blocking';
  facingRight: boolean;
  /** Timestamp when current animState should revert to idle */
  animStateUntil: number;
}

export type ArenaPhase = 'idle' | 'prep' | 'fighting' | 'result';

/** 6-slot formation: indices 0-2 = front row, 3-5 = back row */
export type Formation = (string | null)[];

/** Attack range constants — melee (1.5) vs ranged (5.0) */
export const ARCHETYPE_RANGE: Record<string, number> = {
  warrior: 1.5,
  dualblade: 1.5,
  engineer: 1.5,
  scout: 5.0,
  scholar: 5.0,
  philosopher: 5.0,
};

/** Default move speed (units per second) */
export const DEFAULT_MOVE_SPEED = 3.0;

/** Arena boundary limits for invisible walls */
export const ARENA_BOUNDS = {
  minX: -30,
  maxX: 30,
  minZ: -4,
  maxZ: 4,
} as const;

/** Lane Z positions for beat-em-up depth */
export const LANES = {
  back: -2,
  mid: 0,
  front: 2,
} as const;

export type Lane = keyof typeof LANES;

export type ArenaBounds = { minX: number; maxX: number; minZ: number; maxZ: number };

/** Compute expanded bounds for a given wave X offset */
export function getWaveBounds(waveXOffset: number): ArenaBounds {
  return {
    minX: ARENA_BOUNDS.minX,
    maxX: Math.max(ARENA_BOUNDS.maxX, waveXOffset + 12),
    minZ: ARENA_BOUNDS.minZ,
    maxZ: ARENA_BOUNDS.maxZ,
  };
}

/** Formation grid world positions — 3 lanes: back(-2), mid(0), front(+2) */
export const FORMATION_POSITIONS = {
  ally: {
    front: [
      { x: -4, z: -2 },  // back lane
      { x: -4, z: 0 },   // mid lane
      { x: -4, z: 2 },   // front lane
    ],
    back: [
      { x: -6, z: -2 },
      { x: -6, z: 0 },
      { x: -6, z: 2 },
    ],
  },
  enemy: {
    front: [
      { x: 4, z: -2 },
      { x: 4, z: 0 },
      { x: 4, z: 2 },
    ],
    back: [
      { x: 6, z: -2 },
      { x: 6, z: 0 },
      { x: 6, z: 2 },
    ],
  },
} as const;

/** Convert formation slot index to world position */
export function getFormationPosition(slotIndex: number, side: 'ally' | 'enemy'): { x: number; z: number } {
  const positions = FORMATION_POSITIONS[side];
  if (slotIndex < 3) return { ...positions.front[slotIndex] };
  return { ...positions.back[slotIndex - 3] };
}

/** Get attack range for an archetype */
export function getAttackRange(archetype?: string): number {
  return ARCHETYPE_RANGE[archetype ?? 'warrior'] ?? 1.5;
}

/** Check if archetype is ranged (attack range >= 4) */
export function isRangedArchetype(archetype?: string): boolean {
  return getAttackRange(archetype) >= 4;
}
