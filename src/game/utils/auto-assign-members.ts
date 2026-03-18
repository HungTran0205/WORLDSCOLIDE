/** Auto-assign best-fit idle members for a mission */

import type { Member, Mission, GuildRank } from '@/game/state/game-state';
import { GUILD_RANKS } from '@/game/data/ranks';

/** Sum all stat values for ranking */
function statTotal(m: Member): number {
  const s = m.stats;
  return s.STR + s.END + s.INT + s.DEX + s.CHA + s.LCK + s.AGI;
}

/**
 * Pick best-fit idle members for a mission.
 * Filter: idle + meets level req. Sort: level desc, stat total desc. Pick top N.
 */
export function autoAssignMembers(
  availableMembers: Member[],
  mission: Mission,
): string[] {
  const eligible = availableMembers
    .filter((m) => m.status === 'idle' && m.level >= mission.requiredLevel);

  // Rank desc, then level desc, then stat total desc
  const sorted = [...eligible].sort((a, b) => {
    const rankA = GUILD_RANKS[a.rank as GuildRank]?.order ?? 0;
    const rankB = GUILD_RANKS[b.rank as GuildRank]?.order ?? 0;
    if (rankB !== rankA) return rankB - rankA;
    if (b.level !== a.level) return b.level - a.level;
    return statTotal(b) - statTotal(a);
  });

  return sorted.slice(0, mission.requiredMembers).map((m) => m.id);
}
