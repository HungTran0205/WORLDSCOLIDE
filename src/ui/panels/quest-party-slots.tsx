/**
 * Quest party slot row — facility-style square slots for dispatch party selection.
 * Filled slots reuse the shared member-avatar tile (sprite + name + × remove);
 * empty/add slots open the roster picker. "Required + expandable": render
 * max(requiredMembers, selected) committed slots, plus one trailing add-slot
 * while the party is below the soft cap and idle members remain.
 */

import { useTranslation } from 'react-i18next';
import type { Member, Mission } from '@/game/state/game-state';
import { FacilityMemberAvatar } from '@/ui/components/facility-member-avatar';

/** UI-only ceiling on quest party size. Dispatch validation enforces only the
 *  minimum (requiredMembers); this caps how many extra members can be stacked. */
export const QUEST_PARTY_SOFT_CAP = 6;

interface QuestPartySlotsProps {
  availableMembers: Member[];
  selectedMemberIds: string[];
  mission: Mission;
  /** Remove a member from the party (drops the id from selection). */
  onRemove: (id: string) => void;
  /** Open the roster picker for the empty/add slot at this index. */
  onOpenPicker: (slotIndex: number) => void;
}

export function QuestPartySlots({
  availableMembers,
  selectedMemberIds,
  mission,
  onRemove,
  onOpenPicker,
}: QuestPartySlotsProps) {
  const { t } = useTranslation();

  // Selected members in selection order (only those still available/idle show a tile).
  const selected = selectedMemberIds
    .map((id) => availableMembers.find((m) => m.id === id))
    .filter((m): m is Member => !!m);

  const filled = selected.length;
  const required = mission.requiredMembers;
  const committed = Math.max(required, filled); // filled tiles + mandatory empty slots
  const emptyCount = committed - filled;

  const canAddMore = filled < QUEST_PARTY_SOFT_CAP && filled < availableMembers.length;
  // Only show a trailing add-slot once every committed slot is filled — otherwise
  // the mandatory empty slots already serve as the next assign targets.
  const showAddSlot = emptyCount === 0 && canAddMore;

  return (
    <div className="quest-party-slots" role="group" aria-label={t('questBoard.party.slotsAria')}>
      {selected.map((m) => (
        <FacilityMemberAvatar key={m.id} member={m} onUnassign={onRemove} />
      ))}

      {Array.from({ length: emptyCount }).map((_, i) => {
        const slotIndex = filled + i;
        return (
          <button
            key={`empty-${slotIndex}`}
            type="button"
            className="quest-party-slot"
            onClick={() => onOpenPicker(slotIndex)}
            aria-label={t('questBoard.party.assignAria')}
          >
            <span className="quest-party-slot__plus" aria-hidden="true">＋</span>
            <span className="quest-party-slot__label">{t('questBoard.party.assign')}</span>
          </button>
        );
      })}

      {showAddSlot && (
        <button
          type="button"
          className="quest-party-slot quest-party-slot--add"
          onClick={() => onOpenPicker(filled)}
          aria-label={t('questBoard.party.addAria')}
        >
          <span className="quest-party-slot__plus" aria-hidden="true">＋</span>
          <span className="quest-party-slot__label">{t('questBoard.party.add')}</span>
        </button>
      )}
    </div>
  );
}
