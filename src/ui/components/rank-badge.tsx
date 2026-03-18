import { GUILD_RANKS } from '@/game/data/ranks';
import type { MemberRank, GuildRank } from '@/game/state/game-state';

const MERC_COLOR = '#f0a500';

/** Compact rank badge with rank-specific color */
export function RankBadge({ rank }: { rank: MemberRank }) {
  const isMerc = rank === 'MERCENARY';
  const color = isMerc ? MERC_COLOR : (GUILD_RANKS[rank as GuildRank]?.color ?? '#aaa');
  const label = isMerc ? 'MERC' : (GUILD_RANKS[rank as GuildRank]?.label ?? rank);

  return (
    <span style={{
      fontSize: '0.65rem',
      color,
      marginLeft: 6,
      border: `1px solid ${color}`,
      padding: '1px 4px',
      borderRadius: 3,
    }}>
      {label}
    </span>
  );
}
