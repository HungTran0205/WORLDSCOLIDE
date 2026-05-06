/**
 * Workshop Enhance tab — two modes: Add Slot (free-slot equipment) or Reroll
 * (existing-slot equipment). MVP: Slime Gel only (HP category).
 * Reroll opens a confirm modal showing range + warning that value can drop.
 */

import { useState, useMemo } from 'react';
import { useGameStore } from '@/game/state/store';
import { ITEM_DATABASE, type ItemID } from '@/game/data/items';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import { getAffinity, isMaterialEnabled } from '@/game/data/workshop-material-affinity';
import { WORKSHOP_CONFIG } from '@/game/data/workshop-config';
import type { GuildFacility, EquipmentItem } from '@/game/state/game-state';
import { InkConfirmDialog } from '@/ui/components/ink-confirm-dialog';
import { GameIcon } from '@/ui/components/game-icon';

const MONSTER_MATERIALS: ItemID[] = ['SLIME_GEL'];
type Mode = 'add' | 'reroll';

interface Props { facility: GuildFacility; }

export function WorkshopEnhanceTab({ facility }: Props) {
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

  const selEq: EquipmentItem | null = eligible.find((e) => e.id === selEqId) ?? null;
  // Clamp slot index defensively — selected eq may have fewer slots than last picked
  const slotCount = selEq?.slots?.length ?? 0;
  const safeSlotIdx = slotCount > 0 ? Math.min(rerollSlotIdx, slotCount - 1) : 0;
  const aff = getAffinity(monsterMat);
  const haveMat = (items[monsterMat] ?? 0) >= 1;
  const matEnabled = isMaterialEnabled(monsterMat);
  const canAct = !!selEq && haveMat && matEnabled;

  function selectEquipment(id: string | null) {
    setSelEqId(id);
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
      selectEquipment(null);
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
    selectEquipment(null);
  }

  return (
    <div className="ws-tab-body">
      {/* Mode toggle */}
      <div className="ws-toggle-row">
        <button className={`ws-toggle ${mode === 'add' ? 'is-active' : ''}`} onClick={() => switchMode('add')}>Add Slot</button>
        <button className={`ws-toggle ${mode === 'reroll' ? 'is-active' : ''}`} onClick={() => switchMode('reroll')}>Reroll</button>
      </div>

      {/* Equipment picker */}
      <div className="ws-section">
        <div className="ws-section-title">
          {mode === 'add' ? 'Equipment with free slot' : 'Equipment with existing slot'}
        </div>
        <div className="ws-eq-list">
          {eligible.length === 0 && <div className="ws-empty">No eligible equipment.</div>}
          {eligible.map((e) => {
            const tpl = EQUIPMENT_DATABASE[e.templateId];
            const slots = e.slots ?? [];
            return (
              <div
                key={e.id}
                className={`ws-eq-row ${selEqId === e.id ? 'is-selected' : ''}`}
                onClick={() => selectEquipment(e.id)}
              >
                <span className="ws-eq-name">{tpl.name}</span>
                <span className="ws-eq-slots">
                  {slots.length}/{maxSlots} slots
                  {slots.map((s, i) => (
                    <span key={i} className="ws-slot-chip">{s.statKey}+{s.value}</span>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot selector for reroll */}
      {mode === 'reroll' && selEq && (selEq.slots?.length ?? 0) > 1 && (
        <div className="ws-section">
          <div className="ws-section-title">Slot to reroll</div>
          <div className="ws-mat-row">
            {(selEq.slots ?? []).map((s, i) => (
              <button
                key={i}
                className={`ws-mat-cell ${safeSlotIdx === i ? 'is-selected' : ''}`}
                onClick={() => setRerollSlotIdx(i)}
              >
                <span className="ws-slot-chip">{s.statKey}+{s.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Material picker */}
      <div className="ws-section">
        <div className="ws-section-title">Monster Material</div>
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
                title={`${ITEM_DATABASE[id].name} ×${owned}`}
              >
                <GameIcon category="item" id={id} size={28} fallbackText={ITEM_DATABASE[id].name.slice(0, 2)} />
                <span className="ws-mat-count">×{owned}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      {aff && matEnabled && (
        <div className="ws-path-card">
          <div className="ws-path-label">Range Preview</div>
          <div className="ws-path-detail">
            {aff.statKey} +{aff.range[0]} to +{aff.range[1]} ({aff.category})
          </div>
        </div>
      )}

      {/* Action */}
      <div className="ws-actions">
        <button className="ws-btn ws-btn-primary" disabled={!canAct} onClick={handleEnhance}>
          {mode === 'add' ? 'Add Slot' : 'Reroll'}
        </button>
      </div>

      {/* Reroll confirm modal */}
      {confirmOpen && selEq && aff && (
        <InkConfirmDialog
          title="Confirm Reroll"
          body={`Reroll ${selEq.slots?.[safeSlotIdx]?.statKey} ${selEq.slots?.[safeSlotIdx]?.value} → range ${aff.range[0]}-${aff.range[1]}? New value can be lower than current.`}
          confirmLabel="Reroll"
          onConfirm={handleConfirmReroll}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
