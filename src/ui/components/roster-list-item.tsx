import { useState, useEffect } from 'react';
import type { Member } from '@/game/state/game-state';
import { expToNextLevel } from '@/game/systems/leveling-system';
import { getCivColor } from '@/game/data/civilization-config';
import { RankBadge } from './rank-badge';
import { CivBadge } from './civ-badge';

interface RosterListItemProps {
  member: Member;
  isSelected: boolean;
  activeMissionName?: string;
  onClick: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  idle: '#2ecc71',
  'on-mission': '#4a90d9',
  injured: '#e74c3c',
  training: '#9b59b6',
};

const STATUS_LABELS: Record<string, string> = {
  idle: 'Ready',
  'on-mission': 'On Mission',
  injured: 'Injured',
  training: 'Training',
};

/** Compact roster row — shows avatar, name, level, EXP bar, status badge */
export function RosterListItem({ member, isSelected, activeMissionName, onClick }: RosterListItemProps) {
  const expNeeded = expToNextLevel(member.level);
  const expPct = Math.min(100, Math.floor((member.exp / expNeeded) * 100));
  const statusColor = STATUS_COLORS[member.status] ?? '#aaa';
  const civColor = getCivColor(member.civilization);

  // Refresh injury countdown
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (member.status !== 'injured') return;
    const timer = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(timer);
  }, [member.status]);

  let statusLabel = STATUS_LABELS[member.status] ?? member.status;
  if (member.status === 'on-mission' && activeMissionName) {
    statusLabel = activeMissionName;
  } else if (member.status === 'injured' && member.injuredUntil) {
    const mins = Math.max(1, Math.ceil((member.injuredUntil - now) / 60000));
    statusLabel = `Injured (${mins}m)`;
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        cursor: 'pointer',
        borderRadius: 6,
        background: isSelected ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
        border: isSelected ? '1px solid rgba(255,215,0,0.4)' : '1px solid transparent',
        marginBottom: 4,
        transition: 'background 0.15s',
      }}
    >
      {/* Avatar placeholder */}
      <div style={{
        width: 36, height: 36, borderRadius: 6,
        background: civColor, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CivBadge civilization={member.civilization} />
      </div>

      {/* Name + EXP bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
          <span style={{
            color: member.isFounder ? '#ffd700' : '#ddd',
            fontSize: '0.85rem', fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {member.name}
          </span>
          <RankBadge rank={member.rank} />
        </div>
        {/* Thin EXP bar */}
        <div style={{
          height: 3, borderRadius: 2,
          background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
        }}>
          <div style={{ width: `${expPct}%`, height: '100%', background: '#67b8e3' }} />
        </div>
      </div>

      {/* Level */}
      <div style={{
        fontSize: '1.1rem', fontWeight: 'bold', color: '#87ceeb',
        minWidth: 32, textAlign: 'center',
      }}>
        {member.level}
      </div>

      {/* Status + unallocated indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <span style={{
          fontSize: '0.65rem', padding: '2px 6px', borderRadius: 3,
          background: `${statusColor}22`, color: statusColor,
          border: `1px solid ${statusColor}55`, whiteSpace: 'nowrap',
        }}>
          {statusLabel}
        </span>
        {member.unallocatedPoints > 0 && (
          <span style={{
            color: '#2ecc71', fontSize: '0.9rem', fontWeight: 'bold',
            animation: 'pulse 1.5s infinite',
          }} title={`${member.unallocatedPoints} points to allocate`}>
            ▲
          </span>
        )}
      </div>
    </div>
  );
}
