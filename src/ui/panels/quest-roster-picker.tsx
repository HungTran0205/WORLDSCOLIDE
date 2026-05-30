/**
 * Quest roster picker — standalone parchment panel that sits beside the quest
 * board (its own surface, not embedded in the detail pane). Lists the idle
 * roster as MemberCards for filling a party slot. Clicking an eligible card
 * adds that member; already-selected members are excluded; underleveled members
 * are shown disabled with a reason. Closes on pick, Esc, or outside click.
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Member, Mission } from '@/game/state/game-state';
import { MemberCard } from '@/ui/components/member-card';

interface QuestRosterPickerProps {
  open: boolean;
  mission: Mission | null;
  availableMembers: Member[];
  selectedMemberIds: string[];
  onPick: (id: string) => void;
  onClose: () => void;
}

export function QuestRosterPicker({
  open,
  mission,
  availableMembers,
  selectedMemberIds,
  onPick,
  onClose,
}: QuestRosterPickerProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Focus management: remember the slot that opened the picker, move focus
  // inside on open, restore it to the slot on close.
  useEffect(() => {
    if (open) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      const id = window.setTimeout(() => {
        panelRef.current?.querySelector<HTMLButtonElement>('.member-card')?.focus();
      }, 0);
      return () => window.clearTimeout(id);
    }
    restoreFocusRef.current?.focus?.();
  }, [open]);

  // Esc + outside-click close. Clicks on the party slots are ignored so a slot
  // can re-target the picker without it closing first.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.quest-roster-picker') || target.closest('.quest-party-slots')) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, onClose]);

  if (!open || !mission) return null;

  const candidates = availableMembers.filter((m) => !selectedMemberIds.includes(m.id));

  return (
    <div
      ref={panelRef}
      className="quest-roster-picker parchment-surface parchment-frame"
      role="dialog"
      aria-modal="false"
      aria-label={t('questBoard.party.pickerTitle')}
    >
      <header className="quest-roster-picker__head">
        <span className="quest-roster-picker__title">{t('questBoard.party.pickerTitle')}</span>
        <button
          type="button"
          className="quest-roster-picker__close"
          onClick={onClose}
          aria-label={t('questBoard.party.pickerCloseAria')}
        >
          ×
        </button>
      </header>

      {candidates.length === 0 ? (
        <div className="quest-roster-picker__empty">{t('questBoard.party.pickerEmpty')}</div>
      ) : (
        <div className="quest-roster-picker__grid">
          {candidates.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              onClick={() => onPick(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
