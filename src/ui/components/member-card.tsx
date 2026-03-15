import { useState, useEffect } from 'react';
import type { Member } from '@/game/state/game-state';
import { StatBar } from './stat-bar';
import { STAT_KEYS } from '@/game/systems/stat-allocation';
import { expToNextLevel } from '@/game/systems/leveling-system';

interface MemberCardProps {
  member: Member;
  onAllocateStat?: (stat: string) => void;
  activeMissionName?: string;
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

export function MemberCard({ member, onAllocateStat, activeMissionName }: MemberCardProps) {
  const expNeeded = expToNextLevel(member.level);
  const expPct = Math.floor((member.exp / expNeeded) * 100);

  // Refresh injury countdown every 10s
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (member.status !== 'injured') return;
    const timer = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(timer);
  }, [member.status]);

  const statusColor = STATUS_COLORS[member.status] ?? '#aaa';
  let statusLabel = STATUS_LABELS[member.status] ?? member.status;
  if (member.status === 'on-mission' && activeMissionName) {
    statusLabel = activeMissionName;
  } else if (member.status === 'injured' && member.injuredUntil) {
    const remaining = Math.max(0, member.injuredUntil - now);
    const mins = Math.ceil(remaining / 60000);
    statusLabel = `Injured (${mins}m)`;
  }

  return (
    <div className="panel-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ color: member.isFounder ? '#ffd700' : '#87ceeb' }}>
          {member.name}
        </strong>
        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
          Lv.{member.level} | {member.civilization}
        </span>
      </div>

      <div style={{ fontSize: '0.75rem', marginBottom: 8, color: '#aaa', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>EXP: {member.exp}/{expNeeded} ({expPct}%)</span>
        <span
          className="member-status-badge"
          style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}55` }}
        >
          {statusLabel}
        </span>
        {member.unallocatedPoints > 0 && (
          <span style={{ color: '#ffd700' }}>{member.unallocatedPoints} pts</span>
        )}
      </div>

      {STAT_KEYS.map((stat) => (
        <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1 }}>
            <StatBar stat={stat} value={member.stats[stat]} />
          </div>
          {member.unallocatedPoints > 0 && onAllocateStat && (
            <button
              onClick={() => onAllocateStat(stat)}
              style={{
                background: 'rgba(255,215,0,0.2)',
                border: '1px solid rgba(255,215,0,0.4)',
                color: '#ffd700',
                width: 20,
                height: 20,
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.7rem',
              }}
            >
              +
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
