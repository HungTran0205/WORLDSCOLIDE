import { describe, it, expect } from 'vitest';
import {
  resolveAllyCombatSprite,
  resolveAllyCombatSheet,
  getAllyCombatFrameCount,
  hasAllyAttackAnim,
  COMBAT_IDLE_FRAME_COUNT,
  COMBAT_ATTACK_FRAME_COUNT,
  COMBAT_CASTING_FRAME_COUNT,
} from './combat-sprite-resolver';

const SWORD = '/sprites/characters/LS-SWORD-M';
const WARRIOR = '/sprites/characters/LS-WARRIOR-M';

// Regression guard: LS-SWORD-M (the Templar founder) ships full combat frames on
// disk, so combat must use battle-idle/attack/death — NOT the walking fallback.
describe('combat-sprite-resolver — LS-SWORD-M (Templar founder)', () => {
  it('uses dedicated battle-idle frames for idle (not walking fallback)', () => {
    expect(resolveAllyCombatSprite(SWORD, 'idle', 3)).toBe(
      `${SWORD}/animations/battle-idle/east/frame_003.png`,
    );
    expect(resolveAllyCombatSprite(SWORD, 'idle', 3)).not.toContain('walking-8-frames');
  });

  it('uses dedicated attack frames for attack (not idle/walking fallback)', () => {
    expect(resolveAllyCombatSprite(SWORD, 'attack', 2)).toBe(
      `${SWORD}/animations/attack/east/frame_002.png`,
    );
    expect(hasAllyAttackAnim(SWORD)).toBe(true);
  });

  it('uses dedicated death frames for death (not static walking frame_000)', () => {
    expect(resolveAllyCombatSprite(SWORD, 'death', 1)).toBe(
      `${SWORD}/animations/death/east/frame_001.png`,
    );
  });

  it('reports full frame counts for idle and attack', () => {
    expect(getAllyCombatFrameCount(SWORD, 'idle')).toBe(COMBAT_IDLE_FRAME_COUNT);
    expect(getAllyCombatFrameCount(SWORD, 'attack')).toBe(COMBAT_ATTACK_FRAME_COUNT);
  });
});

// Ancestral Blessings casting clip — POC: LS-SWORD-M only. Others must fall back to
// idle (no 404), and the resolver must report the 8-frame casting count for SWORD.
describe('combat-sprite-resolver — casting (Ancestral Blessings)', () => {
  it('resolves the dedicated casting sheet for LS-SWORD-M', () => {
    const info = resolveAllyCombatSheet(SWORD, 'casting');
    expect(info.sheetPath).toContain('Ancestral-casting.png');
    expect(info.frameCount).toBe(COMBAT_CASTING_FRAME_COUNT);
    expect(getAllyCombatFrameCount(SWORD, 'casting')).toBe(COMBAT_CASTING_FRAME_COUNT);
  });

  it('falls back to the idle sheet for a char without a casting sheet (no 404)', () => {
    const casting = resolveAllyCombatSheet(WARRIOR, 'casting');
    const idle = resolveAllyCombatSheet(WARRIOR, 'idle');
    expect(casting.sheetPath).toBe(idle.sheetPath);
    expect(casting.sheetPath).not.toContain('Ancestral-casting.png');
    // Frame count mirrors idle when no dedicated casting sheet exists.
    expect(getAllyCombatFrameCount(WARRIOR, 'casting')).toBe(getAllyCombatFrameCount(WARRIOR, 'idle'));
  });
});
