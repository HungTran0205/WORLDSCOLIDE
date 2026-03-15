/** Calculate visitor spawn rate per game day based on reception quality */
export function calcVisitorSpawnRate(receptionQuality: number): number {
  return 2 + Math.floor(receptionQuality * 0.5);
}

/** Calculate recruitment success probability */
export function calcRecruitSuccess(
  recruitLevel: number,
  founderCha: number,
  hallQuality: number,
): number {
  const base = 0.95 - (recruitLevel - 1) * 0.02;
  const chaBonus = founderCha * 0.005;
  const hallBonus = hallQuality * 0.02;
  return Math.min(0.99, Math.max(0.1, base + chaBonus + hallBonus));
}

/** Roll recruitment attempt */
export function rollRecruitment(successRate: number): boolean {
  return Math.random() < successRate;
}
