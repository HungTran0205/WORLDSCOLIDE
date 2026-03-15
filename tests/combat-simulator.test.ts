import { describe, it, expect } from 'vitest';
import { calcMaxHp, calcAttackInterval, calcAutoAttackDamage, calcSkillDamage } from '@/game/systems/combat-formulas';
import { simulateCombat } from '@/game/systems/combat-simulator';
import { ENEMIES } from '@/game/data/enemies';
import type { Member } from '@/game/state/game-state';

function makeTestMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'test-member',
    name: 'Hero',
    level: 1,
    exp: 0,
    stats: { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 10 },
    unallocatedPoints: 0,
    skill: { id: 'danh-manh', name: 'Danh Manh', damageMultiplier: 1.25, cooldownMs: 8000, autoEnabled: false },
    status: 'idle',
    injuredUntil: null,
    civilization: 'Viet',
    isFounder: true,
    ...overrides,
  };
}

describe('Combat Formulas', () => {
  it('should calculate max HP from END + level', () => {
    expect(calcMaxHp(10, 1)).toBe(110); // 50 + 10*5 + 1*10
    expect(calcMaxHp(20, 5)).toBe(200); // 50 + 20*5 + 5*10
  });

  it('should calculate attack interval with AGI scaling', () => {
    // Default weapon (longsword 1800ms base)
    expect(calcAttackInterval(0)).toBe(1800);  // 1800 / (1+0) = 1800
    expect(calcAttackInterval(100)).toBe(900);  // 1800 / 2 = 900
    expect(calcAttackInterval(50)).toBe(1200);  // 1800 / 1.5 = 1200

    // Dagger (1000ms base)
    expect(calcAttackInterval(100, 1000)).toBe(500); // 1000 / 2 = 500

    // Floor at 300ms
    expect(calcAttackInterval(1000, 1000)).toBeGreaterThanOrEqual(300);
  });

  it('should calculate auto-attack damage with defense', () => {
    const dmg = calcAutoAttackDamage(10, 10);
    expect(dmg).toBeGreaterThanOrEqual(1);

    // Higher STR = more damage
    expect(calcAutoAttackDamage(20, 10)).toBeGreaterThan(calcAutoAttackDamage(10, 10));

    // Higher target END = less damage
    expect(calcAutoAttackDamage(10, 20)).toBeLessThan(calcAutoAttackDamage(10, 5));
  });

  it('should floor damage at 1', () => {
    expect(calcAutoAttackDamage(0, 100)).toBe(1);
  });

  it('should calculate skill damage with DEX bonus', () => {
    const base = calcAutoAttackDamage(10, 5);
    const skillDmg = calcSkillDamage(base, 1.25, 10);
    expect(skillDmg).toBeGreaterThan(base);
  });
});

describe('Combat Simulator', () => {
  it('should defeat slimes with a decent founder', () => {
    const founder = makeTestMember();
    const enemies = [ENEMIES['slime'], ENEMIES['slime'], ENEMIES['slime']];
    const result = simulateCombat([founder], enemies);

    expect(result.outcome).not.toBe('full-wipe');
    expect(result.survivors.length).toBeGreaterThan(0);
    expect(result.ticks.length).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThan(0);
  });

  it('should produce full wipe against overwhelmingly strong enemies', () => {
    const weakMember = makeTestMember({
      stats: { STR: 1, END: 1, INT: 1, DEX: 1, CHA: 1, LCK: 1, AGI: 1 },
    });
    const enemies = Array(5).fill(ENEMIES['orc-warrior']);
    const result = simulateCombat([weakMember], enemies);

    expect(result.outcome).toBe('full-wipe');
    expect(result.injured.length).toBeGreaterThan(0);
  });

  it('should record death events', () => {
    const founder = makeTestMember({
      stats: { STR: 20, END: 20, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 10 },
    });
    const enemies = [ENEMIES['slime']];
    const result = simulateCombat([founder], enemies);

    const deathEvents = result.ticks.flatMap((t) =>
      t.events.filter((e) => e.type === 'death'),
    );
    expect(deathEvents.length).toBeGreaterThan(0);
  });

  it('should complete within MAX_TICKS', () => {
    const founder = makeTestMember();
    const enemies = [ENEMIES['slime']];
    const result = simulateCombat([founder], enemies);
    expect(result.durationMs).toBeLessThan(10000 * 500); // MAX_TICKS * TICK_MS
  });
});
