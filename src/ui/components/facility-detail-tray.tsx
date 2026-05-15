/** Slide-up detail tray — shows built-room info or empty-slot build options. */

import { useState } from 'react';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility, Member, FacilityType } from '@/game/state/game-state';
import { FACILITY_DEFINITIONS, LOGGING_SITE_CONFIG, STONE_QUARRY_CONFIG } from '@/game/data/facility-definitions';
import { FACILITY_SLOTS, getSlotCameraOffset } from '@/game/data/facility-slot-positions';
import { calcTotalUpkeep } from '@/game/systems/upkeep-system';
import { calcMcLevel } from '@/game/systems/stone-quarry-production-system';
import { FacilityMemberAvatar } from './facility-member-avatar';
import { InkConfirmDialog } from './ink-confirm-dialog';

type FacilityDefVal = (typeof FACILITY_DEFINITIONS)[FacilityType];

// ── Bonus preview (extracted from facility-card logic) ──────────────────────
function getBonusPreview(facility: GuildFacility, members: Member[], dailyUpkeep: number): string {
  if (members.length === 0) return '';
  const lv = facility.level;
  switch (facility.type) {
    case 'training-yard': {
      const base = [12, 22, 40][lv - 1];
      const total = members.reduce((s, m) => s + Math.floor(base * (1 + (m.stats.DEX + m.stats.AGI) * 0.002)), 0);
      return `+${total} EXP/day`;
    }
    case 'workshop': {
      const totalW = members.reduce((s, m) => s + Math.floor([3, 5, 8][lv - 1] * (1 + m.stats.STR * 0.004)), 0);
      const totalS = members.reduce((s, m) => s + Math.floor([2, 3, 5][lv - 1] * (1 + m.stats.STR * 0.004)), 0);
      return `+${totalW} Wood, +${totalS} Stone/day`;
    }
    case 'tavern': {
      const pct = Math.min(0.10, members.reduce((s, m) => s + m.stats.CHA, 0) * 0.0005 * lv);
      return `-${(pct * 100).toFixed(1)}% upkeep (~${Math.floor(dailyUpkeep * pct)}g/day)`;
    }
    case 'infirmary': {
      const avgEnd = members.reduce((s, m) => s + m.stats.END, 0) / members.length;
      const avgInt = members.reduce((s, m) => s + m.stats.INT, 0) / members.length;
      const mult = Math.max(0.2, ([0.75, 0.55, 0.40][lv - 1]) - (avgEnd + avgInt) * 0.001);
      return `${Math.round((1 - mult) * 100)}% faster recovery`;
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
  const [upgradeConfirm, setUpgradeConfirm] = useState(false);
  const facilities     = useGameStore(s => s.facilities);
  const founder        = useGameStore(s => s.founder);
  const roster         = useGameStore(s => s.roster);
  const assignMember    = useGameStore(s => s.assignMemberToFacility);
  const unassignMember  = useGameStore(s => s.unassignMemberFromFacility);
  const upgradeFacility = useGameStore(s => s.upgradeFacility);
  const setCameraTarget = useGameStore(s => s.setCameraTarget);

  const allMembers     = founder ? [founder, ...roster] : roster;
  const dailyUpkeep    = calcTotalUpkeep(allMembers);
  const def            = FACILITY_DEFINITIONS[facility.type];
  const maxSlots       = def.maxSlots[facility.level - 1];
  const assigned       = allMembers.filter(m => facility.assignedMemberIds.includes(m.id));
  const eligible       = allMembers.filter(m => m.status === 'idle' && !facility.assignedMemberIds.includes(m.id));
  const emptyCount     = maxSlots - assigned.length;
  const canUpgrade     = facility.level < 3 && !!def.upgradeCosts;
  const upgradeCost    = canUpgrade ? def.upgradeCosts![facility.level - 1] : 0;
  const bonus          = getBonusPreview(facility, assigned, dailyUpkeep);
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
            <div className="fp-tray-stat">{def.primaryStats} · {assigned.length}/{maxSlots}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="fp-tray-level">Lv.{facility.level}</span>
            {canUpgrade && (
              <button className="fp-upgrade-badge" onClick={() => setUpgradeConfirm(true)}>↑ {upgradeCost}g</button>
            )}
          </div>
        </div>
        <div className="fp-tray-divider" />
        <div className="fp-members-row">
          {assigned.map(m => (
            <FacilityMemberAvatar key={m.id} member={m} onUnassign={mid => unassignMember(mid, facility.id)} />
          ))}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <div key={i} className="fp-assign-card">
              <span className="fp-assign-plus">＋</span>
              <span className="fp-assign-label">Assign</span>
              {eligible.length > 0 && (
                <select value="" onChange={e => { if (e.target.value) assignMember(e.target.value, facility.id); }}>
                  <option value="">—</option>
                  {eligible.map(m => <option key={m.id} value={m.id}>{m.name} Lv.{m.level}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>
        <div className="fp-tray-bottom">
          <span className={`fp-tray-bonus${bonus ? '' : ' fp-tray-bonus--inactive'}`}>
            {bonus || 'Assign a member to activate'}
          </span>
          <button className="fp-btn-enter" onClick={handleEnterRoom}>Enter Room →</button>
        </div>
      </div>
      {upgradeConfirm && (
        <InkConfirmDialog
          title={`Upgrade ${def.name}`}
          body={`Upgrade to Level ${facility.level + 1}? Cost: ${upgradeCost}g.`}
          confirmLabel="Upgrade"
          onConfirm={() => { upgradeFacility(facility.id); setUpgradeConfirm(false); }}
          onCancel={() => setUpgradeConfirm(false)}
        />
      )}
    </>
  );
}

// ── Empty slot tray ─────────────────────────────────────────────────────────
function EmptySlotTray({ slotIdx, onBuildComplete }: { slotIdx: number; onBuildComplete: () => void }) {
  const [selectedBp,  setSelectedBp]  = useState<FacilityType | null>(null);
  const [buildConfirm, setBuildConfirm] = useState(false);
  const facilities    = useGameStore(s => s.facilities);
  const gold          = useGameStore(s => s.gold);
  const inventory     = useGameStore(s => s.inventory);
  const buildFacility = useGameStore(s => s.buildFacility);
  const placeFacility = useGameStore(s => s.placeFacility);

  const getActiveCount = (type: FacilityType) =>
    facilities.filter(fac => fac.type === type && fac.level > 0).length;

  const buildable = Object.values(FACILITY_DEFINITIONS).filter(def =>
    getActiveCount(def.type) < 3
  );

  function canAfford(def: FacilityDefVal): boolean {
    if (def.type === 'logging-site') return (inventory.items['LOGGING_SITE_ACCESS'] ?? 0) > 0;
    return def.buildCost === 0 || gold >= def.buildCost;
  }

  function costLabel(def: FacilityDefVal): string {
    if (def.type === 'logging-site') return 'Permit';
    return def.buildCost === 0 ? 'Free' : `${def.buildCost}g`;
  }

  function handleConfirmBuild() {
    if (!selectedBp) return;
    const newId = buildFacility(selectedBp);
    if (newId) placeFacility(newId, slotIdx);
    setBuildConfirm(false);
    onBuildComplete();
  }

  const selDef = selectedBp ? FACILITY_DEFINITIONS[selectedBp] : null;

  return (
    <>
      <div className="fp-tray-content">
        <div className="fp-slot-label">Slot {slotIdx + 1} — Choose a room to build</div>
        <div className="fp-blueprint-list">
          {buildable.length === 0 && <div className="fp-blueprint-empty">All available rooms are already built.</div>}
          {buildable.map(def => {
            const affordable = canAfford(def);
            return (
              <div
                key={def.type}
                className={`fp-blueprint-row${selectedBp === def.type ? ' selected' : ''}${!affordable ? ' unaffordable' : ''}`}
                onClick={() => affordable && setSelectedBp(def.type)}
              >
                <span className="fp-bp-name">{def.name}</span>
                <span className="fp-bp-stat">{def.primaryStats}</span>
                {getActiveCount(def.type) > 0 && (
                  <span className="fp-bp-instance-count">{getActiveCount(def.type)}/3</span>
                )}
                <span className="fp-bp-cost">{costLabel(def)}</span>
              </div>
            );
          })}
        </div>
        <button className="fp-btn-build" disabled={!selectedBp} onClick={() => setBuildConfirm(true)}>
          {selDef ? `Build ${selDef.name} — ${costLabel(selDef)}` : 'Select a blueprint'}
        </button>
      </div>
      {buildConfirm && selDef && (
        <InkConfirmDialog
          title={`Build ${selDef.name}`}
          body={`Build in Slot ${slotIdx + 1}? Cost: ${costLabel(selDef)}. Construction is permanent.`}
          confirmLabel="Build"
          onConfirm={handleConfirmBuild}
          onCancel={() => setBuildConfirm(false)}
        />
      )}
    </>
  );
}

// ── Exported tray shell ─────────────────────────────────────────────────────
interface FacilityDetailTrayProps {
  selectedSlot: number | null;
  slotMap: Map<number, GuildFacility>;
  onClose: () => void;
}

export function FacilityDetailTray({ selectedSlot, slotMap, onClose }: FacilityDetailTrayProps) {
  const isBuilt = selectedSlot !== null && slotMap.has(selectedSlot);
  const isEmpty = selectedSlot !== null && !slotMap.has(selectedSlot);
  const isOpen  = isBuilt || isEmpty;

  return (
    <div className={`fp-tray${isOpen ? ' fp-tray--open' : ''}`}>
      {isBuilt && <BuiltRoomTray facility={slotMap.get(selectedSlot!)!} onClose={onClose} />}
      {isEmpty && <EmptySlotTray slotIdx={selectedSlot!} onBuildComplete={onClose} />}
    </div>
  );
}
