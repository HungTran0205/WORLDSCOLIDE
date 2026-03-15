/** EXP to reach next level from current level */
export function expToNextLevel(currentLevel: number): number {
  if (currentLevel <= 1) return 100;
  if (currentLevel === 2) return 150;
  if (currentLevel === 3) return 220;
  if (currentLevel === 4) return 310;
  // From lv5+: EXP[n] = EXP[n-1] * 1.35
  let exp = 430;
  for (let i = 5; i < currentLevel; i++) {
    exp = Math.floor(exp * 1.35);
  }
  return exp;
}

/** Process exp gain, handling multi-level jumps */
export function gainExp(
  currentLevel: number,
  currentExp: number,
  amount: number,
): { newLevel: number; remainingExp: number; levelsGained: number } {
  let exp = currentExp + amount;
  let level = currentLevel;
  let levelsGained = 0;

  while (exp >= expToNextLevel(level)) {
    exp -= expToNextLevel(level);
    level++;
    levelsGained++;
  }

  return { newLevel: level, remainingExp: exp, levelsGained };
}

/** Stats gained per level up: +2 auto to all, +5 allocatable */
export const LEVEL_UP_AUTO_STATS = 2;
export const LEVEL_UP_BONUS_POINTS = 5;
