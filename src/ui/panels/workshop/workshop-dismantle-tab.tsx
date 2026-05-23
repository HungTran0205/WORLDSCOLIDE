/**
 * Workshop Dismantle tab — instant action with confirm modal showing
 * recovery preview (~70-80% of base material for plain, +30% chance of
 * monster mat for crafted equipment).
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import { WORKSHOP_CONFIG } from '@/game/data/workshop-config';
import type { EquipmentItem } from '@/game/state/game-state';
import { InkConfirmDialog } from '@/ui/components/ink-confirm-dialog';
import { equipmentName, itemName } from '@/i18n/content-wrappers';
import type { ItemID } from '@/game/data/items';

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
  const { t } = useTranslation();
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
        <div className="ws-section-title">{t('workshop.dismantle.inventoryTitle')}</div>
        {equipmentInventory.length === 0 && (
          <div className="ws-empty">{t('workshop.dismantle.inventoryEmpty')}</div>
        )}
        <div className="ws-eq-list">
          {equipmentInventory.map((e) => {
            const slots = e.slots ?? [];
            return (
              <div key={e.id} className="ws-eq-row">
                <div className="ws-eq-info">
                  <span className="ws-eq-name">{equipmentName(e.templateId)}</span>
                  <span className="ws-eq-meta">
                    {t('workshop.dismantle.slot', { count: slots.length })}
                    {slots.map((s, i) => (
                      <span key={i} className="ws-slot-chip">{s.statKey}+{s.value}</span>
                    ))}
                  </span>
                </div>
                <button className="ws-btn ws-btn-small ws-btn-danger" onClick={() => setTarget(e)}>
                  {t('workshop.dismantle.dismantleBtn')}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {target && (() => {
        const prev = previewRecovery(target);
        const mat = prev.matId ? itemName(prev.matId) : t('workshop.dismantle.matPlaceholder');
        const matRecoveryPct = Math.round(WORKSHOP_CONFIG.dismantleMaterialRecoveryChance * 100);
        const body = prev.isCrafted
          ? t('workshop.dismantle.bodyCrafted', {
              name: equipmentName(target.templateId),
              min: prev.range[0],
              max: prev.range[1],
              mat,
              pct: matRecoveryPct,
            })
          : t('workshop.dismantle.bodyPlain', {
              name: equipmentName(target.templateId),
              min: prev.range[0],
              max: prev.range[1],
              mat,
            });
        return (
          <InkConfirmDialog
            title={t('workshop.dismantle.title')}
            body={body}
            confirmLabel={t('workshop.dismantle.confirmLabel')}
            onConfirm={handleConfirm}
            onCancel={() => setTarget(null)}
          />
        );
      })()}
    </div>
  );
}
