/**
 * Cleave frontal-arc tests: the skill strikes the primary target + nearby
 * enemies within cleaveRadius, secondaries at the splash multiplier, and leaves
 * enemies outside the radius untouched.
 *
 * Combat runs in "attack in place" mode (no movement / no range gate), so enemy
 * positions are set once and only drive the cleave splash-radius check. The ally
 * starts on a full skill cooldown (factory init), so the test zeroes it and pins
 * the focus target to make the cast deterministic.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CombatEngine } from './combat-engine';
import { SKILL_CLEAVE } from '@/game/data/linh-son-skills';
import type { Member, Stats, Skill } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';

const BASE_STATS: Stats = { STR: 30, END: 5, INT: 5, DEX: 10, CHA: 5, LCK: 5, AGI: 5 };

// Crit disabled so the splash-ratio damage is deterministic.
const CLEAVE_NO_CRIT: Skill = { ...SKILL_CLEAVE, critRateBonus: 0 };

function makeTemplar(id = 'templar'): Member {
  return {
    id, name: 'Templar', grade: 'D', isMercenary: false,
    stats: { ...BASE_STATS, LCK: 0 }, unallocatedPoints: 0,
    skill: { ...CLEAVE_NO_CRIT }, status: 'idle', injuredUntil: null,
    civilization: 'LinhSon', archetype: 'sword', gender: 'M', isFounder: true,
    missionsCompleted: 0, traits: [], equipment: null, medicineSlots: undefined,
  };
}

function makeEnemy(id: string): EnemyTemplate {
  return { id, name: id, level: 1, stats: { ...BASE_STATS, STR: 1 }, skill: null, abilities: [], loot: [], spriteId: 'slime' };
}

describe('CombatEngine: Cleave frontal arc', () => {
  let engine: CombatEngine;
  beforeEach(() => {
    engine = new CombatEngine();
    // Kill RNG so crit (5% floor even at LCK 0) can't skew the splash-ratio read.
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  /** Tick (re-arming the skill + pinning the focus target) until Cleave fires;
   *  return that batch's skill-use events. */
  function runUntilCleave(primaryId: string) {
    const ally = engine.entities.find((e) => e.isAlly)!;
    for (let i = 0; i < 80; i++) {
      ally.skillCooldownUntil = 0;     // keep armed until it fires
      engine.primaryTargetId = primaryId; // pin the cleave centre
      const events = engine.tick(100);
      const cleaves = events.filter(
        (e): e is Extract<typeof e, { type: 'skill-use' }> =>
          e.type === 'skill-use' && e.skillName === SKILL_CLEAVE.name,
      );
      if (cleaves.length > 0) return cleaves;
    }
    return [] as Extract<ReturnType<CombatEngine['tick']>[number], { type: 'skill-use' }>[];
  }

  it('hits the primary + a clustered enemy, but not one outside cleaveRadius', () => {
    engine.init([makeTemplar()], ['templar', null, null, null, null, null],
      [makeEnemy('near1'), makeEnemy('near2'), makeEnemy('far')], 1.0);

    const n1 = engine.entities.find((e) => e.name === 'near1')!;
    const n2 = engine.entities.find((e) => e.name === 'near2')!;
    const fr = engine.entities.find((e) => e.name === 'far')!;
    n1.position = { x: 1.2, y: 0, z: 0 };
    n2.position = { x: 1.6, y: 0, z: 0.6 };   // within 1.8u of n1 → splash
    fr.position = { x: 20, y: 0, z: 0 };      // outside the arc

    const cleaves = runUntilCleave(n1.id);
    const hitIds = new Set(cleaves.map((e) => e.targetId));

    expect(cleaves.length).toBeGreaterThanOrEqual(2);     // multi-target
    expect(hitIds.has(fr.id)).toBe(false);                // far enemy excluded
    expect(hitIds.has(n1.id) && hitIds.has(n2.id)).toBe(true);
  });

  it('applies splash falloff: secondary damage ≈ 0.6× the primary', () => {
    engine.init([makeTemplar()], ['templar', null, null, null, null, null],
      [makeEnemy('near1'), makeEnemy('near2')], 1.0);

    const n1 = engine.entities.find((e) => e.name === 'near1')!;
    const n2 = engine.entities.find((e) => e.name === 'near2')!;
    n1.currentHp = n1.maxHp = 9999;
    n2.currentHp = n2.maxHp = 9999;
    n1.position = { x: 1.2, y: 0, z: 0 };
    n2.position = { x: 1.5, y: 0, z: 0.4 };

    const cleaves = runUntilCleave(n1.id);
    expect(cleaves.length).toBe(2);

    const [primary, splash] = cleaves.map((e) => e.damage).sort((x, y) => y - x);
    // splashDamageMultiplier 0.6 applied to the skill multiplier (1.20 → 0.72);
    // calcSkillDamage is pure base×mult×dexBonus, so the ratio is ~0.6 with crit off.
    expect(splash).toBeLessThan(primary);
    expect(splash / primary).toBeGreaterThan(0.55);
    expect(splash / primary).toBeLessThan(0.65);
  });
});
