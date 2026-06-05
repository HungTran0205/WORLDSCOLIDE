/**
 * Workshop Enhance tab — two modes: Add Slot (free-slot equipment) or Reroll
 * (existing-slot equipment). MVP: Slime Gel only (HP category).
 * Reroll opens a confirm modal showing range + warning that value can drop.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { ITEM_DATABASE, type ItemID } from '@/game/data/items';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import { getAffinity, isMaterialEnabled } from '@/game/data/workshop-material-affinity';
import { WORKSHOP_CONFIG } from '@/game/data/workshop-config';
import type { GuildFacility, EquipmentItem } from '@/game/state/game-state';
import { InkConfirmDialog } from '@/ui/components/ink-confirm-dialog';
import { GameIcon } from '@/ui/components/game-icon';
import { itemName } from '@/i18n/content-wrappers';
import { WorkshopEquipmentGrid } from './workshop-equipment-grid';

const MONSTER_MATERIALS: ItemID[] = [
  'SLIME_GEL', 'BAT_WING', 'SPIDER_LEGS', 'METAL_PLATE', 'DRONE_SENSOR',
];
type Mode = 'add' | 'reroll';

function formatSlotValue(statKey: string, value: number): string {
  if (statKey === 'HP') return `+${value}`;
  return `+${(value * 100).toFixed(1)}%`;
}

interface Props { facility: GuildFacility; }

export function WorkshopEnhanceTab({ facility }: Props) {
  const { t } = useTranslation();
  const items = useGameStore((s) => s.inventory.items);
  const equipmentInventory = useGameStore((s) => s.inventory.equipmentInventory ?? []);
  const addWorkshopTask = useGameStore((s) => s.addWorkshopTask);

  const [mode, setMode] = useState<Mode>('add');
  const [selEqId, setSelEqId] = useState<string | null>(null);
  const [monsterMat, setMonsterMat] = useState<ItemID>('SLIME_GEL');
  const [rerollSlotIdx, setRerollSlotIdx] = useState<number>(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const maxSlots = WORKSHOP_CONFIG.equipmentMaxSlots;

  const eligible = useMemo(() => equipmentInventory.filter((e) => {
    const slots = e.slots ?? [];
    if (mode === 'add') return slots.length < maxSlots;
    return slots.length > 0;
  }), [equipmentInventory, mode, maxSlots]);

  const eligibleIds = useMemo(() => new Set(eligible.map((e) => e.id)), [eligible]);

  const selEq: EquipmentItem | null = eligible.find((e) => e.id === selEqId) ?? null;
  const selEqTpl = selEq ? EQUIPMENT_DATABASE[selEq.templateId] : null;
  const slotCount = selEq?.slots?.length ?? 0;
  const safeSlotIdx = slotCount > 0 ? Math.min(rerollSlotIdx, slotCount - 1) : 0;
  const aff = getAffinity(monsterMat);
  const haveMat = (items[monsterMat] ?? 0) >= 1;
  const matEnabled = isMaterialEnabled(monsterMat);
  const canAct = !!selEq && haveMat && matEnabled;

  function handleSelect(entry: { item: EquipmentItem }) {
    const id = entry.item.id;
    setSelEqId((prev) => (prev === id ? null : id));
    setRerollSlotIdx(0);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setSelEqId(null);
    setRerollSlotIdx(0);
  }

  function handleEnhance() {
    if (!selEq || !canAct) return;
    if (mode === 'add') {
      addWorkshopTask(facility.id, {
        kind: 'ENHANCE_ADD',
        equipmentInstanceId: selEq.id,
        monsterMaterial: monsterMat,
      });
      setSelEqId(null);
    } else {
      setConfirmOpen(true);
    }
  }

  function handleConfirmReroll() {
    if (!selEq) return;
    addWorkshopTask(facility.id, {
      kind: 'ENHANCE_REROLL',
      equipmentInstanceId: selEq.id,
      slotIndex: safeSlotIdx,
      monsterMaterial: monsterMat,
    });
    setConfirmOpen(false);
    setSelEqId(null);
  }

  return (
    <div className="ws-tab-body">
      {/* Mode toggle */}
      <div className="ws-toggle-row">
        <button className={`ws-toggle ${mode === 'add' ? 'is-active' : ''}`} onClick={() => switchMode('add')}>
          {t('workshop.enhance.addSlot')}
        </button>
        <button className={`ws-toggle ${mode === 'reroll' ? 'is-active' : ''}`} onClick={() => switchMode('reroll')}>
          {t('workshop.enhance.reroll')}
        </button>
      </div>

      {/* Equipment inventory grid */}
      <div className="ws-section">
        <div className="ws-section-title">
          {mode === 'add' ? t('workshop.enhance.equipWithFreeSlot') : t('workshop.enhance.equipWithSlot')}
        </div>
        <WorkshopEquipmentGrid
          unequippedItems={equipmentInventory}
          eligibleIds={eligibleIds}
          selectedId={selEqId}
          onSelect={handleSelect}
          maxSlots={maxSlots}
          emptyLabel={t('workshop.enhance.noEligible')}
        />
      </div>

      {/* Slot selector for reroll */}
      {mode === 'reroll' && selEq && slotCount > 1 && (
        <div className="ws-section">
          <div className="ws-section-title">{t('workshop.enhance.slotToReroll')}</div>
          <div className="ws-mat-row">
            {(selEq.slots ?? []).map((s, i) => (
              <button
                key={i}
                className={`ws-mat-cell ${safeSlotIdx === i ? 'is-selected' : ''}`}
                onClick={() => setRerollSlotIdx(i)}
              >
                <span className="ws-slot-chip">{s.statKey}{formatSlotValue(s.statKey, s.value)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected item info strip */}
      {selEq && (
        <div className="ws-path-card">
          <div className="ws-path-label">{selEqTpl?.name}</div>
          <div className="ws-path-detail">
            {(selEq.slots ?? []).length > 0
              ? (selEq.slots ?? []).map((s, i) => (
                  <span key={i} className="ws-slot-chip" style={{ marginRight: 4 }}>
                    {s.statKey}{formatSlotValue(s.statKey, s.value)}
                  </span>
                ))
              : <span style={{ fontStyle: 'italic' }}>{t('workshop.enhance.noSlots')}</span>
            }
          </div>
        </div>
      )}

      {/* Material picker */}
      <div className="ws-section">
        <div className="ws-section-title">{t('workshop.enhance.monsterMaterial')}</div>
        <div className="ws-mat-row">
          {MONSTER_MATERIALS.map((id) => {
            const owned = Math.floor(items[id] ?? 0);
            const enabled = isMaterialEnabled(id);
            return (
              <button
                key={id}
                className={`ws-mat-cell ${monsterMat === id ? 'is-selected' : ''} ${enabled ? '' : 'is-disabled'}`}
                onClick={() => enabled && setMonsterMat(id)}
                disabled={!enabled}
                title={`${itemName(id)} ×${owned}`}
              >
                <GameIcon category="item" id={id} size={28} fallbackText={ITEM_DATABASE[id].name.slice(0, 2)} />
                <span className="ws-mat-count">×{owned}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Range preview */}
      {aff && matEnabled && (
        <div className="ws-path-card">
          <div className="ws-path-label">{t('workshop.enhance.rangePreview')}</div>
          <div className="ws-path-detail">
            {t('workshop.enhance.rangeDetail', {
              statKey: aff.statKey,
              min: aff.range[0],
              max: aff.range[1],
              category: aff.category,
            })}
          </div>
        </div>
      )}

      {/* Action */}
      <div className="ws-actions">
        <button className="ws-btn ws-btn-primary" disabled={!canAct} onClick={handleEnhance}>
          {mode === 'add' ? t('workshop.enhance.addSlot') : t('workshop.enhance.reroll')}
        </button>
      </div>

      {/* Reroll confirm modal */}
      {confirmOpen && selEq && aff && (
        <InkConfirmDialog
          title={t('workshop.enhance.confirmTitle')}
          body={t('workshop.enhance.confirmBody', {
            statKey: selEq.slots?.[safeSlotIdx]?.statKey ?? '',
            current: selEq.slots?.[safeSlotIdx]?.value ?? 0,
            min: aff.range[0],
            max: aff.range[1],
          })}
          confirmLabel={t('workshop.enhance.confirmLabel')}
          onConfirm={handleConfirmReroll}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
