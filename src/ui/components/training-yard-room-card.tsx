/** Training Yard tray card — read-only status from the facilities grid.
 *  Assigning trainees + picking skills happens in-room: enter the room and click
 *  the training dummy (TrainingYardPanel). This tray only surfaces live progress. */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility } from '@/game/state/game-state';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { FACILITY_SLOTS, getSlotCameraOffset } from '@/game/data/facility-slot-positions';
import { MAX_RANK_BY_FACILITY_LEVEL } from '@/game/data/skill-rank-costs';
import { resolveTrainingRows } from '@/game/systems/skill-training-system';
import { tContent } from '@/i18n/content-localization';
import { FacilityMemberAvatar } from './facility-member-avatar';
import { getInstanceNumber } from './facility-detail-tray';

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(total / 60).toString().padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

interface TrainingYardRoomCardProps { facility: GuildFacility; onClose: () => void; }

export function TrainingYardRoomCard({ facility, onClose }: TrainingYardRoomCardProps) {
  const { t } = useTranslation();
  const [, setTick] = useState(0);

  const facilities      = useGameStore(s => s.facilities);
  const founder         = useGameStore(s => s.founder);
  const roster          = useGameStore(s => s.roster);
  const setCameraTarget = useGameStore(s => s.setCameraTarget);

  const allMembers  = founder ? [founder, ...roster] : roster;
  const rows        = resolveTrainingRows(facility, allMembers);
  const def         = FACILITY_DEFINITIONS['training-yard'];
  const maxSlots    = def.maxSlots[facility.level - 1];
  const cap         = MAX_RANK_BY_FACILITY_LEVEL[facility.level] ?? 2;
  const instanceNum = getInstanceNumber(facility, facilities);
  const displayName = instanceNum ? `${def.name} #${instanceNum}` : def.name;

  useEffect(() => {
    if (rows.length === 0) return;
    const id = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [rows.length]);

  function handleEnterRoom() {
    const [sx, sy, sz] = FACILITY_SLOTS[facility.placedSlot!];
    const off = getSlotCameraOffset(facility.placedSlot!);
    setCameraTarget([sx + off[0], sy + off[1], sz + off[2]]);
    onClose();
  }

  return (
    <div className="fp-tray-content">
      <div className="fp-tray-head">
        <div>
          <div className="fp-tray-name">{displayName}</div>
          <div className="fp-tray-stat">{t('trainingYardCard.header', { occupied: rows.length, max: maxSlots, cap })}</div>
        </div>
        <span className="fp-tray-level">{t('facilityTray.level', { level: facility.level })}</span>
      </div>
      <div className="fp-tray-divider" />
      <div className="fp-inf-rows">
        {rows.length === 0 && <div className="fp-inf-empty">{t('trainingYardCard.slotsEmpty')}</div>}
        {rows.map(row => (
          <div key={row.member.id} className="fp-inf-row">
            <FacilityMemberAvatar member={row.member} />
            <div className="fp-inf-row-main">
              <div className="fp-inf-row-head">
                <span className="fp-inf-row-name">{row.member.name}</span>
                <span className="fp-inf-row-badge">{tContent('skills', row.skill.id, 'name', row.skill.name)}</span>
                <span className="fp-inf-row-badge">{t('trainingYardCard.rankProgress', { cur: row.currentRank, target: row.targetRank })}</span>
              </div>
              <div className="fp-inf-progress">
                <div className="fp-inf-progress-fill" style={{ width: `${Math.min(100, Math.round(row.progress * 100))}%` }} />
              </div>
              <div className="fp-inf-row-foot">
                <span className="fp-inf-row-remaining">{formatRemaining(row.remainingMs)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="fp-tray-bonus fp-tray-bonus--inactive" style={{ padding: '6px 4px 0' }}>
        {t('trainingYardCard.assignHint')}
      </div>
      <div className="fp-tray-bottom">
        <button className="fp-btn-enter" onClick={handleEnterRoom}>{t('facilityTray.enterRoom')}</button>
      </div>
    </div>
  );
}
