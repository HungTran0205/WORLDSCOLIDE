/** Left-edge bookmark column for the Guild Roster book UI. */

import type { Member } from '@/game/state/game-state';
import { getCivColor } from '@/game/data/civilization-config';

interface MemberBookmarkListProps {
  members: Member[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Status dot color — founder = gold, mercenary = amber, otherwise status-based */
function getStatusColor(member: Member): string {
  if (member.isFounder) return '#ffd700';
  if (member.isMercenary) return '#f0a500';
  const STATUS_DOT: Record<string, string> = {
    idle: '#2ecc71',
    'on-mission': '#4a90d9',
    injured: '#e74c3c',
    training: '#9b59b6',
  };
  return STATUS_DOT[member.status] ?? '#aaa';
}

export function MemberBookmarkList({ members, selectedId, onSelect }: MemberBookmarkListProps) {
  return (
    <div style={{
      width: 78, flexShrink: 0,
      background: 'rgba(10,10,20,0.6)',
      borderRight: '1px solid rgba(255,215,0,0.12)',
      overflowY: 'auto', overflowX: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {members.map((m) => {
        const isActive = m.id === selectedId;
        const civColor = getCivColor(m.civilization);
        const statusColor = getStatusColor(m);
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, padding: '10px 4px', cursor: 'pointer',
              background: isActive ? 'rgba(255,215,0,0.07)' : 'transparent',
              border: 'none',
              borderRight: isActive ? '3px solid #ffd700' : '3px solid transparent',
              color: 'inherit', width: '100%', flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: civColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', color: '#fff', fontWeight: 'bold',
              border: m.isFounder ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.15)',
              flexShrink: 0,
            }}>
              {m.name.slice(0, 2)}
            </div>
            {/* Short name — first word only */}
            <span style={{
              fontSize: '0.58rem',
              color: isActive ? '#ffd700' : '#888',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 64, textAlign: 'center',
            }}>
              {m.name.split(' ')[0]}
            </span>
            {/* Status dot */}
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: statusColor, flexShrink: 0,
            }} />
          </button>
        );
      })}
    </div>
  );
}
