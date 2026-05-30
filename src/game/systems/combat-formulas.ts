/** Max HP from END + flatHpBonus (grade-derived for members, template.level*10 for enemies) */
export function calcMaxHp(end: number, flatHpBonus: number): number {
  return Math.floor(60 + end * 5 + flatHpBonus);
}

/**
 * Attack interval from AGI + weapon base speed + optional gear speed multiplier.
 * attackSpeedMult: additive fraction from ATTACK_SPEED affixes (0.10 = 10% faster).
 * Floor at 300ms. Base cap from AGI unchanged; gear adds on top.
 */
export function calcAttackInterval(
  agi: number,
  weaponBaseSpeedMs: number = 1800,
  attackSpeedMult: number = 0,
): number {
  const agiReduced = weaponBaseSpeedMs / (1 + agi / 100);
  const interval = agiReduced / (1 + attackSpeedMult);
  return Math.max(300, Math.floor(interval));
}

/** Phase 6 balance pass — global damage scalar applied inside calcAutoAttackDamage.
 *  Keeps the formula additive (no save migration needed) while tightening
 *  average battle duration toward the 15–30s target range (D7).
 *  If playtests show battles too short, lower toward 1.0; too long, raise. */
export const BASE_DAMAGE_MULTIPLIER = 1.2;

/** Base auto-attack damage with defense reduction. flatBonus (weapon gear) applied before defense reduction. */
export function calcAutoAttackDamage(
  str: number,
  targetEnd: number,
  weaponMult: number = 1.0,
  flatBonus: number = 0,
  armorPierced = false,
): number {
  const defRatio = armorPierced ? 0 : Math.min(0.75, targetEnd / (targetEnd + 100));
  const raw = (str * weaponMult + flatBonus) * (1 - defRatio) * BASE_DAMAGE_MULTIPLIER;
  return Math.max(1, Math.floor(raw));
}

/** Skill damage with DEX bonus */
export function calcSkillDamage(baseDamage: number, skillMultiplier: number, dex: number): number {
  const dexBonus = 1 + dex * 0.005;
  return Math.floor(baseDamage * skillMultiplier * dexBonus);
}

/** Crit rate as a pure value (0..0.5) — use calcDerivedCombatStats for full derived model */
export function calcCritRate(lck: number): number {
  return Math.min(0.5, 0.05 + lck * 0.003);
}

/** Crit roll based on LCK */
export function rollCrit(lck: number): boolean {
  return Math.random() < calcCritRate(lck);
}

/** Defense damage reduction fraction (0..0.75) */
export function calcDefenseRating(end: number): number {
  return Math.min(0.75, end / (end + 100));
}

/** Skill damage bonus as additive fraction — DEX × 0.5% */
export function calcSkillDmgBonus(dex: number): number {
  return dex * 0.005;
}

export const CRIT_MULTIPLIER = 1.5;

/**
 * Fraction of post-block damage that passes through a shield charge.
 * A shielded hit deals damage × (1 - SHIELD_DAMAGE_REDUCTION) = 20% of incoming.
 */
export const SHIELD_DAMAGE_REDUCTION = 0.80;
