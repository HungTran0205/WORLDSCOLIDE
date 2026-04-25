/** Inventory panel — centered overlay with chest-themed grid of item slots. */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useGameStore } from '@/game/state/store';
import { getInventorySlots, getMaxSlots, getUsedSlots } from '@/game/state/inventory-slice';
import type { ItemID } from '@/game/data/items';
import { ITEM_DATABASE } from '@/game/data/items';
import { InventorySlot } from '@/ui/components/inventory-slot';
import { ItemDetailPopup } from '@/ui/components/item-detail-popup';
import { saveManager } from '@/game/save/save-manager';
import '@/ui/styles/inventory.css';

interface InventoryPanelProps {
  onClose: () => void;
}

export function InventoryPanel({ onClose }: InventoryPanelProps) {
  const items = useGameStore((s) => s.inventory.items);
  const furniture = useGameStore((s) => s.guildHall.furniture);
  const removeItem = useGameStore((s) => s.removeItem);

  const slots = useMemo(() => getInventorySlots(items), [items]);
  const maxSlots = useMemo(() => getMaxSlots(furniture), [furniture]);
  const usedSlots = getUsedSlots(items);
  const emptyCount = Math.max(0, maxSlots - usedSlots);

  // Track selection by itemId (stable across sort changes) instead of index
  const [selectedItemId, setSelectedItemId] = useState<ItemID | null>(null);

  const handleSlotClick = useCallback((itemId: ItemID) => {
    setSelectedItemId((prev) => (prev === itemId ? null : itemId));
  }, []);

  const handleClosePopup = useCallback(() => setSelectedItemId(null), []);

  // Escape key to close panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Aggregate total quantity per itemId for the detail popup (floor to avoid float display)
  const selectedTotalQty = selectedItemId ? Math.floor(items[selectedItemId] ?? 0) : 0;

  const handleDrop = useCallback((amount: number) => {
    if (!selectedItemId) return;
    removeItem(selectedItemId, amount);
    const remaining = Math.floor(items[selectedItemId] ?? 0) - amount;
    if (remaining <= 0) setSelectedItemId(null);
    // Trigger save immediately so drop persists across reloads
    saveManager.save(() => useGameStore.getState() as unknown as Record<string, unknown>, true);
  }, [selectedItemId, removeItem, items]);

  return (
    <div className="inventory-overlay" onClick={onClose}>
      <div className="inventory-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="inventory-panel__header">
          <h2 className="inventory-panel__title">Guild Inventory</h2>
          <button className="inventory-panel__close" onClick={onClose}>✕</button>
        </div>

        {/* Grid */}
        <div className="inventory-grid">
          {slots.map((slot, i) => (
            <InventorySlot
              key={`${slot.itemId}-${i}`}
              item={slot}
              isSelected={selectedItemId === slot.itemId}
              onClick={() => handleSlotClick(slot.itemId)}
            />
          ))}
          {Array.from({ length: emptyCount }, (_, i) => (
            <InventorySlot key={`empty-${i}`} />
          ))}
        </div>

        {/* Item detail popup */}
        {selectedItemId && selectedTotalQty > 0 && (
          <ItemDetailPopup
            itemId={selectedItemId}
            quantity={selectedTotalQty}
            stackable={ITEM_DATABASE[selectedItemId]?.stackable ?? false}
            onClose={handleClosePopup}
            onDrop={handleDrop}
          />
        )}
      </div>
    </div>
  );
}
