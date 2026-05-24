/**
 * New combat derived stats calculators — section 2.2 of derived-stats-design.md.
 * All functions are pure: no store access, no side effects.
 * Existing base formulas live in combat-formulas.ts; this module reuses them.
 */

import type { Stats } from '@/game/state/game-state';
import {
  calcMaxHp,
  calcAttackInterval,
  calcCritRate,
  calcDefenseRating,
  calcSkillDmgBonus,
} from './combat-formulas';
import type { GearBonuses } from './equipment-bonuses';

export interface DerivedCombatStats {
  // --- Base stats (re-exposed for unified read-model) ---
  /** Max HP: 50 + END×5 + level×10 */
  maxHp: number;
  /** Attack interval in ms — floored at 300ms */
  attackIntervalMs: number;
  /** Display helper: 1000/intervalMs, 2dp */
  hitsPerSecond: number;
  /** 0..0.50 crit chance */
  critRate: number;
  /** Crit damage multiplier — 1.5 base + LCK scaling */
  critDmg: number;
  /** 0..0.75 incoming damage reduction fraction */
  defenseRating: number;
  /** Additive skill damage fraction: DEX×0.5% */
  skillDmgBonus: number;

  // --- New derived combat stats ---
  /** 0..0.30 dodge (complete avoidance) */
  dodgeRate: number;
  /** 0..0.25 block (halves damage on proc) */
  blockRate: number;
  /** HP restored per second */
  hpRegen: number;
  /** 0..0.30 cooldown reduction fraction */
  skillHaste: number;
  /** 0..0.40 status-effect resistance fraction */
  statusResist: number;
  /** Individual morale contribution (+0.1% dmg per CHA point) */
  moraleAura: number;
  /** Flat bonus defense from gear (additive, not folded into defenseRating fraction) */
  bonusDefense: number;
  /** Flat bonus damage from gear */
  bonusDamage: number;
}

// --- Internal calculators ---

function calcCritDmg(lck: number): number {
  return 1.5 + lck * 0.005;
}

function calcDodgeRate(agi: number, dex: number): number {
  return Math.min(0.3, agi * 0.002 + dex * 0.001);
}

function calcBlockRate(end: number, str: number): number {
  return Math.min(0.25, end * 0.002 + str * 0.001);
}

function calcHpRegen(end: number, level: number): number {
  return Math.round((end * 0.1 + level * 0.05) * 100) / 100;
}

function calcSkillHaste(int: number): number {
  return Math.min(0.3, int * 0.003);
}

function calcStatusResist(int: number, end: number): number {
  return Math.min(0.4, int * 0.002 + end * 0.001);
}

function calcMoraleAura(cha: number): number {
  return cha * 0.001;
}

function calcHitsPerSecond(attackIntervalMs: number): number {
  return Math.round((1000 / attackIntervalMs) * 100) / 100;
}

// --- Public API ---

/**
 * Compute all combat derived stats for a member.
 * @param stats     Member's base talent stats
 * @param level     Member level (affects maxHp, hpRegen)
 * @param weaponBaseSpeedMs  Weapon base attack speed in ms (default 1800)
 * @param gearBonuses  Flat bonuses from equipped gear (pass calcGearBonuses result)
 */
export function calcDerivedCombatStats(
  stats: Stats,
  level: number,
  weaponBaseSpeedMs: number = 1800,
  gearBonuses?: GearBonuses,
): DerivedCombatStats {
  const { STR, END, INT, DEX, CHA, LCK, AGI } = stats;
  const gb = gearBonuses ?? { flatHp: 0, flatDefense: 0, flatDamage: 0 };
  const attackIntervalMs = calcAttackInterval(AGI, weaponBaseSpeedMs);
  return {
    maxHp: calcMaxHp(END, level) + gb.flatHp,
    attackIntervalMs,
    hitsPerSecond: calcHitsPerSecond(attackIntervalMs),
    critRate: calcCritRate(LCK),
    critDmg: calcCritDmg(LCK),
    defenseRating: calcDefenseRating(END),
    skillDmgBonus: calcSkillDmgBonus(DEX),
    dodgeRate: calcDodgeRate(AGI, DEX),
    blockRate: calcBlockRate(END, STR),
    hpRegen: calcHpRegen(END, level),
    skillHaste: calcSkillHaste(INT),
    statusResist: calcStatusResist(INT, END),
    moraleAura: calcMoraleAura(CHA),
    bonusDefense: gb.flatDefense,
    bonusDamage: gb.flatDamage,
  };
}
