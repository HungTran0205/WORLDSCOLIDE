import '@/ui/styles/member-card.css';
import { useState } from 'react';
import type { Member } from '@/game/state/game-state';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';
import { resolveMemberMaskId, getMaskAssetPath } from '@/scene/sprites/mask-pool';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { civName } from '@/i18n/content-wrappers';
import { GameIcon } from './game-icon';

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
  const [maskFailed, setMaskFailed] = useState(false);
  const avatarUrl = getAvatarUrl(member);
  const maskUrl = getMaskAssetPath(resolveMemberMaskId(member), 'front');
  const civConfig = CIV_CONFIG[member.civilization as Civilization];
  const top2 = topTwoStats(member);
  const statusColor = STATUS_COLOR[member.status] ?? 'var(--ink-text-muted)';
  const initials = (member.name || '??').slice(0, 2).toUpperCase();
  const rankLc = member.rank.toLowerCase();

  return (
    <button
      className={`member-card member-card--${rankLc} ink-pixelated`}
      data-status={member.status}
      onClick={onClick}
      type="button"
    >
      <span className="corner-bl" />
      <span className="corner-br" />

      <div className="card-avatar">
        <div className="card-insignia">
          <GameIcon category="badge" id={member.rank} size={20} fallbackText="" alt={member.rank} />
        </div>
        {!imgFailed && avatarUrl ? (
          <img src={avatarUrl} alt={member.name} onError={() => setImgFailed(true)} />
        ) : (
          <div className="card-avatar-initials">{initials}</div>
        )}
        {!maskFailed && (
          <img
            className="card-mask-overlay"
            src={maskUrl}
            alt=""
            aria-hidden
            onError={() => setMaskFailed(true)}
          />
        )}
      </div>

      <div className="card-info">
        <div className="card-name">{member.name || '???'}</div>
        <div className="card-meta">
          <span className="card-rank">{member.rank}</span>
          {civConfig && <span className="card-civ">{civName(member.civilization as Civilization)}</span>}
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
