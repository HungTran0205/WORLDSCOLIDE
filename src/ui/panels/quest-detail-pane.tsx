/**
 * Quest detail pane — right side of the unified Quest Board.
 * Shows selected quest info, enemy preview, rewards, party select, and dispatch button.
 * Empty state when no quest is selected.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Member, Mission } from '@/game/state/game-state';
import { ENEMIES } from '@/game/data/enemies';
import { autoAssignMembers } from '@/game/utils/auto-assign-members';
import { tContent } from '@/i18n/content-localization';
import { GameIcon } from '@/ui/components/game-icon';
import { PartySelectList } from './party-select-list';

interface QuestDetailPaneProps {
  mission: Mission | null;
  availableMembers: Member[];
  gold: number;
  /** Trigger dispatch with selected member IDs */
  onDispatch: (memberIds: string[]) => void;
  /** Fires every time a party slot is toggled — parent plays wood-clink SFX. */
  onMemberToggle?: (id: string) => void;
  /** Mobile-only: show back-to-list button */
  onBack?: () => void;
}

function getEnemyPreview(enemyIds: string[]) {
  const counts = new Map<string, number>();
  enemyIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  return Array.from(counts.entries()).map(([id, count]) => {
    const enemy = ENEMIES[id];
    return { id, name: enemy?.name ?? id, level: enemy?.level ?? 0, count };
  });
}

export function QuestDetailPane({
  mission,
  availableMembers,
  gold,
  onDispatch,
  onMemberToggle,
  onBack,
}: QuestDetailPaneProps) {
  const { t } = useTranslation();
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Reset selection when switching missions
  const missionKey = mission?.id ?? null;
  useEffect(() => {
    setSelectedMemberIds([]);
  }, [missionKey]);

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    onMemberToggle?.(id);
  };

  const handleAutoAssign = () => {
    if (!mission) return;
    setSelectedMemberIds(autoAssignMembers(availableMembers, mission));
  };

  // Mercenary fee preview
  const mercFee = useMemo(() => {
    if (!mission) return 0;
    const hasMerc = availableMembers
      .filter((m) => selectedMemberIds.includes(m.id))
      .some((m) => m.rank === 'MERCENARY');
    return hasMerc ? Math.floor(mission.goldRewardMin * 0.5) : 0;
  }, [mission, availableMembers, selectedMemberIds]);

  const canAffordFee = gold >= mercFee;
  const canDispatch = !!mission && selectedMemberIds.length >= mission.requiredMembers;

  if (!mission) {
    return (
      <div className="quest-detail-pane quest-detail-pane--empty">
        <div className="quest-detail-pane__empty-art" aria-hidden="true">📜</div>
        <p className="quest-detail-pane__empty-text">{t('questBoard.detail.emptyText')}</p>
      </div>
    );
  }

  const enemies = getEnemyPreview(mission.enemyIds);
  const durationMin = Math.round(mission.durationMs / 60000);

  return (
    <div className="quest-detail-pane">
      {onBack && (
        <button type="button" className="quest-detail-pane__back" onClick={onBack}>
          {t('questBoard.detail.back')}
        </button>
      )}

      <header className="quest-detail-pane__header">
        <h3 className="quest-detail-pane__title">{tContent('missions', mission.id, 'name', mission.name)}</h3>
        <GameIcon
          category="badge"
          id={mission.tier}
          size={40}
          fallbackText={mission.tier}
          alt={t('questBoard.detail.tierAlt', { tier: mission.tier })}
        />
      </header>

      {mission.zone && <div className="quest-detail-pane__zone">{tContent('missions', mission.id, 'zone', mission.zone)}</div>}
      {mission.description && (
        <p className="quest-detail-pane__desc">{tContent('missions', mission.id, 'description', mission.description)}</p>
      )}

      <section className="quest-detail-pane__section">
        <h4 className="quest-detail-pane__section-title">{t('questBoard.detail.enemies')}</h4>
        <ul className="quest-detail-pane__enemies">
          {enemies.map((e) => (
            <li key={e.id} className="quest-detail-pane__enemy">
              {tContent('enemies', e.id, 'name', e.name)} <span className="quest-detail-pane__enemy-lv">{t('questBoard.detail.enemyLevel', { level: e.level })}</span>
              {e.count > 1 && <span className="quest-detail-pane__enemy-count">{t('questBoard.detail.enemyCount', { count: e.count })}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="quest-detail-pane__rewards">
        <div><span className="quest-detail-pane__reward-label">{t('questBoard.detail.rewardGold')}</span> <span className="quest-detail-pane__reward-value quest-detail-pane__reward-value--gold">{mission.goldRewardMin}–{mission.goldRewardMax}</span></div>
        <div><span className="quest-detail-pane__reward-label">{t('questBoard.detail.rewardExp')}</span> <span className="quest-detail-pane__reward-value quest-detail-pane__reward-value--exp">{mission.expReward}</span></div>
        <div><span className="quest-detail-pane__reward-label">{t('questBoard.detail.rewardDuration')}</span> <span className="quest-detail-pane__reward-value">{t('questBoard.detail.durationValue', { mins: durationMin })}</span></div>
        <div><span className="quest-detail-pane__reward-label">{t('questBoard.detail.rewardRequired')}</span> <span className="quest-detail-pane__reward-value">{t('questBoard.detail.requiredValue', { members: mission.requiredMembers, level: mission.requiredLevel })}</span></div>
      </section>

      <section className="quest-detail-pane__section">
        <h4 className="quest-detail-pane__section-title">
          {t('questBoard.detail.party')} <span className="quest-detail-pane__party-count">{t('questBoard.detail.partyCount', { selected: selectedMemberIds.length, required: mission.requiredMembers })}</span>
        </h4>
        <PartySelectList
          availableMembers={availableMembers}
          selectedMemberIds={selectedMemberIds}
          mission={mission}
          onToggleMember={toggleMember}
        />
        {mercFee > 0 && (
          <div className={`quest-detail-pane__merc-fee${canAffordFee ? '' : ' quest-detail-pane__merc-fee--insufficient'}`}>
            {canAffordFee
              ? t('questBoard.detail.mercFee', { fee: mercFee })
              : t('questBoard.detail.mercFeeInsufficient', { fee: mercFee })}
          </div>
        )}
      </section>

      <div className="quest-detail-pane__actions">
        <button
          type="button"
          className="parchment-btn parchment-btn--ghost"
          onClick={handleAutoAssign}
        >
          {t('questBoard.detail.autoAssign')}
        </button>
        <button
          type="button"
          className="parchment-btn parchment-btn--primary dispatch-button"
          disabled={!canDispatch || (mercFee > 0 && !canAffordFee)}
          onClick={() => onDispatch(selectedMemberIds)}
        >
          <span className="dispatch-button__seal" aria-hidden="true" />
          {t('questBoard.detail.dispatch', { selected: selectedMemberIds.length, required: mission.requiredMembers })}
        </button>
      </div>
    </div>
  );
}

