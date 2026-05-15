/**
 * Party selection list — checkbox-style member selector for quest dispatch.
 * Underleveled members are visually flagged but selectable input is disabled.
 */

import type { Member, Mission } from '@/game/state/game-state';
import { RankBadge } from '@/ui/components/rank-badge';

interface PartySelectListProps {
  availableMembers: Member[];
  selectedMemberIds: string[];
  mission: Mission;
  onToggleMember: (id: string) => void;
}

export function PartySelectList({
  availableMembers,
  selectedMemberIds,
  mission,
  onToggleMember,
}: PartySelectListProps) {
  if (availableMembers.length === 0) {
    return <div className="party-select__empty">No idle members available</div>;
  }

  return (
    <ul className="party-select">
      {availableMembers.map((m) => {
        const underleveled = m.level < mission.requiredLevel;
        const checked = selectedMemberIds.includes(m.id);
        return (
          <li key={m.id} className="party-select__row">
            <label className={`party-select__label${underleveled ? ' party-select__label--disabled' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleMember(m.id)}
                disabled={underleveled}
              />
              <span className="party-select__name">
                {m.name} <span className="party-select__lv">Lv.{m.level}</span>
              </span>
              <RankBadge rank={m.rank} />
              {underleveled && <span className="party-select__warn">Underleveled</span>}
            </label>
          </li>
        );
      })}
    </ul>
  );
}
