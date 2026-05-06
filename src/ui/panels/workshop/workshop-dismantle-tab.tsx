/**
 * Workshop Dismantle tab — instant action with confirm modal showing
 * recovery preview (~70-80% of base material for plain, +30% chance of
 * monster mat for crafted equipment).
 */

import { useState } from 'react';
import { useGameStore } from '@/game/state/store';
import { ITEM_DATABASE, type ItemID } from '@/game/data/items';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import { WORKSHOP_CONFIG } from '@/game/data/workshop-config';
import type { EquipmentItem } from '@/game/state/game-state';
import { InkConfirmDialog } from '@/ui/components/ink-confirm-dialog';


function previewRecovery(eq: EquipmentItem): { matId: ItemID | null; range: [number, number]; isCrafted: boolean } {
  const tpl = EQUIPMENT_DATABASE[eq.templateId];
  const baseCost = tpl.craftCost ?? 0;
  const isCrafted = (eq.slots?.length ?? 0) > 0;
  const rate = isCrafted
    ? WORKSHOP_CONFIG.dismantleRecoveryRate.crafted
    : WORKSHOP_CONFIG.dismantleRecoveryRate.plain;
  return {
    matId: tpl.craftMaterial ?? null,
    range: [Math.floor(baseCost * rate[0]), Math.floor(baseCost * rate[1])],
    isCrafted,
  };
}

export function WorkshopDismantleTab() {
  const equipmentInventory = useGameStore((s) => s.inventory.equipmentInventory ?? []);
  const dismantleEquipment = useGameStore((s) => s.dismantleEquipment);

  const [target, setTarget] = useState<EquipmentItem | null>(null);

  function handleConfirm() {
    if (!target) return;
    dismantleEquipment(target.id);
    setTarget(null);
  }

  return (
    <div className="ws-tab-body">
      <div className="ws-section">
        <div className="ws-section-title">Equipment Inventory</div>
        {equipmentInventory.length === 0 && <div className="ws-empty">Inventory empty.</div>}
        <div className="ws-eq-list">
          {equipmentInventory.map((e) => {
            const tpl = EQUIPMENT_DATABASE[e.templateId];
            const slots = e.slots ?? [];
            return (
              <div key={e.id} className="ws-eq-row">
                <div className="ws-eq-info">
                  <span className="ws-eq-name">{tpl.name}</span>
                  <span className="ws-eq-meta">
                    {slots.length} slot{slots.length !== 1 ? 's' : ''}
                    {slots.map((s, i) => (
                      <span key={i} className="ws-slot-chip">{s.statKey}+{s.value}</span>
                    ))}
                  </span>
                </div>
                <button className="ws-btn ws-btn-small ws-btn-danger" onClick={() => setTarget(e)}>
                  Dismantle
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {target && (() => {
        const prev = previewRecovery(target);
        const tpl = EQUIPMENT_DATABASE[target.templateId];
        const matName = prev.matId ? ITEM_DATABASE[prev.matId].name : '—';
        const matRecoveryPct = Math.round(WORKSHOP_CONFIG.dismantleMaterialRecoveryChance * 100);
        const body = prev.isCrafted
          ? `Dismantle ${tpl.name}? Recovery: ~${prev.range[0]}-${prev.range[1]}× ${matName} + ${matRecoveryPct}% chance 1× monster material.`
          : `Dismantle ${tpl.name}? Recovery: ~${prev.range[0]}-${prev.range[1]}× ${matName}.`;
        return (
          <InkConfirmDialog
            title="Dismantle Equipment"
            body={body}
            confirmLabel="Dismantle"
            onConfirm={handleConfirm}
            onCancel={() => setTarget(null)}
          />
        );
      })()}
    </div>
  );
}
