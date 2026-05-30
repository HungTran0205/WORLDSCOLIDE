/**
 * Derived combat stats calculator tests.
 * Covers: dodge/block with gear bonuses, accuracy, attack interval with speed bonus, shield charges.
 */

import { describe, it, expect } from 'vitest';
import { calcDerivedCombatStats } from './derived-combat-stats';
import type { Stats } from '@/game/state/game-state';
import type { GearBonuses } from './equipment-bonuses';

const BASE_STATS: Stats = {
  STR: 5,
  END: 5,
  INT: 5,
  DEX: 5,
  CHA: 5,
  LCK: 5,
  AGI: 5,
};

describe('derived-combat-stats: calcDerivedCombatStats', () => {
  describe('dodge rate with gear bonus', () => {
    it('sums stat-based dodge + gear dodge bonus', () => {
      const stats: Stats = { ...BASE_STATS, AGI: 100, DEX: 50 };
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0.10,
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 0,
      };
      const derived = calcDerivedCombatStats(stats, 1, 1800, gearBonuses);
      // baseDodge = min(0.30, 100*0.002 + 50*0.001) = min(0.30, 0.25) = 0.25
      // gearDodge = min(0.20, 0.10) = 0.10
      // total = 0.35
      expect(derived.dodgeRate).toBe(0.35);
    });

    it('caps stat-based dodge at 0.30', () => {
      const stats: Stats = { ...BASE_STATS, AGI: 500, DEX: 500 };
      const derived = calcDerivedCombatStats(stats, 1, 1800);
      // baseDodge = min(0.30, huge_value) = 0.30
      expect(derived.dodgeRate).toBe(0.30);
    });

    it('caps gear dodge bonus at 0.20', () => {
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 1.0, // Way over the cap
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 0,
      };
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800, gearBonuses);
      // baseDodge = 0.035, gearDodge = min(0.20, 1.0) = 0.20
      expect(derived.dodgeRate).toBeLessThanOrEqual(0.235); // 0.035 + 0.20
    });

    it('combined dodge can reach 0.50 (0.30 base + 0.20 gear)', () => {
      const stats: Stats = { ...BASE_STATS, AGI: 500, DEX: 500 };
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0.20,
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 0,
      };
      const derived = calcDerivedCombatStats(stats, 1, 1800, gearBonuses);
      expect(derived.dodgeRate).toBe(0.50);
    });

    it('respects separate caps: base 0.30, gear 0.20 (can exceed individually)', () => {
      const stats: Stats = { ...BASE_STATS, AGI: 200, DEX: 100 }; // baseDodge = 200*0.002 + 100*0.001 = 0.5, capped at 0.30
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0.25, // Over gear cap of 0.20
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 0,
      };
      const derived = calcDerivedCombatStats(stats, 1, 1800, gearBonuses);
      // baseDodge = min(0.30, 0.5) = 0.30, gearDodge = min(0.20, 0.25) = 0.20
      expect(derived.dodgeRate).toBe(0.50);
    });
  });

  describe('block rate with gear bonus', () => {
    it('sums stat-based block + gear block bonus', () => {
      const stats: Stats = { ...BASE_STATS, END: 100, STR: 50 };
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0,
        blockBonus: 0.08,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 0,
      };
      const derived = calcDerivedCombatStats(stats, 1, 1800, gearBonuses);
      // baseBlock = min(0.25, 100*0.002 + 50*0.001) = min(0.25, 0.25) = 0.25
      // gearBlock = min(0.20, 0.08) = 0.08
      // total = 0.33
      expect(derived.blockRate).toBe(0.33);
    });

    it('caps stat-based block at 0.25', () => {
      const stats: Stats = { ...BASE_STATS, END: 500, STR: 500 };
      const derived = calcDerivedCombatStats(stats, 1, 1800);
      expect(derived.blockRate).toBe(0.25);
    });

    it('caps gear block bonus at 0.20', () => {
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0,
        blockBonus: 1.0,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 0,
      };
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800, gearBonuses);
      expect(derived.blockRate).toBeLessThanOrEqual(0.245); // 0.045 + 0.20
    });
  });

  describe('accuracy bonus', () => {
    it('passes through gear accuracy bonus unchanged', () => {
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0,
        blockBonus: 0,
        accuracyBonus: 0.15,
        attackSpeedBonus: 0,
        shieldCharges: 0,
      };
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800, gearBonuses);
      expect(derived.accuracy).toBe(0.15);
    });

    it('defaults to 0 accuracy when no gear', () => {
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800);
      expect(derived.accuracy).toBe(0);
    });
  });

  describe('attack interval with speed bonus', () => {
    it('reduces attack interval with positive attack speed bonus', () => {
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0,
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 0.10, // 10% speed increase
        shieldCharges: 0,
      };
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800, gearBonuses);
      // Base interval: 1800ms / (1 + 0.10) ≈ 1636ms
      expect(derived.attackIntervalMs).toBeLessThan(1800);
      expect(derived.attackIntervalMs).toBeGreaterThan(1500);
    });

    it('enforces 300ms minimum attack interval', () => {
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0,
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 5.0, // Extreme speed bonus
        shieldCharges: 0,
      };
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800, gearBonuses);
      expect(derived.attackIntervalMs).toBe(300); // Floored at 300
    });

    it('calculates hits per second correctly', () => {
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800);
      // hitsPerSecond = 1000 / intervalMs
      expect(derived.hitsPerSecond).toBeCloseTo(1000 / derived.attackIntervalMs, 1);
    });

    it('uses custom weapon base speed if provided', () => {
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0,
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 0,
      };
      const fastWeapon = 1000; // Faster weapon
      const derived = calcDerivedCombatStats(BASE_STATS, 1, fastWeapon, gearBonuses);
      expect(derived.attackIntervalMs).toBeLessThan(1800);
    });
  });

  describe('shield charges', () => {
    it('passes through shield charges from gear bonuses', () => {
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0,
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 3,
      };
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800, gearBonuses);
      expect(derived.shieldCharges).toBe(3);
    });

    it('defaults to 0 shield charges when no gear', () => {
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800);
      expect(derived.shieldCharges).toBe(0);
    });

    it('sums multiple shield charges', () => {
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0,
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 5,
      };
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800, gearBonuses);
      expect(derived.shieldCharges).toBe(5);
    });
  });

  describe('hp bonus from gear', () => {
    it('adds flat hp from gear bonuses', () => {
      const baseDerived = calcDerivedCombatStats(BASE_STATS, 1, 1800);
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 50,
        flatDefense: 0,
        dodgeBonus: 0,
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 0,
      };
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800, gearBonuses);
      expect(derived.maxHp).toBe(baseDerived.maxHp + 50);
    });
  });

  describe('defense bonus from gear', () => {
    it('passes through flat defense from gear bonuses', () => {
      const gearBonuses: GearBonuses = {
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 25,
        dodgeBonus: 0,
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 0,
      };
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800, gearBonuses);
      expect(derived.bonusDefense).toBe(25);
    });
  });

  describe('damage bonus from gear', () => {
    it('passes through flat damage from gear bonuses', () => {
      const gearBonuses: GearBonuses = {
        flatDamage: 15,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0,
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 0,
      };
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800, gearBonuses);
      expect(derived.bonusDamage).toBe(15);
    });
  });

  describe('stat-based derived stats (unchanged)', () => {
    it('calculates max hp from END and level', () => {
      const stats: Stats = { ...BASE_STATS, END: 10 };
      const derived = calcDerivedCombatStats(stats, 5, 1800);
      // maxHp = 50 + END*5 + level*10 = 50 + 50 + 50 = 150
      expect(derived.maxHp).toBe(150);
    });

    it('calculates crit rate from LCK', () => {
      const stats: Stats = { ...BASE_STATS, LCK: 20 };
      const derived = calcDerivedCombatStats(stats, 1, 1800);
      // critRate = min(0.50, LCK*0.01) = min(0.50, 0.20) = 0.20
      expect(derived.critRate).toBeGreaterThan(0);
      expect(derived.critRate).toBeLessThanOrEqual(0.50);
    });

    it('calculates crit damage from LCK', () => {
      const stats: Stats = { ...BASE_STATS, LCK: 50 };
      const derived = calcDerivedCombatStats(stats, 1, 1800);
      // critDmg = 1.5 + LCK*0.005 = 1.5 + 0.25 = 1.75
      expect(derived.critDmg).toBe(1.75);
    });

    it('calculates defense rating from END', () => {
      const stats: Stats = { ...BASE_STATS, END: 50 };
      const derived = calcDerivedCombatStats(stats, 1, 1800);
      // defenseRating = min(0.75, END*0.003) = min(0.75, 0.15) = 0.15
      expect(derived.defenseRating).toBeGreaterThan(0);
      expect(derived.defenseRating).toBeLessThanOrEqual(0.75);
    });
  });

  describe('no gear bonus provided (defaults)', () => {
    it('fills in default zero bonuses when gearBonuses is undefined', () => {
      const derived = calcDerivedCombatStats(BASE_STATS, 1, 1800, undefined);
      expect(derived.dodgeRate).toBeGreaterThanOrEqual(0);
      expect(derived.blockRate).toBeGreaterThanOrEqual(0);
      expect(derived.accuracy).toBe(0);
      expect(derived.bonusDefense).toBe(0);
      expect(derived.bonusDamage).toBe(0);
      expect(derived.shieldCharges).toBe(0);
    });
  });
});
