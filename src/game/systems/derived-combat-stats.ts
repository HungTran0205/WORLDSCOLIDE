/**
 * Combat derived stats calculators.
 * All functions are pure: no store access, no side effects.
 * Base formulas live in combat-formulas.ts; this module reuses them.
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
  // --- Base stats ---
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
  /**
   * Dodge fraction (complete avoidance).
   * Base cap: 0.30 from AGI/DEX. Gear DODGE affixes add on top, capped
   * separately at 0.20 — so combined max is 0.50. This lets tanky armor
   * builds feel distinct from raw-stat dodge without compressing the
   * base-stat progression.
   */
  dodgeRate: number;
  /**
   * Block fraction (halves damage on proc).
   * Base: END/STR, cap 0.25. Gear BLOCK adds on top, cap 0.20.
   */
  blockRate: number;
  /** HP restored per second */
  hpRegen: number;
  /** 0..0.30 cooldown reduction fraction */
  skillHaste: number;
  /** 0..0.40 status-effect resistance fraction */
  statusResist: number;
  /** Individual morale contribution (+0.1% dmg per CHA point) */
  moraleAura: number;
  /** Flat bonus defense from gear */
  bonusDefense: number;
  /** Flat bonus damage from gear */
  bonusDamage: number;
  /** Gear accuracy (subtracts from enemy dodge roll). Enemies have 0. */
  accuracy: number;
  /** Shield charges granted at combat start from SHIELD affixes. Transient — not persisted. */
  shieldCharges: number;
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
  const gb = gearBonuses ?? {
    flatHp: 0, flatDefense: 0, flatDamage: 0,
    dodgeBonus: 0, blockBonus: 0, accuracyBonus: 0, attackSpeedBonus: 0,
    shieldCharges: 0,
  };

  // Gear DODGE/BLOCK stack on top of the stat base with their own caps
  const baseDodge = calcDodgeRate(AGI, DEX);
  const baseBlock = calcBlockRate(END, STR);
  const gearDodge = Math.min(0.20, gb.dodgeBonus);
  const gearBlock = Math.min(0.20, gb.blockBonus);

  const attackIntervalMs = calcAttackInterval(AGI, weaponBaseSpeedMs, gb.attackSpeedBonus);

  return {
    maxHp: calcMaxHp(END, level) + gb.flatHp,
    attackIntervalMs,
    hitsPerSecond: calcHitsPerSecond(attackIntervalMs),
    critRate: calcCritRate(LCK),
    critDmg: calcCritDmg(LCK),
    defenseRating: calcDefenseRating(END),
    skillDmgBonus: calcSkillDmgBonus(DEX),
    dodgeRate: baseDodge + gearDodge,
    blockRate: baseBlock + gearBlock,
    hpRegen: calcHpRegen(END, level),
    skillHaste: calcSkillHaste(INT),
    statusResist: calcStatusResist(INT, END),
    moraleAura: calcMoraleAura(CHA),
    bonusDefense: gb.flatDefense,
    bonusDamage: gb.flatDamage,
    accuracy: gb.accuracyBonus,
    shieldCharges: gb.shieldCharges,
  };
}
