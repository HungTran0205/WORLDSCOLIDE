/**
 * Training Yard function panel — opened by clicking the training dummy in-room.
 * Shows active training slots (progress + cancel) and the two-step assign flow
 * (pick member → pick a class skill to rank up). This is the sole assign path;
 * the facilities-grid tray only shows read-only status.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility, Member } from '@/game/state/game-state';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { MAX_RANK_BY_FACILITY_LEVEL } from '@/game/data/skill-rank-costs';
import { resolveTrainingRows } from '@/game/systems/skill-training-system';
import { tContent } from '@/i18n/content-localization';
import { FacilityMemberAvatar } from '@/ui/components/facility-member-avatar';
import { InkConfirmDialog } from '@/ui/components/ink-confirm-dialog';
import { MemberPicker, SkillPicker } from '@/ui/components/training-yard-pickers';
import { SkillIcon } from '@/ui/components/skill-icon';
import '@/ui/styles/training-yard-panel.css';

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(total / 60).toString().padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

interface TrainingYardPanelProps { facility: GuildFacility; onClose: () => void; }

export function TrainingYardPanel({ facility, onClose }: TrainingYardPanelProps) {
  const { t } = useTranslation();
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [pickedMember, setPickedMember] = useState<Member | null>(null);
  const [, setTick] = useState(0);

  const facilities          = useGameStore(s => s.facilities);
  const founder             = useGameStore(s => s.founder);
  const roster              = useGameStore(s => s.roster);
  const gold                = useGameStore(s => s.gold);
  const inventory           = useGameStore(s => s.inventory);
  const startSkillTraining  = useGameStore(s => s.startSkillTraining);
  const cancelSkillTraining = useGameStore(s => s.cancelSkillTraining);
  const upgradeFacility     = useGameStore(s => s.upgradeFacility);

  // Live facility from store so trainingQueue / level update reactively.
  const live        = facilities.find(f => f.id === facility.id) ?? facility;
  const allMembers  = founder ? [founder, ...roster] : roster;
  const rows        = resolveTrainingRows(live, allMembers);
  const def         = FACILITY_DEFINITIONS['training-yard'];
  const maxSlots    = def.maxSlots[live.level - 1];
  const cap         = MAX_RANK_BY_FACILITY_LEVEL[live.level] ?? 2;
  const freeSlots   = maxSlots - rows.length;
  const canUpgrade  = live.level < 3 && !!def.upgradeCosts;
  const upgradeCost = canUpgrade ? def.upgradeCosts![live.level - 1] : 0;
  const eligible    = allMembers.filter(m => m.status === 'idle' && !live.assignedMemberIds.includes(m.id));

  const sameType    = facilities.filter(f => f.type === 'training-yard' && f.level > 0);
  const instanceNum = sameType.length > 1 ? sameType.findIndex(f => f.id === live.id) + 1 : null;
  const title       = instanceNum ? `${def.name} #${instanceNum}` : def.name;

  useEffect(() => {
    if (rows.length === 0) return;
    const id = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [rows.length]);

  return (
    <div className="ty-overlay" onClick={onClose}>
      <div className="ty-panel" onClick={e => e.stopPropagation()}>
        {/* ── Header ── */}
        <header className="ty-header">
          <div className="ty-header-info">
            <span className="ty-title">{title}</span>
            <span className="ty-badge">{t('facilityTray.level', { level: live.level })}</span>
            <span className="ty-badge">{t('trainingYardCard.header', { occupied: rows.length, max: maxSlots, cap })}</span>
            {canUpgrade && (
              <button className="ty-upgrade" onClick={() => upgradeFacility(live.id)}>
                {t('facilityTray.upgradeBtn', { cost: upgradeCost })}
              </button>
            )}
          </div>
          <button className="ty-close" onClick={onClose}>✕</button>
        </header>

        {/* ── Active training slots ── */}
        <section className="ty-body">
          <div className="fp-inf-rows">
            {rows.length === 0 && <div className="fp-inf-empty">{t('trainingYardCard.slotsEmpty')}</div>}
            {rows.map(row => (
              <div key={row.member.id} className="fp-inf-row">
                <FacilityMemberAvatar member={row.member} />
                <SkillIcon skill={row.skill} size={28} />
                <div className="fp-inf-row-main">
                  <div className="fp-inf-row-head">
                    <span className="fp-inf-row-name">{row.member.name}</span>
                    <span className="fp-inf-row-badge">{tContent('skills', row.skill.id, 'name', row.skill.name)}</span>
                    <span className="fp-inf-row-badge">{t('trainingYardCard.rankProgress', { cur: row.currentRank, target: row.targetRank })}</span>
                    <span className="fp-inf-row-badge">{t('trainingYardCard.speedBadge', { factor: row.speedFactor.toFixed(1) })}</span>
                  </div>
                  <div className="fp-inf-progress">
                    <div className="fp-inf-progress-fill" style={{ width: `${Math.min(100, Math.round(row.progress * 100))}%` }} />
                  </div>
                  <div className="fp-inf-row-foot">
                    <span className="fp-inf-row-remaining">{formatRemaining(row.remainingMs)}</span>
                    <button className="fp-inf-skip-btn" onClick={() => setCancelTarget(row.member.id)}>
                      {t('trainingYardCard.cancelBtn')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Assign flow ── */}
          {freeSlots > 0 ? (
            <div className="ty-assign">
              <div className="ty-assign-head">
                <span className="fp-tray-bonus fp-tray-bonus--inactive">{t('trainingYardCard.freeSlots', { count: freeSlots })}</span>
              </div>
              {!pickedMember
                ? <MemberPicker eligible={eligible} onPick={setPickedMember} />
                : <SkillPicker member={pickedMember} cap={cap} facilityId={live.id}
                    gold={gold} inventory={inventory}
                    startSkillTraining={startSkillTraining}
                    onBack={() => setPickedMember(null)} onDone={() => setPickedMember(null)} />
              }
            </div>
          ) : (
            <div className="fp-inf-empty">{t('trainingYardCard.slotsFull')}</div>
          )}
        </section>
      </div>

      {cancelTarget && (
        <InkConfirmDialog
          title={t('trainingYardCard.cancelConfirmTitle')}
          body={t('trainingYardCard.cancelConfirmBody')}
          confirmLabel={t('trainingYardCard.cancelConfirm')}
          onConfirm={() => { cancelSkillTraining(cancelTarget, live.id); setCancelTarget(null); }}
          onCancel={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
