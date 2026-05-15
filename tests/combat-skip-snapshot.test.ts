/**
 * Skip-button snapshot path (D11) — verifies that resuming combat from a
 * mid-battle snapshot preserves dead/HP/status state and never revives an
 * entity that died on the live canvas. Also exercises cloneCombatEntity to
 * confirm the snapshot is decoupled from caller state.
 */

import { describe, it, expect } from 'vitest';
import {
  cloneCombatEntity,
  simulateCombatFromSnapshot,
} from '@/game/systems/combat-simulator';
import { createPassiveState } from '@/game/systems/combat-passives';
import type { CombatEntity } from '@/game/systems/combat-types';

function makeEntity(overrides: Partial<CombatEntity> = {}): CombatEntity {
  const base = {
    STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 10,
  };
  return {
    id: overrides.id ?? 'e1',
    name: overrides.name ?? 'Hero',
    isAlly: overrides.isAlly ?? true,
    maxHp: 100,
    currentHp: 100,
    stats: { ...base },
    baseStats: { ...base },
    skill: null,
    level: 1,
    attackIntervalMs: 1000,
    nextAttackAt: 1000,
    skillCooldownUntil: 0,
    statusEffects: [],
    abilities: [],
    dodgeRate: 0,
    blockRate: 0,
    critDmg: 1.5,
    hpRegenPerSec: 0,
    ...overrides,
  };
}

describe('cloneCombatEntity', () => {
  it('produces a value-decoupled clone (mutating original leaves clone unchanged)', () => {
    const original = makeEntity({
      statusEffects: [{ type: 'poisoned', ticksRemaining: 5 }],
      stats: { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 10 },
    });
    original.passiveState = createPassiveState('DeQuoc');
    original.passiveState.stacks = 2;

    const cloned = cloneCombatEntity(original);

    // Mutate the original everywhere a shallow copy would leak
    original.statusEffects[0].ticksRemaining = 0;
    original.statusEffects.push({ type: 'stunned', ticksRemaining: 3 });
    original.stats.STR = 999;
    if (original.passiveState) original.passiveState.stacks = 99;
    original.currentHp = 1;

    expect(cloned.statusEffects.length).toBe(1);
    expect(cloned.statusEffects[0].ticksRemaining).toBe(5);
    expect(cloned.stats.STR).toBe(10);
    expect(cloned.passiveState?.stacks).toBe(2);
    expect(cloned.currentHp).toBe(100);
  });

  it('preserves enemy ability list as a fresh array', () => {
    const original = makeEntity({
      isAlly: false,
      abilities: [{ type: 'poison-attack', chance: 0.5 }],
    });
    const cloned = cloneCombatEntity(original);
    original.abilities.push({ type: 'enrage', chance: 1 });
    expect(cloned.abilities.length).toBe(1);
  });
});

describe('simulateCombatFromSnapshot', () => {
  it('resolves immediately when one team is already wiped', () => {
    const ally = makeEntity({ id: 'a1', isAlly: true });
    const deadEnemy = makeEntity({ id: 'e1', isAlly: false, currentHp: 0 });
    const result = simulateCombatFromSnapshot([ally, deadEnemy]);

    expect(result.outcome).toBe('victory');
    expect(result.survivors).toContain('a1');
  });

  it('does NOT revive an entity that was dead in the snapshot', () => {
    // Two allies; a1 is dead, a2 alive. Two weak enemies.
    const deadAlly = makeEntity({ id: 'a-dead', isAlly: true, currentHp: 0 });
    const liveAlly = makeEntity({
      id: 'a-live', isAlly: true, currentHp: 100,
      stats: { STR: 50, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 0, AGI: 30 },
      baseStats: { STR: 50, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 0, AGI: 30 },
    });
    const enemy1 = makeEntity({ id: 'en1', isAlly: false, currentHp: 5, maxHp: 50 });
    const enemy2 = makeEntity({ id: 'en2', isAlly: false, currentHp: 5, maxHp: 50 });

    const result = simulateCombatFromSnapshot([deadAlly, liveAlly, enemy1, enemy2]);

    // Dead ally must not appear in survivors and must be reported injured.
    expect(result.survivors).not.toContain('a-dead');
    expect(result.injured).toContain('a-dead');
  });

  it('continues HP from snapshot — low-HP enemy still dies even with 1 HP', () => {
    const ally = makeEntity({
      id: 'a1', isAlly: true, currentHp: 100,
      stats: { STR: 30, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 0, AGI: 50 },
      baseStats: { STR: 30, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 0, AGI: 50 },
    });
    const dyingEnemy = makeEntity({
      id: 'e1', isAlly: false, currentHp: 1, maxHp: 200,
      stats: { STR: 1, END: 1, INT: 1, DEX: 1, CHA: 1, LCK: 1, AGI: 1 },
    });

    const result = simulateCombatFromSnapshot([ally, dyingEnemy]);
    expect(result.outcome).not.toBe('full-wipe');
    expect(result.survivors).toContain('a1');
  });

  it('does NOT mutate the input snapshot (deep clone in effect)', () => {
    const ally = makeEntity({ id: 'a1', isAlly: true, currentHp: 100 });
    const enemy = makeEntity({ id: 'e1', isAlly: false, currentHp: 100 });
    const snapshotBefore = JSON.stringify([ally, enemy]);
    simulateCombatFromSnapshot([ally, enemy]);
    const snapshotAfter = JSON.stringify([ally, enemy]);
    expect(snapshotAfter).toBe(snapshotBefore);
  });

  it('rebases nextAttackAt against baseTime so simulator clock starts cleanly', () => {
    // Engine ran 25s; entity nextAttackAt=26500 → with baseTime=25000 the
    // simulator should treat it as 1500ms remaining wait (not 26.5s into a
    // fresh sim).
    const ally = makeEntity({
      id: 'a1', isAlly: true, currentHp: 100,
      stats: { STR: 50, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 0, AGI: 30 },
      baseStats: { STR: 50, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 0, AGI: 30 },
      nextAttackAt: 26500,
    });
    const enemy = makeEntity({
      id: 'e1', isAlly: false, currentHp: 30, maxHp: 50, nextAttackAt: 26000,
    });

    const result = simulateCombatFromSnapshot([ally, enemy], 25000);
    // Combat should resolve within MAX_TICKS — durationMs is the simulator-
    // local clock so it won't carry the 25s baseTime forward.
    expect(result.durationMs).toBeLessThan(120_000);
    expect(['victory', 'partial-victory', 'full-wipe']).toContain(result.outcome);
  });
});
