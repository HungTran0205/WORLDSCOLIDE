/** Grade model — single power axis replacing leveling + guild ranks (GDD §17) */

import type { Stats } from '@/game/state/game-state';
import { STAT_KEYS } from '@/game/systems/stat-allocation';

export type Grade = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export const GRADE_ORDER: Grade[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

export function gradeIndex(g: Grade): number {
  return GRADE_ORDER.indexOf(g); // 0..6
}

export function getNextGrade(g: Grade): Grade | null {
  const i = gradeIndex(g);
  return i < GRADE_ORDER.length - 1 ? GRADE_ORDER[i + 1] : null;
}

/** Stat budget for each grade — total stat points a member of that grade possesses */
export const GRADE_BUDGET: Record<Grade, number> = {
  F: 50,
  E: 58,
  D: 68,
  C: 80,
  B: 95,
  A: 120,
  S: 160,
};

/** Flat HP bonus granted by grade (added to base formula) */
export const GRADE_HP_BONUS: Record<Grade, number> = {
  F: 0,
  E: 15,
  D: 30,
  C: 45,
  B: 60,
  A: 90,
  S: 150,
};

/** Daily upkeep multiplier relative to BASE_UPKEEP */
export const GRADE_UPKEEP_MULT: Record<Grade, number> = {
  F: 0.8,
  E: 1.0,
  D: 1.2,
  C: 1.4,
  B: 1.6,
  A: 2.0,
  S: 2.5,
};

/** Display metadata — label + color (reuses old rank palette so badges stay readable) */
export const GRADE_META: Record<Grade, { label: string; color: string }> = {
  F: { label: 'F', color: '#95a5a6' },
  E: { label: 'E', color: '#7f8c8d' },
  D: { label: 'D', color: '#3498db' },
  C: { label: 'C', color: '#2ecc71' },
  B: { label: 'B', color: '#9b59b6' },
  A: { label: 'A', color: '#e67e22' },
  S: { label: 'S', color: '#ffd700' },
};

/**
 * Derive grade from stat sum — highest grade whose budget ≤ sum.
 * Used for migration and anywhere a possibly-frozen snapshot lacks a grade field.
 */
export function gradeFromStatBudget(statSum: number): Grade {
  let g: Grade = 'F';
  for (const cand of GRADE_ORDER) {
    if (statSum >= GRADE_BUDGET[cand]) g = cand;
  }
  return g;
}

/**
 * Resolve grade from an object that either has grade or needs it derived from stats.
 * Used by memberFromMercContract and promoteMercToMember for frozen in-flight snapshots.
 */
export function gradeOf(v: { grade?: Grade; stats: Stats }): Grade {
  if (v.grade) return v.grade;
  const sum = STAT_KEYS.reduce((s, k) => s + (v.stats?.[k] ?? 0), 0);
  return gradeFromStatBudget(sum);
}
