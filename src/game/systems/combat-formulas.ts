/** Max HP from END + level */
export function calcMaxHp(end: number, level: number): number {
  return Math.floor(50 + end * 5 + level * 10);
}

/** Attack interval from AGI + weapon base speed (Option 2). Floor at 300ms. */
export function calcAttackInterval(agi: number, weaponBaseSpeedMs: number = 1800): number {
  const interval = weaponBaseSpeedMs / (1 + agi / 100);
  return Math.max(300, Math.floor(interval));
}

/** Base auto-attack damage with defense reduction. flatBonus (weapon gear) applied before defense reduction. */
export function calcAutoAttackDamage(
  str: number,
  targetEnd: number,
  weaponMult: number = 1.0,
  flatBonus: number = 0,
): number {
  const defRatio = Math.min(0.75, targetEnd / (targetEnd + 100));
  const raw = (str * weaponMult + flatBonus) * (1 - defRatio);
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
