/**
 * Combat-panel sprite resolver (Phase 2 — see plan 260503-1123).
 *
 * Combat panel uses ONLY two animation states: `idle` (battle stance) and
 * `death` (KO). Allies face east, enemies face west. When a frame is missing
 * on disk, we fall back to a single static frame.
 *
 * Last-resort fallback for enemies is `rotations/west.png`. Entities listed
 * in `phase-02-asset-gaps.md` (currently goblin, moonbear, queen-spider) have
 * no asset on disk at all and WILL 404 — Phase 4 must wire a sentinel
 * placeholder or generate the missing rotations frame before those enemies
 * appear in any mission render.
 *
 * Manifest is hand-maintained from the asset audit
 * (plans/260503-1123-combat-panel-idle-redesign/phase-02-asset-inventory.md).
 * Add new civs/enemies here as their frames land.
 */

export type CombatAnimState = 'idle' | 'attack' | 'death';

export const COMBAT_IDLE_FRAME_COUNT = 8;
export const COMBAT_ATTACK_FRAME_COUNT = 8;
export const COMBAT_DEATH_FRAME_COUNT = 8;

/** Compile-time map of which entities have which combat-panel assets on disk. */
export const COMBAT_SPRITE_MANIFEST = {
  /** Char IDs (e.g. 'LS-WARRIOR-M') with `animations/battle-idle/east/frame_0..7.png`. */
  charsWithBattleIdleEast: new Set<string>([
    'LS-SCOUT-F', 'LS-SCOUT-M', 'LS-WARRIOR-F', 'LS-WARRIOR-M',
  ]),
  /** Char IDs with `animations/attack/east/frame_0..7.png`. */
  charsWithAttackEast: new Set<string>([
    'LS-SCOUT-F', 'LS-SCOUT-M', 'LS-WARRIOR-F', 'LS-WARRIOR-M',
  ]),
  /** Char IDs with `animations/death/east/frame_0..7.png`. */
  charsWithDeathEast: new Set<string>([
    'LS-SCOUT-F', 'LS-SCOUT-M', 'LS-WARRIOR-F', 'LS-WARRIOR-M',
  ]),
  /** Enemy IDs (e.g. 'slime-king') with `animations/idle/west/frame_0..7.png`. */
  enemiesWithIdleWest: new Set<string>([
    'cave-bat', 'slime-king',
  ]),
  /** Enemy IDs with `animations/attack/west/frame_0..N.png`. */
  enemiesWithAttackWest: new Set<string>([
    'cave-bat', 'forest-spider', 'slime', 'slime-king',
  ]),
  /** Enemy IDs with `animations/death/west/frame_0..N.png`. */
  enemiesWithDeathWest: new Set<string>([
    'cave-bat', 'forest-spider', 'slime', 'slime-king',
  ]),
  /** Enemy IDs with `animations/walk/west/` (last-resort idle fallback when idle missing). */
  enemiesWithWalkWest: new Set<string>([
    'cave-bat', 'forest-spider', 'slime', 'slime-king',
  ]),
} as const;

/** Enemy IDs whose death animation has fewer than COMBAT_DEATH_FRAME_COUNT frames. */
const ENEMY_DEATH_FRAME_OVERRIDES: Record<string, number> = {
  'forest-spider': 4,
};

/** Enemy IDs whose attack animation has fewer than COMBAT_ATTACK_FRAME_COUNT frames. */
const ENEMY_ATTACK_FRAME_OVERRIDES: Record<string, number> = {
  'slime': 4,
};

/** Extract char id (e.g. 'LS-WARRIOR-M') from a basePath like '/sprites/characters/LS-WARRIOR-M'. */
function getCharIdFromBasePath(basePath: string): string {
  const parts = basePath.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

/**
 * Build a combat-panel sprite path for an ally character.
 * Falls back to a static walking frame when the preferred asset is missing,
 * so the resolver never returns a 404 path.
 */
export function resolveAllyCombatSprite(
  basePath: string,
  state: CombatAnimState,
  frame: number,
): string {
  const charId = getCharIdFromBasePath(basePath);
  const padded = String(frame).padStart(3, '0');

  if (state === 'death') {
    if (COMBAT_SPRITE_MANIFEST.charsWithDeathEast.has(charId)) {
      return `${basePath}/animations/death/east/frame_${padded}.png`;
    }
    return `${basePath}/animations/walking-8-frames/east/frame_000.png`;
  }

  if (state === 'attack') {
    if (COMBAT_SPRITE_MANIFEST.charsWithAttackEast.has(charId)) {
      return `${basePath}/animations/attack/east/frame_${padded}.png`;
    }
    // Fallback to idle animation (the sprite component shares the idle atlas
    // so no extra GPU canvas is allocated when an entity has no attack frames).
    return resolveAllyCombatSprite(basePath, 'idle', frame);
  }

  if (COMBAT_SPRITE_MANIFEST.charsWithBattleIdleEast.has(charId)) {
    return `${basePath}/animations/battle-idle/east/frame_${padded}.png`;
  }
  return `${basePath}/animations/walking-8-frames/east/frame_000.png`;
}

/**
 * Build a combat-panel sprite path for an enemy.
 * Fallback chain: idle/west → walk/west[0] → rotations/west.png.
 */
export function resolveEnemyCombatSprite(
  spriteId: string,
  state: CombatAnimState,
  frame: number,
): string {
  const padded = String(frame).padStart(3, '0');

  if (state === 'death') {
    if (COMBAT_SPRITE_MANIFEST.enemiesWithDeathWest.has(spriteId)) {
      return `/sprites/enemies/${spriteId}/animations/death/west/frame_${padded}.png`;
    }
    if (COMBAT_SPRITE_MANIFEST.enemiesWithIdleWest.has(spriteId)) {
      return `/sprites/enemies/${spriteId}/animations/idle/west/frame_000.png`;
    }
    if (COMBAT_SPRITE_MANIFEST.enemiesWithWalkWest.has(spriteId)) {
      return `/sprites/enemies/${spriteId}/animations/walk/west/frame_000.png`;
    }
    return `/sprites/enemies/${spriteId}/rotations/west.png`;
  }

  if (state === 'attack') {
    if (COMBAT_SPRITE_MANIFEST.enemiesWithAttackWest.has(spriteId)) {
      return `/sprites/enemies/${spriteId}/animations/attack/west/frame_${padded}.png`;
    }
    // Fallback to idle (the sprite component shares the idle atlas so no
    // extra GPU canvas is allocated when an enemy has no attack frames).
    return resolveEnemyCombatSprite(spriteId, 'idle', frame);
  }

  if (COMBAT_SPRITE_MANIFEST.enemiesWithIdleWest.has(spriteId)) {
    return `/sprites/enemies/${spriteId}/animations/idle/west/frame_${padded}.png`;
  }
  if (COMBAT_SPRITE_MANIFEST.enemiesWithWalkWest.has(spriteId)) {
    return `/sprites/enemies/${spriteId}/animations/walk/west/frame_000.png`;
  }
  return `/sprites/enemies/${spriteId}/rotations/west.png`;
}

/** Frame count to load for an ally combat animation (1 = static fallback). */
export function getAllyCombatFrameCount(basePath: string, state: CombatAnimState): number {
  const charId = getCharIdFromBasePath(basePath);
  if (state === 'idle') {
    return COMBAT_SPRITE_MANIFEST.charsWithBattleIdleEast.has(charId) ? COMBAT_IDLE_FRAME_COUNT : 1;
  }
  if (state === 'attack') {
    if (COMBAT_SPRITE_MANIFEST.charsWithAttackEast.has(charId)) return COMBAT_ATTACK_FRAME_COUNT;
    // No attack asset → caller reuses the idle atlas; mirror idle's frame count.
    return getAllyCombatFrameCount(basePath, 'idle');
  }
  return COMBAT_SPRITE_MANIFEST.charsWithDeathEast.has(charId) ? COMBAT_DEATH_FRAME_COUNT : 1;
}

/** Frame count to load for an enemy combat animation (1 = static fallback). */
export function getEnemyCombatFrameCount(spriteId: string, state: CombatAnimState): number {
  if (state === 'idle') {
    return COMBAT_SPRITE_MANIFEST.enemiesWithIdleWest.has(spriteId) ? COMBAT_IDLE_FRAME_COUNT : 1;
  }
  if (state === 'attack') {
    if (COMBAT_SPRITE_MANIFEST.enemiesWithAttackWest.has(spriteId)) {
      return ENEMY_ATTACK_FRAME_OVERRIDES[spriteId] ?? COMBAT_ATTACK_FRAME_COUNT;
    }
    return getEnemyCombatFrameCount(spriteId, 'idle');
  }
  if (!COMBAT_SPRITE_MANIFEST.enemiesWithDeathWest.has(spriteId)) return 1;
  return ENEMY_DEATH_FRAME_OVERRIDES[spriteId] ?? COMBAT_DEATH_FRAME_COUNT;
}

/** True when the entity has dedicated attack frames on disk (not a fallback). */
export function hasAllyAttackAnim(basePath: string): boolean {
  return COMBAT_SPRITE_MANIFEST.charsWithAttackEast.has(getCharIdFromBasePath(basePath));
}
export function hasEnemyAttackAnim(spriteId: string): boolean {
  return COMBAT_SPRITE_MANIFEST.enemiesWithAttackWest.has(spriteId);
}
