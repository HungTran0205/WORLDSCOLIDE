import type { Member } from '@/game/state/game-state';
import { GRADE_UPKEEP_MULT, gradeIndex } from '@/game/data/grades';
import type { Grade } from '@/game/data/grades';

const BASE_UPKEEP = 5;
const DEBT_GRACE_DAYS = 3;

/** Upkeep per member per game-day — base cost scaled by grade multiplier */
export function calcMemberUpkeep(member: { grade: Grade; isMercenary: boolean }): number {
  if (member.isMercenary) return 0;
  return Math.round(BASE_UPKEEP * GRADE_UPKEEP_MULT[member.grade]);
}

/** Total daily upkeep — mercenaries excluded (they charge per-mission instead) */
export function calcTotalUpkeep(members: Member[]): number {
  return members
    .filter((m) => !m.isMercenary)
    .reduce((sum, m) => sum + calcMemberUpkeep(m), 0);
}

/** Charge upkeep for N game days. Returns new gold and debt info. */
export function chargeUpkeep(
  gold: number,
  members: Member[],
  gameDays: number,
): { newGold: number; debt: number; daysInDebt: number } {
  const dailyCost = calcTotalUpkeep(members);
  const totalCost = dailyCost * gameDays;

  if (gold >= totalCost) {
    return { newGold: gold - totalCost, debt: 0, daysInDebt: 0 };
  }

  const affordableDays = dailyCost > 0 ? Math.floor(gold / dailyCost) : gameDays;
  const remainingDays = gameDays - affordableDays;

  return {
    newGold: gold - affordableDays * dailyCost,
    debt: dailyCost * remainingDays,
    daysInDebt: remainingDays,
  };
}

/** When debt exceeds grace period, remove lowest-grade non-founder member */
export function processDebtPenalty(
  roster: Member[],
  daysInDebt: number,
): { updatedRoster: Member[]; removedMembers: Member[] } {
  if (daysInDebt < DEBT_GRACE_DAYS) {
    return { updatedRoster: roster, removedMembers: [] };
  }

  // Mercenaries are excluded from eviction (no upkeep, no debt liability)
  const nonFounders = roster.filter((m) => !m.isFounder && !m.isMercenary);
  if (nonFounders.length === 0) {
    return { updatedRoster: roster, removedMembers: [] };
  }

  // Evict lowest-grade first
  const sorted = [...nonFounders].sort((a, b) => gradeIndex(a.grade) - gradeIndex(b.grade));
  const toRemove = sorted.slice(0, 1);
  const remaining = roster.filter((m) => !toRemove.includes(m));

  return { updatedRoster: remaining, removedMembers: toRemove };
}
