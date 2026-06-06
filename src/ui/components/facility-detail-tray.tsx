/** Slide-up detail tray — shows built-room info or empty-slot build options. */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility, Member } from '@/game/state/game-state';
import { FACILITY_DEFINITIONS, LOGGING_SITE_CONFIG, STONE_QUARRY_CONFIG } from '@/game/data/facility-definitions';
import { FACILITY_SLOTS, getSlotCameraOffset } from '@/game/data/facility-slot-positions';
import { calcMcLevel } from '@/game/systems/stone-quarry-production-system';
import { handleFirstHaul } from '@/game/systems/tutorial-first-haul-handler';
import { handleKeeperAssigned } from '@/game/systems/tutorial-keeper-handler';
import { FacilityMemberAvatar } from './facility-member-avatar';
import { InkConfirmDialog } from './ink-confirm-dialog';
import { InfirmaryRoomCard } from './infirmary-room-card';
import { TrainingYardRoomCard } from './training-yard-room-card';

// ── Bonus preview (extracted from facility-card logic) ──────────────────────
function getBonusPreview(facility: GuildFacility, members: Member[]): string {
  if (members.length === 0) return '';
  const lv = facility.level;
  switch (facility.type) {
    case 'training-yard': return ''; // skill-rank training — no simple EXP preview
    case 'workshop': {
      const totalW = members.reduce((s, m) => s + Math.floor([3, 5, 8][lv - 1] * (1 + m.stats.STR * 0.004)), 0);
      const totalS = members.reduce((s, m) => s + Math.floor([2, 3, 5][lv - 1] * (1 + m.stats.STR * 0.004)), 0);
      return `+${totalW} Wood, +${totalS} Stone/day`;
    }
    case 'logging-site': {
      const total = members.reduce((s, m) => {
        const wcLv = m.craftSkills?.woodcutting.level ?? 0;
        return s + LOGGING_SITE_CONFIG.baseRate * ((m.stats.STR * 0.5 + m.stats.END * 0.3 + m.stats.DEX * 0.2) / 100)
          * (1 + LOGGING_SITE_CONFIG.wcSkillBonusPct[wcLv] / 100) * STONE_QUARRY_CONFIG.ticksPerDay;
      }, 0);
      return `+${Math.floor(total)} Wood/gameday`;
    }
    case 'stone-quarry': {
      const lMult = STONE_QUARRY_CONFIG.levelMult[lv - 1];
      const total = members.reduce((s, m) => {
        const yMult = 1 + STONE_QUARRY_CONFIG.mcSkillYieldPct[calcMcLevel(m.craftSkills?.mining?.xpAccumulated ?? 0)] / 100;
        return s + STONE_QUARRY_CONFIG.baseRate * (m.stats.STR * 0.5 / 100) * lMult * yMult * STONE_QUARRY_CONFIG.ticksPerDay;
      }, 0);
      return `+${Math.floor(total)} Stone/gameday`;
    }
    default: return '';
  }
}

// ── Instance number helper ──────────────────────────────────────────────────
export function getInstanceNumber(facility: GuildFacility, allFacilities: GuildFacility[]): number | null {
  const typeInstances = allFacilities
    .filter(f => f.type === facility.type && f.level > 0)
    .sort((a, b) => {
      if (a.id === a.type) return -1;
      if (b.id === b.type) return 1;
      return a.id.localeCompare(b.id);
    });
  if (typeInstances.length <= 1) return null;
  return typeInstances.indexOf(facility) + 1;
}

// ── Built room tray ─────────────────────────────────────────────────────────
function BuiltRoomTray({ facility, onClose }: { facility: GuildFacility; onClose: () => void }) {
  const { t } = useTranslation();
  const [upgradeConfirm, setUpgradeConfirm] = useState(false);
  const facilities     = useGameStore(s => s.facilities);
  const founder        = useGameStore(s => s.founder);
  const roster         = useGameStore(s => s.roster);
  const assignMember    = useGameStore(s => s.assignMemberToFacility);
  const unassignMember  = useGameStore(s => s.unassignMemberFromFacility);
  const upgradeFacility = useGameStore(s => s.upgradeFacility);
  const setCameraTarget = useGameStore(s => s.setCameraTarget);
  const tutorialStep    = useGameStore(s => s.tutorialStep);

  // Tutorial: pulse the assign slot when the player must put Kael on the Logging Site.
  const highlightAssign =
    (tutorialStep === 'assign-kael' && facility.type === 'logging-site') ||
    (tutorialStep === 'assign-keeper' && facility.type === 'tavern');

  const allMembers     = founder ? [founder, ...roster] : roster;
  const def            = FACILITY_DEFINITIONS[facility.type];
  const maxSlots       = def.maxSlots[facility.level - 1];
  const assigned       = allMembers.filter(m => facility.assignedMemberIds.includes(m.id));
  const eligible       = allMembers.filter(m => m.status === 'idle' && !facility.assignedMemberIds.includes(m.id));
  const emptyCount     = maxSlots - assigned.length;
  const canUpgrade     = facility.level < 3 && !!def.upgradeCosts;
  const upgradeCost    = canUpgrade ? def.upgradeCosts![facility.level - 1] : 0;
  const bonus          = getBonusPreview(facility, assigned);
  const instanceNum    = getInstanceNumber(facility, facilities);
  const displayName    = instanceNum ? `${def.name} #${instanceNum}` : def.name;

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
            <div className="fp-tray-stat">{t('facilityTray.stat', { stats: def.primaryStats, assigned: assigned.length, max: maxSlots })}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="fp-tray-level">{t('facilityTray.level', { level: facility.level })}</span>
            {canUpgrade && (
              <button className="fp-upgrade-badge" onClick={() => setUpgradeConfirm(true)}>{t('facilityTray.upgradeBtn', { cost: upgradeCost })}</button>
            )}
          </div>
        </div>
        <div className="fp-tray-divider" />
        <div className="fp-members-row">
          {assigned.map(m => (
            <FacilityMemberAvatar key={m.id} member={m} onUnassign={mid => unassignMember(mid, facility.id)} />
          ))}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <div key={i} className={`fp-assign-card${highlightAssign ? ' tutorial-highlight' : ''}`}>
              <span className="fp-assign-plus">＋</span>
              <span className="fp-assign-label">{t('facilityTray.assign')}</span>
              {eligible.length > 0 && (
                <select value="" onChange={e => {
                  if (!e.target.value) return;
                  if (assignMember(e.target.value, facility.id)) {
                    // Grant the scripted first haul (Kael → logging site) or spawn the
                    // tutorial recruit (keeper → tavern), each gated to its tutorial step.
                    handleFirstHaul(e.target.value, facility.id);
                    handleKeeperAssigned(e.target.value, facility.id);
                  }
                }}>
                  <option value="">—</option>
                  {eligible.map(m => <option key={m.id} value={m.id}>{m.name} · {m.grade}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>
        <div className="fp-tray-bottom">
          <span className={`fp-tray-bonus${bonus ? '' : ' fp-tray-bonus--inactive'}`}>
            {bonus || t('facilityTray.bonus')}
          </span>
          <button className="fp-btn-enter" onClick={handleEnterRoom}>{t('facilityTray.enterRoom')}</button>
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

// ── Exported tray shell ─────────────────────────────────────────────────────
// Empty slots open the left-docked FacilityBuildPicker (in facilities-panel);
// this bottom tray now only shows built-room detail.
interface FacilityDetailTrayProps {
  selectedSlot: number | null;
  slotMap: Map<number, GuildFacility>;
  onClose: () => void;
}

export function FacilityDetailTray({ selectedSlot, slotMap, onClose }: FacilityDetailTrayProps) {
  const isBuilt = selectedSlot !== null && slotMap.has(selectedSlot);
  const facility = isBuilt ? slotMap.get(selectedSlot!)! : null;

  return (
    <div className={`fp-tray${isBuilt ? ' fp-tray--open' : ''}`}>
      {facility && facility.type === 'infirmary' && (
        <InfirmaryRoomCard facility={facility} onClose={onClose} />
      )}
      {facility && facility.type === 'training-yard' && (
        <TrainingYardRoomCard facility={facility} onClose={onClose} />
      )}
      {facility && facility.type !== 'infirmary' && facility.type !== 'training-yard' && (
        <BuiltRoomTray facility={facility} onClose={onClose} />
      )}
    </div>
  );
}
