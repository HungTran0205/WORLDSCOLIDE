import { GUILD_RANKS } from '@/game/data/ranks';
import type { MemberRank, GuildRank } from '@/game/state/game-state';
import { GameIcon } from './game-icon';

const MERC_COLOR = '#f0a500';

/** Compact rank badge with icon + rank-specific color */
export function RankBadge({ rank }: { rank: MemberRank }) {
  const isMerc = rank === 'MERCENARY';
  const color = isMerc ? MERC_COLOR : (GUILD_RANKS[rank as GuildRank]?.color ?? '#aaa');
  const label = isMerc ? 'MERC' : (GUILD_RANKS[rank as GuildRank]?.label ?? rank);

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: '0.65rem',
      color,
      marginLeft: 6,
      border: `1px solid ${color}`,
      padding: '1px 4px',
      borderRadius: 3,
    }}>
      <GameIcon category="rank" id={rank} size={14} fallbackText="" alt={label} />
      {label}
    </span>
  );
}
