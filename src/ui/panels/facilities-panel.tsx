/** FacilitiesPanel — Bát Quái 5×5 cross grid with slide-up detail tray (HD-2D Ink UI). */

import { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility, FacilityType } from '@/game/state/game-state';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { FACILITY_SLOTS, getSlotCameraOffset } from '@/game/data/facility-slot-positions';
import { GUILD_HALL_CAMERA_TARGET } from '@/game/state/camera-slice';
import { getUpgradeCost } from '@/game/systems/guild-upgrade-system';
import { FacilityDetailTray, getInstanceNumber } from '@/ui/components/facility-detail-tray';
import { InkConfirmDialog } from '@/ui/components/ink-confirm-dialog';
import '@/ui/styles/game-ui-tokens.css';
import '@/ui/styles/facilities-panel.css';

const FACILITY_ICONS: Partial<Record<FacilityType, string>> = {
  'tavern':        '♦',
  'training-yard': '⚔',
  'infirmary':     '✚',
  'workshop':      '⚙',
  'logging-site':  '🌲',
  'stone-quarry':  '⛏',
  'alchemy-lab':   '⚗',
};

// 5×5 Bát Quái cross grid: null=spacer, -1=HALL center, 0–11=slot index
const GRID_LAYOUT = [
  [null, null,    6, null, null],
  [null,    5,    0,    7, null],
  [   4,    3,   -1,    1,    8],
  [null,   11,    2,    9, null],
  [null, null,   10, null, null],
] as const;

interface FacilitiesPanelProps { onClose: () => void; }

// ── Slot cards ──────────────────────────────────────────────────────────────

function BuiltSlotCard({ slotIdx, facility, selected, onClick, instanceNumber }: {
  slotIdx: number; facility: GuildFacility; selected: boolean; onClick: () => void; instanceNumber?: number | null;
}) {
  const hasAssigned = facility.assignedMemberIds.length > 0;
  const defName = FACILITY_DEFINITIONS[facility.type]?.name ?? facility.type;
  return (
    <div className={`fp-slot${selected ? ' selected' : ''}`} onClick={onClick}>
      <span className="fp-slot-num">{slotIdx + 1}</span>
      {hasAssigned && <span className="fp-slot-dot" />}
      {instanceNumber != null && <span className="fp-instance-badge">#{instanceNumber}</span>}
      <span className="fp-slot-icon">{FACILITY_ICONS[facility.type] ?? '▣'}</span>
      <span className="fp-slot-name">{defName}</span>
      <span className="fp-slot-level">Lv.{facility.level}</span>
    </div>
  );
}

function EmptySlotCard({ slotIdx, selected, onClick }: {
  slotIdx: number; selected: boolean; onClick: () => void;
}) {
  return (
    <div className={`fp-slot fp-slot-empty${selected ? ' selected' : ''}`} onClick={onClick}>
      <span className="fp-slot-num">{slotIdx + 1}</span>
      <span className="fp-slot-empty-icon">＋</span>
      <span className="fp-slot-empty-label">Empty</span>
    </div>
  );
}

function HallCenterCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="fp-slot fp-slot-hall" onClick={onClick}>
      <span className="fp-slot-icon">⬡</span>
      <span className="fp-slot-name">Hall</span>
    </div>
  );
}

// ── Guild upgrade footer card ────────────────────────────────────────────────

function GuildUpgradeCard() {
  const [showConfirm, setShowConfirm] = useState(false);
  const guildLevel  = useGameStore(s => s.guildLevel);
  const gold        = useGameStore(s => s.gold);
  const upgradeGuild = useGameStore(s => s.upgradeGuild);
  const spendGold    = useGameStore(s => s.spendGold);
  const upgradeCost  = getUpgradeCost(guildLevel);

  if (upgradeCost === Infinity) return null;

  return (
    <>
      <div className="fp-guild-upgrade">
        <span className="fp-guild-label">Guild Hall — Lv.{guildLevel}</span>
        <button
          className="fp-btn-guild-upgrade"
          disabled={gold < upgradeCost}
          onClick={() => setShowConfirm(true)}
        >
          Upgrade — {upgradeCost.toLocaleString()}g
        </button>
      </div>
      {showConfirm && (
        <InkConfirmDialog
          title="Upgrade Guild Hall"
          body={`Upgrade to Level ${guildLevel + 1}? Cost: ${upgradeCost.toLocaleString()}g. Unlocks new slots and blueprints.`}
          confirmLabel="Upgrade"
          onConfirm={() => { if (spendGold(upgradeCost)) upgradeGuild(); setShowConfirm(false); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

export function FacilitiesPanel({ onClose }: FacilitiesPanelProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const facilities          = useGameStore(s => s.facilities);
  const gold                = useGameStore(s => s.gold);
  const guildLevel          = useGameStore(s => s.guildLevel);
  const tutorialStep        = useGameStore(s => s.tutorialStep);
  const focusFacilityType   = useGameStore(s => s.focusFacilityType);
  const clearFocusFacility  = useGameStore(s => s.clearFocusFacilityType);
  const setCameraTarget     = useGameStore(s => s.setCameraTarget);

  // Map slot index → built facility
  const slotMap = useMemo(() => {
    const map = new Map<number, GuildFacility>();
    facilities
      .filter(f => f.level > 0 && f.placedSlot !== null)
      .forEach(f => map.set(f.placedSlot!, f));
    return map;
  }, [facilities]);

  // Auto-select slot when panel opened via tutorial focus
  useEffect(() => {
    if (focusFacilityType) {
      const f = facilities.find(fac => fac.type === focusFacilityType && fac.level > 0 && fac.placedSlot !== null);
      if (f) setSelectedSlot(f.placedSlot!);
    }
    return () => { clearFocusFacility(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSlotClick(slotIdx: number) {
    if (selectedSlot === slotIdx) {
      // Second click on same slot → fly camera to room
      const [sx, sy, sz] = FACILITY_SLOTS[slotIdx];
      const off = getSlotCameraOffset(slotIdx);
      setCameraTarget([sx + off[0], sy + off[1], sz + off[2]]);
    } else {
      setSelectedSlot(slotIdx);
    }
  }

  const slotsUsed = slotMap.size;

  return (
    <div className="fp-overlay">
      <div className="ink-panel fp-panel ink-enter">

        {/* Header */}
        <div className="fp-header">
          <span className="fp-title">FACILITIES</span>
          <span className="fp-badge">Guild Lv.{guildLevel}</span>
          <span className="fp-header-gold">⬡ {gold.toLocaleString()}g</span>
          <span className="fp-badge">{slotsUsed}/12 slots</span>
          <button className="fp-close" onClick={onClose}>Close</button>
        </div>

        {/* Tutorial hints */}
        {tutorialStep === 'build-logging-site' && (
          <div style={{ padding: '6px 14px 0', fontSize: '0.7rem', color: 'var(--ink-gold)', fontFamily: 'var(--ink-font-mono)' }}>
            ▶ Select an empty slot to build a Logging Site.
          </div>
        )}
        {tutorialStep === 'assign-kael' && (
          <div style={{ padding: '6px 14px 0', fontSize: '0.7rem', color: 'var(--ink-gold)', fontFamily: 'var(--ink-font-mono)' }}>
            ▶ Select the Logging Site and assign Kael.
          </div>
        )}
        {tutorialStep === 'build-tavern' && (
          <div style={{ padding: '6px 14px 0', fontSize: '0.7rem', color: 'var(--ink-gold)', fontFamily: 'var(--ink-font-mono)' }}>
            ▶ Select an empty slot and build the Tavern (200 Wood).
          </div>
        )}

        {/* Bát Quái cross slot grid */}
        <div className="fp-grid-area">
          <div className="fp-slot-grid">
            {GRID_LAYOUT.flat().map((cell, idx) => {
              if (cell === null) return <div key={idx} className="fp-slot-spacer" />;
              if (cell === -1) return <HallCenterCard key={idx} onClick={() => setCameraTarget(GUILD_HALL_CAMERA_TARGET)} />;
              const facility = slotMap.get(cell);
              if (facility) {
                return (
                  <BuiltSlotCard
                    key={idx}
                    slotIdx={cell}
                    facility={facility}
                    selected={selectedSlot === cell}
                    onClick={() => handleSlotClick(cell)}
                    instanceNumber={getInstanceNumber(facility, facilities)}
                  />
                );
              }
              return (
                <EmptySlotCard
                  key={idx}
                  slotIdx={cell}
                  selected={selectedSlot === cell}
                  onClick={() => handleSlotClick(cell)}
                />
              );
            })}
          </div>
          <GuildUpgradeCard />
        </div>

        {/* Slide-up detail tray */}
        <FacilityDetailTray
          selectedSlot={selectedSlot}
          slotMap={slotMap}
          onClose={() => setSelectedSlot(null)}
        />

      </div>
    </div>
  );
}
