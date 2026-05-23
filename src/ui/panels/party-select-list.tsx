/**
 * Party selection list — card-button member selector for quest dispatch.
 * Uses <button aria-pressed> cards instead of checkbox labels so the entire
 * card is the hit target and keyboard/screen-reader flow is preserved.
 *
 * A11y note: underleveled members use aria-disabled + click-guard (NOT the
 * native disabled attribute). Native disabled removes the element from the
 * tab order, meaning a screen reader can never announce why the member is
 * unavailable. aria-disabled keeps the card focusable while the click-guard
 * prevents actual selection.
 */

import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  if (availableMembers.length === 0) {
    return <div className="party-select__empty">{t('partySelect.empty')}</div>;
  }

  return (
    <ul className="party-select">
      {availableMembers.map((m) => {
        const underleveled = m.level < mission.requiredLevel;
        const checked = selectedMemberIds.includes(m.id);

        // Build class string for card — --selected and --disabled are independent
        let cardClass = 'party-select__card';
        if (checked) cardClass += ' party-select__card--selected';
        if (underleveled) cardClass += ' party-select__card--disabled';

        // Accessible label: underleveled members get the reason appended so
        // screen readers announce it when the (still-focusable) card is reached.
        const ariaLabel = underleveled
          ? `${m.name}, Lv.${m.level}, ${t('partySelect.underleveled')}`
          : undefined;

        return (
          <li key={m.id} className="party-select__row">
            <button
              type="button"
              className={cardClass}
              aria-pressed={checked}
              aria-disabled={underleveled ? 'true' : undefined}
              aria-label={ariaLabel}
              onClick={() => {
                // Click-guard: underleveled members must not be selectable.
                // We keep the card in the tab order (no native disabled) so
                // the screen reader can reach and announce the reason above.
                if (underleveled) return;
                onToggleMember(m.id);
              }}
            >
              {/* Selection indicator — visible checkmark when card is active */}
              <span className="party-select__card-check" aria-hidden="true">
                {checked ? '✓' : ''}
              </span>

              <span className="party-select__name">
                {m.name} <span className="party-select__lv">Lv.{m.level}</span>
              </span>

              <RankBadge rank={m.rank} />

              {underleveled && (
                <span className="party-select__warn" aria-hidden="true">
                  {t('partySelect.underleveled')}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
