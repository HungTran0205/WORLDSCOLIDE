/** Slot expansion button — spends tier1 materials to add 10 slots to a category. */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import {
  SLOT_EXPANSION_COSTS,
  SLOT_EXPANSION_AMOUNT,
} from '@/game/state/inventory-slice';
import type { InventoryCategory } from '@/game/data/items';
import { ITEM_DATABASE } from '@/game/data/items';
import { saveManager } from '@/game/save/save-manager';

interface InventorySlotExpansionProps {
  category: InventoryCategory;
  currentSlots: number;
  maxSlots: number;
}

export function InventorySlotExpansion({ category, currentSlots, maxSlots }: InventorySlotExpansionProps) {
  const { t } = useTranslation();
  const hasItems           = useGameStore(s => s.hasItems);
  const consumeItems       = useGameStore(s => s.consumeItems);
  const expandCategorySlots = useGameStore(s => s.expandCategorySlots);

  const cost = SLOT_EXPANSION_COSTS.tier1;
  const isMaxed     = currentSlots >= maxSlots;
  const canAfford   = hasItems(cost);

  const handleExpand = useCallback(() => {
    if (isMaxed || !canAfford) return;
    if (consumeItems(cost)) {
      expandCategorySlots(category, SLOT_EXPANSION_AMOUNT);
      saveManager.save(() => useGameStore.getState() as unknown as Record<string, unknown>, true);
    }
  }, [isMaxed, canAfford, consumeItems, cost, expandCategorySlots, category]);

  if (isMaxed) {
    return <span className="inv-expand-maxed">{t('inventoryExpansion.maxCapacity')}</span>;
  }

  return (
    <button
      className="inv-expand-btn"
      onClick={handleExpand}
      disabled={!canAfford}
      title={canAfford
        ? t('inventoryExpansion.expandTitle', { count: SLOT_EXPANSION_AMOUNT })
        : t('inventoryExpansion.notEnoughResources')}
    >
      {t('inventoryExpansion.expandSlots', { count: SLOT_EXPANSION_AMOUNT })}
      <span className={`inv-expand-cost${!canAfford ? ' inv-expand-cost--unaffordable' : ''}`}>
        {Object.entries(cost).map(([id, qty]) => (
          <span key={id}> {ITEM_DATABASE[id as keyof typeof ITEM_DATABASE]?.name ?? id}×{qty}</span>
        ))}
      </span>
    </button>
  );
}
