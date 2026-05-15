import '@/ui/styles/rank-badge.css';
import { GUILD_RANKS } from '@/game/data/ranks';
import type { MemberRank, GuildRank } from '@/game/state/game-state';
import { GameIcon } from './game-icon';

const RANK_SOFT: Partial<Record<MemberRank, string>> = {
  RECRUIT:   'rgba(125,138,155,.18)',
  MEMBER:    'rgba(74,144,217,.20)',
  VETERAN:   'rgba(109,191,109,.20)',
  OFFICER:   'rgba(159,122,204,.20)',
  COMMANDER: 'rgba(255,215,0,.30)',
  MERCENARY: 'rgba(196,74,74,.20)',
};

interface RankBadgeProps {
  rank: MemberRank;
  size?: 'sm' | 'md' | 'lg';
}

export function RankBadge({ rank, size = 'sm' }: RankBadgeProps) {
  const isMerc = rank === 'MERCENARY';
  const rankDef = GUILD_RANKS[rank as GuildRank];
  const label = isMerc ? 'MERC' : (rankDef?.label ?? rank);
  const rankColor = isMerc
    ? 'var(--ink-rank-mercenary)'
    : `var(--ink-rank-${rank.toLowerCase()})`;
  const rankSoft = RANK_SOFT[rank] ?? 'rgba(212,168,67,.18)';

  return (
    <span
      className={`rank-badge rank-badge--${rank.toLowerCase()} rank-badge--${size}`}
      style={{ ['--rank-color' as string]: rankColor, ['--rank-soft' as string]: rankSoft } as React.CSSProperties}
    >
      <span className="rank-badge__frame">
        <GameIcon category="badge" id={rank} size={size === 'lg' ? 48 : size === 'md' ? 36 : 14} fallbackText="" alt={label} />
      </span>
      <span className="rank-badge__label">{label}</span>
    </span>
  );
}
