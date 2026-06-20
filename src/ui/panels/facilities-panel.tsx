/** FacilitiesPanel — Bát Quái 5×5 cross grid with slide-up detail tray.
 *  Shell (chrome, header, close button, animation, SFX) is owned by PanelFrame.
 *  This file contains only content-specific JSX. */

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { tContent } from '@/i18n/content-localization';
import type { GuildFacility, FacilityType } from '@/game/state/game-state';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { FACILITY_SLOTS, getSlotCameraOffset } from '@/game/data/facility-slot-positions';
import { GUILD_HALL_CAMERA_TARGET } from '@/game/state/camera-slice';
import { getUpgradeCost } from '@/game/systems/guild-upgrade-system';
import { FacilityDetailTray, getInstanceNumber } from '@/ui/components/facility-detail-tray';
import { FacilityBuildPicker } from '@/ui/components/facility-build-picker';
import { InkConfirmDialog } from '@/ui/components/ink-confirm-dialog';
import { PanelFrame } from '@/ui/components/panel-frame';
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

function BuiltSlotCard({ slotIdx, facility, selected, onClick, instanceNumber, highlight }: {
  slotIdx: number; facility: GuildFacility; selected: boolean; onClick: () => void; instanceNumber?: number | null; highlight?: boolean;
}) {
  const hasAssigned = facility.assignedMemberIds.length > 0;
  const defName = FACILITY_DEFINITIONS[facility.type]?.name ?? facility.type;
  return (
    <div className={`fp-slot${selected ? ' selected' : ''}${highlight ? ' tutorial-highlight' : ''}`} onClick={onClick}>
      <span className="fp-slot-num">{slotIdx + 1}</span>
      {hasAssigned && <span className="fp-slot-dot" />}
      {instanceNumber != null && <span className="fp-instance-badge">#{instanceNumber}</span>}
      <span className="fp-slot-icon">{FACILITY_ICONS[facility.type] ?? '▣'}</span>
      <span className="fp-slot-name">{defName}</span>
      <span className="fp-slot-level">Lv.{facility.level}</span>
    </div>
  );
}

function EmptySlotCard({ slotIdx, selected, onClick, highlight }: {
  slotIdx: number; selected: boolean; onClick: () => void; highlight?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className={`fp-slot fp-slot-empty${selected ? ' selected' : ''}${highlight ? ' tutorial-highlight' : ''}`} onClick={onClick}>
      <span className="fp-slot-num">{slotIdx + 1}</span>
      <span className="fp-slot-empty-icon">＋</span>
      <span className="fp-slot-empty-label">{t('facilitiesPanel.slotEmpty')}</span>
    </div>
  );
}

function HallCenterCard({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="fp-slot fp-slot-hall" onClick={onClick}>
      <span className="fp-slot-icon">⬡</span>
      <span className="fp-slot-name">{t('facilitiesPanel.hallLabel')}</span>
    </div>
  );
}

// ── Guild upgrade footer card ────────────────────────────────────────────────

function GuildUpgradeCard() {
  const { t } = useTranslation();
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
        <span className="fp-guild-label">{t('guildUpgrade.label', { level: guildLevel })}</span>
        <button
          className="fp-btn-guild-upgrade"
          disabled={gold < upgradeCost}
          onClick={() => setShowConfirm(true)}
        >
          {t('guildUpgrade.btn', { cost: upgradeCost.toLocaleString() })}
        </button>
      </div>
      {showConfirm && (
        <InkConfirmDialog
          title={t('guildUpgrade.title')}
          body={t('guildUpgrade.body', { level: guildLevel + 1, cost: upgradeCost.toLocaleString() })}
          confirmLabel={t('guildUpgrade.confirm')}
          onConfirm={() => { if (spendGold(upgradeCost)) upgradeGuild(); setShowConfirm(false); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

export function FacilitiesPanel({ onClose }: FacilitiesPanelProps) {
  const { t } = useTranslation();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const facilities          = useGameStore(s => s.facilities);
  const gold                = useGameStore(s => s.gold);
  const guildLevel          = useGameStore(s => s.guildLevel);
  const tutorialStep        = useGameStore(s => s.tutorialStep);
  const focusFacilityType   = useGameStore(s => s.focusFacilityType);
  const clearFocusFacility  = useGameStore(s => s.clearFocusFacilityType);
  const setCameraTarget     = useGameStore(s => s.setCameraTarget);

  const slotMap = useMemo(() => {
    const map = new Map<number, GuildFacility>();
    facilities
      .filter(f => f.level > 0 && f.placedSlot !== null)
      .forEach(f => map.set(f.placedSlot!, f));
    return map;
  }, [facilities]);

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
      const [sx, sy, sz] = FACILITY_SLOTS[slotIdx];
      const off = getSlotCameraOffset(slotIdx);
      setCameraTarget([sx + off[0], sy + off[1], sz + off[2]]);
    } else {
      setSelectedSlot(slotIdx);
    }
  }

  const slotsUsed = slotMap.size;
  const isBuildStep = tutorialStep === 'build-logging-site' || tutorialStep === 'build-tavern';
  const highlightEmptySlots = isBuildStep && selectedSlot === null;
  const buildSlot = selectedSlot !== null && !slotMap.has(selectedSlot) ? selectedSlot : null;

  return (
    <div className="fp-overlay">
      {buildSlot !== null && (
        <FacilityBuildPicker
          slotIdx={buildSlot}
          onBuildComplete={() => setSelectedSlot(null)}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      <PanelFrame title={t('facilityNames.facilities')} onClose={onClose} variant="panel">
        {/* ── Header meta: guild level, gold, slots used ── */}
        <div className="fp-meta">
          <span className="fp-badge">{t('facilitiesPanel.guildLevel', { level: guildLevel })}</span>
          <span className="fp-header-gold">⬡ {gold.toLocaleString()}g</span>
          <span className="fp-badge">{t('facilitiesPanel.slotsUsed', { used: slotsUsed })}</span>
        </div>

        {/* Tutorial hints */}
        {tutorialStep === 'build-logging-site' && (
          <div className="fp-tutorial-hint">
            {tContent('tutorial', 'build-logging-site', 'hint', '▶ Select an empty slot to build a Logging Site.')}
          </div>
        )}
        {tutorialStep === 'assign-kael' && (
          <div className="fp-tutorial-hint">
            {tContent('tutorial', 'assign-kael', 'hint', '▶ Select the Logging Site and assign Kael.')}
          </div>
        )}
        {tutorialStep === 'build-tavern' && (
          <div className="fp-tutorial-hint">
            {tContent('tutorial', 'build-tavern', 'hint', '▶ Select an empty slot and build the Tavern (200 Wood).')}
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
                    highlight={
                      tutorialStep === 'assign-kael' &&
                      facility.type === 'logging-site' &&
                      selectedSlot !== cell
                    }
                  />
                );
              }
              return (
                <EmptySlotCard
                  key={idx}
                  slotIdx={cell}
                  selected={selectedSlot === cell}
                  onClick={() => handleSlotClick(cell)}
                  highlight={highlightEmptySlots}
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
      </PanelFrame>
    </div>
  );
}
