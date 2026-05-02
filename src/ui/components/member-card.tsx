import { useState } from 'react';
import type { Member } from '@/game/state/game-state';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';

const STATUS_COLOR: Record<string, string> = {
  idle:         'var(--ink-status-ok)',
  training:     'var(--ink-status-ok)',
  'on-mission': 'var(--ink-status-warn)',
  assigned:     'var(--ink-status-warn)',
  injured:      'var(--ink-status-bad)',
};

function getAvatarUrl(member: Member): string {
  if (!member.archetype || !member.gender) return '';
  return `${getSpritePath(member.civilization, member.archetype, member.gender)}/animations/avatar/frame_000.png`;
}

function topTwoStats(member: Member): [string, number][] {
  return (Object.entries(member.stats) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);
}

interface MemberCardProps {
  member: Member;
  onClick: () => void;
}

/** Grid card for the member browser — avatar, name, rank, civ, top stats, status dot */
export function MemberCard({ member, onClick }: MemberCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const avatarUrl = getAvatarUrl(member);
  const civConfig = CIV_CONFIG[member.civilization as Civilization];
  const top2 = topTwoStats(member);
  const statusColor = STATUS_COLOR[member.status] ?? 'var(--ink-text-muted)';
  const initials = (member.name || '??').slice(0, 2).toUpperCase();

  return (
    <button className="member-card ink-pixelated" onClick={onClick} type="button">
      <div className="card-avatar">
        {!imgFailed && avatarUrl ? (
          <img src={avatarUrl} alt={member.name} onError={() => setImgFailed(true)} />
        ) : (
          <div className="card-avatar-initials">{initials}</div>
        )}
      </div>

      <div className="card-info">
        <div className="card-name">{member.name || '???'}</div>
        <div className="card-meta">
          <span className="card-rank ink-label">{member.rank}</span>
          {civConfig && <span className="card-civ">{civConfig.displayName}</span>}
        </div>
        <div className="card-stats">
          {top2.map(([key, val]) => (
            <span key={key} className="ink-stat">{key} {val}</span>
          ))}
        </div>
      </div>

      <span className="status-dot" style={{ background: statusColor }} />
    </button>
  );
}
