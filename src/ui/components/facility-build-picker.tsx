/** Build picker — icon-card grid docked to the left of the facilities panel.
 *  Replaces the old text-list EmptySlotTray. Built-room flow stays in the tray.
 *
 *  Shell (chrome, header, close button, animation) is owned by PanelFrame.
 *  This file contains only content-specific JSX. */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { FacilityType } from '@/game/state/game-state';
import type { ItemID } from '@/game/data/items';
import { ITEM_DATABASE } from '@/game/data/items';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { getIconPath } from '@/ui/utils/icon-paths';
import { InkConfirmDialog } from './ink-confirm-dialog';
import { PanelFrame } from './panel-frame';
import '@/ui/styles/facility-build-picker.css';

type FacilityDefVal = (typeof FACILITY_DEFINITIONS)[FacilityType];

// ── Material build-cost helpers ──────────────────────────────────────────────
/** "200 Oak Wood" or "200 Oak Wood, 50 Stone" — uses canonical item names. */
function materialCostLabel(cost: Partial<Record<ItemID, number>>): string {
  return Object.entries(cost)
    .filter(([, qty]) => qty && qty > 0)
    .map(([id, qty]) => `${qty} ${ITEM_DATABASE[id as ItemID].name}`)
    .join(', ');
}

/** True if inventory holds every material in the cost. */
function hasMaterials(cost: Partial<Record<ItemID, number>>, items: Partial<Record<ItemID, number>>): boolean {
  return Object.entries(cost).every(([id, qty]) => !qty || (items[id as ItemID] ?? 0) >= qty);
}

// ── Icon card ─────────────────────────────────────────────────────────────────
function FacilityIconCard({ def, activeCount, locked, lockLabel, affordable, selected, highlight, costText, requiredLevel, levelMet, onSelect }: {
  def: FacilityDefVal; activeCount: number; locked: boolean; lockLabel: string; affordable: boolean;
  selected: boolean; highlight: boolean; costText: string; requiredLevel: number; levelMet: boolean; onSelect: () => void;
}) {
  const { t } = useTranslation();
  const selectable = affordable && !locked;
  const cls = [
    'fbp-card',
    selected        ? 'is-selected'    : '',
    !selectable     ? 'is-unaffordable' : '',
    locked          ? 'is-locked'       : '',
    highlight       ? 'tutorial-highlight' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} onClick={() => selectable && onSelect()}>
      {activeCount > 0 && <span className="fbp-card-count">{activeCount}/3</span>}
      <img className="fbp-card-icon" src={getIconPath('room', def.type)} alt={def.name} draggable={false} />
      <span className="fbp-card-name">{def.name}</span>
      <span className="fbp-card-stat">{def.primaryStats}</span>
      <span className={`fbp-card-cost${!affordable && !locked ? ' is-short' : ''}`}>{costText}</span>
      {/* Guild-level requirement — shown whenever there's a real gate (>1), red when unmet. */}
      {requiredLevel > 1 && (
        <span className={`fbp-card-req${!levelMet ? ' is-unmet' : ''}`}>
          {t('facilityTray.reqGuildLevel', { level: requiredLevel })}
        </span>
      )}
      {locked && (
        <div className="fbp-lock">
          <span className="fbp-lock-icon">🔒</span>
          <span className="fbp-lock-label">{lockLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── Build picker panel ──────────────────────────────────────────────────────
interface FacilityBuildPickerProps {
  slotIdx: number;
  onBuildComplete: () => void;
  onClose: () => void;
}

export function FacilityBuildPicker({ slotIdx, onBuildComplete, onClose }: FacilityBuildPickerProps) {
  const { t } = useTranslation();
  const [selectedBp,  setSelectedBp]   = useState<FacilityType | null>(null);
  const [buildConfirm, setBuildConfirm] = useState(false);
  const facilities        = useGameStore(s => s.facilities);
  const guildLevel        = useGameStore(s => s.guildLevel);
  const gold              = useGameStore(s => s.gold);
  const inventory         = useGameStore(s => s.inventory);
  const completedMissions = useGameStore(s => s.completedMissions);
  const buildFacility     = useGameStore(s => s.buildFacility);
  const placeFacility     = useGameStore(s => s.placeFacility);
  const tutorialStep      = useGameStore(s => s.tutorialStep);

  // Narrative gate: facilities tied to a story quest stay locked until that quest is completed.
  const isQuestLocked = (def: FacilityDefVal) =>
    !!(def.unlockQuestId && !completedMissions.includes(def.unlockQuestId));

  // Guild-level gate. Mirrors guild-slice.ts buildFacility:
  // explicit per-facility requiredGuildLevel PLUS implicit rule that any
  // gold-costing facility needs Guild Lv.2.
  const requiredGuildLevelFor = (def: FacilityDefVal): number =>
    Math.max(def.requiredGuildLevel ?? 1, def.buildCost > 0 ? 2 : 1);

  const lockLabelFor = (def: FacilityDefVal): string | null => {
    if (isQuestLocked(def)) return t('facilityTray.lockedByQuest');
    if (guildLevel < requiredGuildLevelFor(def)) {
      return t('facilityTray.lockedByGuildLevel', { level: requiredGuildLevelFor(def) });
    }
    return null;
  };

  const tutorialTarget: FacilityType | null =
    tutorialStep === 'build-logging-site' ? 'logging-site'
    : tutorialStep === 'build-tavern' ? 'tavern'
    : null;

  const getActiveCount = (type: FacilityType) =>
    facilities.filter(fac => fac.type === type && fac.level > 0).length;

  const buildable = Object.values(FACILITY_DEFINITIONS).filter(def =>
    getActiveCount(def.type) < 3 &&
    (!def.requiredGuildLevel || guildLevel >= def.requiredGuildLevel),
  );

  function canAfford(def: FacilityDefVal): boolean {
    if (def.type === 'logging-site') return (inventory.items['LOGGING_SITE_ACCESS'] ?? 0) > 0;
    if (def.buildMaterialCost && !hasMaterials(def.buildMaterialCost, inventory.items)) return false;
    return def.buildCost === 0 || gold >= def.buildCost;
  }

  function costLabel(def: FacilityDefVal): string {
    if (def.type === 'logging-site') return t('facilityTray.costPermit');
    const parts: string[] = [];
    if (def.buildMaterialCost) {
      const mat = materialCostLabel(def.buildMaterialCost);
      if (mat) parts.push(mat);
    }
    if (def.buildCost > 0) parts.push(`${def.buildCost}g`);
    return parts.length > 0 ? parts.join(' + ') : t('facilityTray.costFree');
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
      {/* Side-sheet variant so it renders above the facilities panel (--bp-z-panel-elevated) */}
      <div className="fbp-root">
        <PanelFrame
          title={t('facilityTray.buildBtn')}
          onClose={onClose}
          variant="side"
        >
          {/* Slot sub-label — was in old header, now top of pf-content */}
          <div className="fbp-slot-label">
            {t('facilityTray.slotLabel', { number: slotIdx + 1 })}
          </div>

          <div className="fbp-grid">
            {buildable.length === 0 && (
              <div className="fbp-empty">{t('facilityTray.allBuilt')}</div>
            )}
            {buildable.map(def => {
              const lockLabel = lockLabelFor(def);
              const reqLevel = requiredGuildLevelFor(def);
              return (
                <FacilityIconCard
                  key={def.type}
                  def={def}
                  activeCount={getActiveCount(def.type)}
                  locked={lockLabel !== null}
                  lockLabel={lockLabel ?? ''}
                  affordable={canAfford(def)}
                  selected={selectedBp === def.type}
                  highlight={tutorialTarget === def.type && selectedBp !== def.type}
                  costText={costLabel(def)}
                  requiredLevel={reqLevel}
                  levelMet={guildLevel >= reqLevel}
                  onSelect={() => setSelectedBp(def.type)}
                />
              );
            })}
          </div>

          <button
            className={`fbp-build-btn${tutorialTarget && selectedBp === tutorialTarget ? ' tutorial-highlight' : ''}`}
            disabled={!selectedBp}
            onClick={() => setBuildConfirm(true)}
          >
            {selDef
              ? t('facilityTray.buildBtnWithName', { name: selDef.name, cost: costLabel(selDef) })
              : t('facilityTray.buildBtn')}
          </button>
        </PanelFrame>
      </div>

      {buildConfirm && selDef && (
        <InkConfirmDialog
          title={t('facilityTray.buildConfirmTitle', { name: selDef.name })}
          body={t('facilityTray.buildConfirmBody', { number: slotIdx + 1, cost: costLabel(selDef) })}
          confirmLabel={t('facilityTray.buildConfirmBtn')}
          onConfirm={handleConfirmBuild}
          onCancel={() => setBuildConfirm(false)}
        />
      )}
    </>
  );
}
