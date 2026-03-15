/** Max HP from END + level */
export function calcMaxHp(end: number, level: number): number {
  return Math.floor(50 + end * 5 + level * 10);
}

/** Attack interval from AGI + weapon base speed (Option 2). Floor at 300ms. */
export function calcAttackInterval(agi: number, weaponBaseSpeedMs: number = 1800): number {
  const interval = weaponBaseSpeedMs / (1 + agi / 100);
  return Math.max(300, Math.floor(interval));
}

/** Base auto-attack damage with defense reduction */
export function calcAutoAttackDamage(str: number, targetEnd: number, weaponMult: number = 1.0): number {
  const defRatio = Math.min(0.75, targetEnd / (targetEnd + 100));
  const raw = str * weaponMult * (1 - defRatio);
  return Math.max(1, Math.floor(raw));
}

/** Skill damage with DEX bonus */
export function calcSkillDamage(baseDamage: number, skillMultiplier: number, dex: number): number {
  const dexBonus = 1 + dex * 0.005;
  return Math.floor(baseDamage * skillMultiplier * dexBonus);
}

/** Crit roll based on LCK */
export function rollCrit(lck: number): boolean {
  const critRate = Math.min(0.5, 0.05 + lck * 0.003);
  return Math.random() < critRate;
}

export const CRIT_MULTIPLIER = 1.5;
