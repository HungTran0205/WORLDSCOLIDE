/** Infirmary room card — beds, queue, recovery progress, daily Skip 5m. */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility } from '@/game/state/game-state';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { FACILITY_SLOTS, getSlotCameraOffset } from '@/game/data/facility-slot-positions';
import { MS_PER_GAME_DAY } from '@/game/state/clock-slice';
import {
  resolveInjuryQueue,
  SKIP_THRESHOLD_MS,
  type InjuryRecoveryRow,
} from '@/game/systems/infirmary-recovery';
import { FacilityMemberAvatar } from './facility-member-avatar';
import { InkConfirmDialog } from './ink-confirm-dialog';
import { getInstanceNumber } from './facility-detail-tray';

const COUNTDOWN_INTERVAL_MS = 1000;

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(total / 60).toString().padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

interface InfirmaryRoomCardProps {
  facility: GuildFacility;
  onClose: () => void;
}

export function InfirmaryRoomCard({ facility, onClose }: InfirmaryRoomCardProps) {
  const { t } = useTranslation();
  const [upgradeConfirm, setUpgradeConfirm] = useState(false);

  const facilities         = useGameStore(s => s.facilities);
  const founder            = useGameStore(s => s.founder);
  const roster             = useGameStore(s => s.roster);
  const gameTime           = useGameStore(s => s.gameTime);
  const upgradeFacility    = useGameStore(s => s.upgradeFacility);
  const skipMemberRecovery = useGameStore(s => s.skipMemberRecovery);
  const setCameraTarget    = useGameStore(s => s.setCameraTarget);

  const allMembers = founder ? [founder, ...roster] : roster;
  const { beds, rows } = resolveInjuryQueue(allMembers, facilities);
  const bedded: InjuryRecoveryRow[] = rows.filter(r => r.bedded);
  const queued: InjuryRecoveryRow[] = rows.filter(r => !r.bedded);

  const def         = FACILITY_DEFINITIONS.infirmary;
  const canUpgrade  = facility.level < 3 && !!def.upgradeCosts;
  const upgradeCost = canUpgrade ? def.upgradeCosts![facility.level - 1] : 0;
  const instanceNum = getInstanceNumber(facility, facilities);
  const displayName = instanceNum ? `${def.name} #${instanceNum}` : def.name;

  const primary           = facilities.find(f => f.id === 'infirmary');
  const currentDay        = Math.floor(gameTime / MS_PER_GAME_DAY);
  const skipAvailableToday = !!primary && primary.lastSkipDay !== currentDay;

  // Live countdown — gated on having any injured to render.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (rows.length === 0) return;
    const id = setInterval(() => setTick(n => n + 1), COUNTDOWN_INTERVAL_MS);
    return () => clearInterval(id);
  }, [rows.length]);

  function handleEnterRoom() {
    const [sx, sy, sz] = FACILITY_SLOTS[facility.placedSlot!];
    const off = getSlotCameraOffset(facility.placedSlot!);
    setCameraTarget([sx + off[0], sy + off[1], sz + off[2]]);
    onClose();
  }

  return (
    <>
      <div className="fp-tray-content">
        <div className="fp-tray-head">
          <div>
            <div className="fp-tray-name">{displayName}</div>
            <div className="fp-tray-stat">
              {t('infirmaryCard.header', {
                occupied: bedded.length,
                max: beds,
                queue: queued.length,
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="fp-tray-level">{t('facilityTray.level', { level: facility.level })}</span>
            {canUpgrade && (
              <button className="fp-upgrade-badge" onClick={() => setUpgradeConfirm(true)}>
                {t('facilityTray.upgradeBtn', { cost: upgradeCost })}
              </button>
            )}
          </div>
        </div>
        <div className="fp-tray-divider" />

        {/* BEDS */}
        <div className="fp-inf-section-label">{t('infirmaryCard.bedsLabel')}</div>
        <div className="fp-inf-rows">
          {bedded.length === 0 && (
            <div className="fp-inf-empty">{t('infirmaryCard.bedsEmpty')}</div>
          )}
          {bedded.map(row => {
            const canSkip = skipAvailableToday && row.remainingMs <= SKIP_THRESHOLD_MS;
            return (
              <div key={row.member.id} className="fp-inf-row">
                <FacilityMemberAvatar member={row.member} />
                <div className="fp-inf-row-main">
                  <div className="fp-inf-row-head">
                    <span className="fp-inf-row-name">{row.member.name}</span>
                    <span className="fp-inf-row-badge">
                      {t('infirmaryCard.speedBadge', { factor: row.speedFactor.toFixed(1) })}
                    </span>
                  </div>
                  <div className="fp-inf-progress">
                    <div
                      className="fp-inf-progress-fill"
                      style={{ width: `${Math.min(100, Math.round(row.progress * 100))}%` }}
                    />
                  </div>
                  <div className="fp-inf-row-foot">
                    <span className="fp-inf-row-remaining">{formatRemaining(row.remainingMs)}</span>
                    {canSkip && (
                      <button
                        className="fp-inf-skip-btn"
                        onClick={() => skipMemberRecovery(row.member.id)}
                      >
                        {t('infirmaryCard.skipBtn')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* QUEUE */}
        {queued.length > 0 && (
          <>
            <div className="fp-inf-section-label">{t('infirmaryCard.queueLabel')}</div>
            <div className="fp-inf-rows">
              {queued.map(row => (
                <div key={row.member.id} className="fp-inf-row fp-inf-row--queue">
                  <FacilityMemberAvatar member={row.member} />
                  <div className="fp-inf-row-main">
                    <div className="fp-inf-row-head">
                      <span className="fp-inf-row-name">{row.member.name}</span>
                      <span className="fp-inf-row-pos">#{row.position + 1}</span>
                    </div>
                    <div className="fp-inf-progress fp-inf-progress--queue">
                      <div
                        className="fp-inf-progress-fill"
                        style={{ width: `${Math.min(100, Math.round(row.progress * 100))}%` }}
                      />
                    </div>
                    <div className="fp-inf-row-foot">
                      <span className="fp-inf-row-waiting">{t('infirmaryCard.waitingForBed')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="fp-tray-bottom">
          <span className="fp-tray-bonus fp-tray-bonus--inactive">
            {t('infirmaryCard.recoveryHint')}
          </span>
          <button className="fp-btn-enter" onClick={handleEnterRoom}>
            {t('facilityTray.enterRoom')}
          </button>
        </div>
      </div>
      {upgradeConfirm && (
        <InkConfirmDialog
          title={t('facilityTray.upgradeTitleFacility', { name: def.name })}
          body={t('facilityTray.upgradeBodyFacility', { level: facility.level + 1, cost: upgradeCost })}
          confirmLabel={t('facilityTray.upgradeConfirm')}
          onConfirm={() => { upgradeFacility(facility.id); setUpgradeConfirm(false); }}
          onCancel={() => setUpgradeConfirm(false)}
        />
      )}
    </>
  );
}
