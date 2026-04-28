/** Inventory panel — centered overlay with chest-themed grid of item slots. */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useGameStore } from '@/game/state/store';
import { useUiStore } from '@/game/state/ui-store';
import { getInventorySlots, getMaxSlots, getUsedSlots } from '@/game/state/inventory-slice';
import type { ItemID } from '@/game/data/items';
import { ITEM_DATABASE } from '@/game/data/items';
import { getEquipmentTemplate } from '@/game/data/equipment-templates';
import { InventorySlot } from '@/ui/components/inventory-slot';
import { ItemDetailPopup } from '@/ui/components/item-detail-popup';
import { EquipModePanel } from '@/ui/components/equip-mode-panel';
import { saveManager } from '@/game/save/save-manager';
import '@/ui/styles/inventory.css';
import '@/ui/styles/equip-mode.css';

interface InventoryPanelProps {
  onClose: () => void;
}

export function InventoryPanel({ onClose }: InventoryPanelProps) {
  const inventoryMode    = useUiStore(s => s.inventoryMode);
  const equipModeMemberId = useUiStore(s => s.equipModeMemberId);
  const closeEquipMode   = useUiStore(s => s.closeEquipMode);

  const items = useGameStore((s) => s.inventory.items);
  const furniture = useGameStore((s) => s.guildHall.furniture);
  const removeItem = useGameStore((s) => s.removeItem);
  const equipmentItems = useGameStore((s) => s.inventory.equipmentInventory ?? []);

  const slots = useMemo(() => getInventorySlots(items), [items]);
  const maxSlots = useMemo(() => getMaxSlots(furniture), [furniture]);
  const usedSlots = getUsedSlots(items, equipmentItems);
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

  // Equip mode: swap inner content to EquipModePanel
  if (inventoryMode === 'equip' && equipModeMemberId) {
    return (
      <div className="inventory-overlay" onClick={closeEquipMode}>
        <div onClick={e => e.stopPropagation()}>
          <EquipModePanel memberId={equipModeMemberId} onClose={closeEquipMode} />
        </div>
      </div>
    );
  }

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

        {/* Equipment inventory section */}
        {equipmentItems.length > 0 && (
          <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
            <h3 style={{ color: 'var(--ink-gold)', fontSize: '0.75rem', marginBottom: 6, fontFamily: 'var(--ink-font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Equipment ({equipmentItems.length})
            </h3>
            <div className="equip-inv-grid">
              {equipmentItems.map((item) => {
                const tpl = getEquipmentTemplate(item.templateId);
                const durPct = Math.round((item.durability / tpl.maxDurability) * 100);
                return (
                  <div key={item.id} className="equip-inv-item">
                    <span className="equip-inv-item-name">{tpl.name}</span>
                    <span>{tpl.damage ? `⚔${tpl.damage}` : ''}{tpl.defense ? ` 🛡${tpl.defense}` : ''}{tpl.hp ? ` ❤+${tpl.hp}` : ''}</span>
                    <span style={{ fontSize: '0.58rem', color: durPct > 50 ? 'var(--ink-status-ok)' : durPct > 20 ? 'var(--ink-status-warn)' : 'var(--ink-status-bad)' }}>
                      {item.durability}/{tpl.maxDurability}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
