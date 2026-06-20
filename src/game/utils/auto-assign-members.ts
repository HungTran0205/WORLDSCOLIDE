/** Auto-assign best-fit idle members for a mission */

import type { Member, Mission } from '@/game/state/game-state';
import { gradeIndex } from '@/game/data/grades';

/** Sum all stat values for ranking */
function statTotal(m: Member): number {
  const s = m.stats;
  return s.STR + s.END + s.INT + s.DEX + s.CHA + s.LCK + s.AGI;
}

/**
 * Pick best-fit idle members for a mission.
 * Filter: idle. Sort: grade desc, stat total desc. Pick top N.
 */
export function autoAssignMembers(
  availableMembers: Member[],
  mission: Mission,
): string[] {
  const eligible = availableMembers.filter((m) => m.status === 'idle');

  // Grade desc, then stat total desc
  const sorted = [...eligible].sort((a, b) => {
    const gradeDiff = gradeIndex(b.grade) - gradeIndex(a.grade);
    if (gradeDiff !== 0) return gradeDiff;
    return statTotal(b) - statTotal(a);
  });

  return sorted.slice(0, mission.requiredMembers).map((m) => m.id);
}
