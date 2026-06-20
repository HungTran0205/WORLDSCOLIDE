/** Inventory panel — tabs, search, rarity filter, sort, 8-col grid, detail panel.
 *  Shell (chrome, header, close button, open/close animation, SFX) is owned by
 *  PanelFrame. This file contains only content-specific JSX.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { useUiStore } from '@/game/state/ui-store';
import {
  getCategoryMaxSlots,
  RARITY_ORDER,
  type UnifiedSlotEntry,
} from '@/game/state/inventory-slice';
import type { ItemID, ItemRarity, InventoryCategory } from '@/game/data/items';
import { ITEM_DATABASE } from '@/game/data/items';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import { GameIcon } from '@/ui/components/game-icon';
import { InventoryDetailPanel } from '@/ui/components/inventory-detail-panel';
import { InventorySlotExpansion } from '@/ui/components/inventory-slot-expansion';
import { EquipModePanel } from '@/ui/components/equip-mode-panel';
import { PanelFrame } from '@/ui/components/panel-frame';
import { saveManager } from '@/game/save/save-manager';
import '@/ui/styles/inventory.css';
import '@/ui/styles/equip-mode.css';

type TabId = 'all' | InventoryCategory;

// Tab IDs mapped to i18n keys under inventory.tabs.*
const TAB_IDS: TabId[] = ['all', 'weapon', 'armor', 'material', 'consumable'];

const RARITIES: Array<ItemRarity | 'all'> = ['all', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

export function InventoryPanel({ onClose }: { onClose: () => void }) {
  const inventoryMode     = useUiStore(s => s.inventoryMode);
  const equipModeMemberId = useUiStore(s => s.equipModeMemberId);
  const closeEquipMode    = useUiStore(s => s.closeEquipMode);

  const items                    = useGameStore(s => s.inventory.items);
  const equipmentItems           = useGameStore(s => s.inventory.equipmentInventory ?? []);
  const categoryCapacity         = useGameStore(s => s.inventory.categoryCapacity);
  const removeItem               = useGameStore(s => s.removeItem);
  const removeEquipmentFromInventory = useGameStore(s => s.removeEquipmentFromInventory);
  const founder                  = useGameStore(s => s.founder);
  const roster                   = useGameStore(s => s.roster);

  const [activeTab, setActiveTab]         = useState<TabId>('all');
  const [search, setSearch]               = useState('');
  const [rarityFilter, setRarityFilter]   = useState<ItemRarity | 'all'>('all');
  const [sort, setSort]                   = useState<'rarity' | 'name' | 'qty'>('rarity');
  const [selectedEntry, setSelectedEntry] = useState<UnifiedSlotEntry | null>(null);

  // Esc is now handled by PanelFrame (via onClose prop) for the normal inventory view.
  // The equip-mode early return still needs its own Esc handler since PanelFrame
  // is not mounted in that branch.
  useEffect(() => {
    if (inventoryMode !== 'equip') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeEquipMode(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inventoryMode, closeEquipMode]);

  // Auto-clear selection when the selected item is dropped/consumed
  useEffect(() => {
    if (!selectedEntry) return;
    if (selectedEntry.kind === 'item' && !(items[selectedEntry.itemId] ?? 0)) {
      setSelectedEntry(null);
    }
  }, [items, selectedEntry]);

  // equippedById map: equipmentItemId → memberName
  const equippedByMap = useMemo(() => {
    const map = new Map<string, string>();
    const all = founder ? [founder, ...roster] : roster;
    for (const m of all) {
      if (!m.equipment) continue;
      for (const slot of ['weapon', 'armor'] as const) {
        const e = m.equipment[slot];
        if (e) map.set(e.id, m.name);
      }
    }
    return map;
  }, [founder, roster]);

  const allEntries = useMemo<UnifiedSlotEntry[]>(() => {
    const out: UnifiedSlotEntry[] = [];
    for (const [id, qty] of Object.entries(items)) {
      if (!qty || qty <= 0) continue;
      out.push({ kind: 'item', itemId: id as ItemID, quantity: Math.floor(qty) });
    }
    for (const eq of equipmentItems) {
      if (!EQUIPMENT_DATABASE[eq.templateId]) continue; // skip corrupted save entries
      out.push({ kind: 'equipment', item: eq, templateId: eq.templateId });
    }
    return out;
  }, [items, equipmentItems]);

  const tabCounts = useMemo(() => {
    const c: Record<TabId, number> = { all: allEntries.length, weapon: 0, armor: 0, material: 0, consumable: 0 };
    for (const e of allEntries) {
      if (e.kind === 'item') {
        const tmpl = ITEM_DATABASE[e.itemId];
        if (tmpl.type === 'MATERIAL')   c.material++;
        if (tmpl.type === 'CONSUMABLE') c.consumable++;
      } else {
        const tmpl = EQUIPMENT_DATABASE[e.templateId];
        if (tmpl.slot === 'weapon')  c.weapon++;
        if (tmpl.slot === 'armor')   c.armor++;
      }
    }
    return c;
  }, [allEntries]);

  const filteredEntries = useMemo<UnifiedSlotEntry[]>(() => {
    let list = allEntries;
    if (activeTab !== 'all') {
      list = list.filter(e => {
        if (e.kind === 'item') {
          const tmpl = ITEM_DATABASE[e.itemId];
          return activeTab === 'material' ? tmpl.type === 'MATERIAL' : activeTab === 'consumable' ? tmpl.type === 'CONSUMABLE' : false;
        }
        const tmpl = EQUIPMENT_DATABASE[e.templateId];
        return activeTab === 'weapon' ? tmpl.slot === 'weapon' : tmpl.slot === 'armor';
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => {
        const n = e.kind === 'item' ? ITEM_DATABASE[e.itemId].name : EQUIPMENT_DATABASE[e.templateId].name;
        return n.toLowerCase().includes(q);
      });
    }
    if (rarityFilter !== 'all') {
      list = list.filter(e => {
        const r = e.kind === 'item' ? ITEM_DATABASE[e.itemId].rarity : EQUIPMENT_DATABASE[e.templateId].rarity;
        return r === rarityFilter;
      });
    }
    return [...list].sort((a, b) => {
      const nA = a.kind === 'item' ? ITEM_DATABASE[a.itemId].name : EQUIPMENT_DATABASE[a.templateId].name;
      const nB = b.kind === 'item' ? ITEM_DATABASE[b.itemId].name : EQUIPMENT_DATABASE[b.templateId].name;
      const rA = a.kind === 'item' ? ITEM_DATABASE[a.itemId].rarity : EQUIPMENT_DATABASE[a.templateId].rarity;
      const rB = b.kind === 'item' ? ITEM_DATABASE[b.itemId].rarity : EQUIPMENT_DATABASE[b.templateId].rarity;
      if (sort === 'name') return nA.localeCompare(nB);
      if (sort === 'qty')  return (b.kind === 'item' ? b.quantity : 0) - (a.kind === 'item' ? a.quantity : 0);
      return (RARITY_ORDER[rB] ?? 0) - (RARITY_ORDER[rA] ?? 0); // default: rarity ↓
    });
  }, [allEntries, activeTab, search, rarityFilter, sort]);

  const maxSlots = activeTab !== 'all' ? getCategoryMaxSlots(activeTab, categoryCapacity) : filteredEntries.length;
  const emptyCount = Math.max(0, maxSlots - filteredEntries.length);

  const handleSlotClick = useCallback((entry: UnifiedSlotEntry) => {
    setSelectedEntry(prev => {
      if (!prev) return entry;
      const same = prev.kind === 'item' && entry.kind === 'item' && prev.itemId === entry.itemId
        || prev.kind === 'equipment' && entry.kind === 'equipment' && prev.item.id === entry.item.id;
      return same ? null : entry;
    });
  }, []);

  const handleDetailDrop = useCallback((amount: number) => {
    if (!selectedEntry) return;
    if (selectedEntry.kind === 'item') {
      removeItem(selectedEntry.itemId, amount);
      // selectedEntry auto-cleared by useEffect when item count reaches 0
    } else {
      removeEquipmentFromInventory(selectedEntry.item.id);
      setSelectedEntry(null);
    }
    saveManager.save(() => useGameStore.getState() as unknown as Record<string, unknown>, true);
  }, [selectedEntry, removeItem, removeEquipmentFromInventory]);

  const { t } = useTranslation();

  // Equip mode — rendered inside its own positioner since PanelFrame is not used here
  if (inventoryMode === 'equip' && equipModeMemberId) {
    return (
      <div className="inv-positioner">
        <div onClick={e => e.stopPropagation()}>
          <EquipModePanel memberId={equipModeMemberId} onClose={closeEquipMode} />
        </div>
      </div>
    );
  }

  const selectedEquippedBy = selectedEntry?.kind === 'equipment'
    ? equippedByMap.get(selectedEntry.item.id)
    : undefined;

  return (
    <div className="inv-positioner">
      <PanelFrame title={t('inventory.title')} onClose={onClose} variant="panel" size="lg">
        <div className="inv-main-col">
          <div className="inv-tabs">
            {TAB_IDS.map(id => (
              <button key={id} className={`inv-tab${activeTab === id ? ' inv-tab--active' : ''}`}
                onClick={() => { setActiveTab(id); setSelectedEntry(null); }}>
                {t(`inventory.tabs.${id}`)}<span className="inv-tab__count">{tabCounts[id]}</span>
              </button>
            ))}
          </div>

          <div className="inv-controls">
            <input className="inv-search" type="text" placeholder={t('inventory.searchPlaceholder')}
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="inv-sort" value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
              <option value="rarity">{t('inventory.sort.rarity')}</option>
              <option value="name">{t('inventory.sort.name')}</option>
              <option value="qty">{t('inventory.sort.qty')}</option>
            </select>
          </div>

          <div className="inv-rarity-filters">
            {RARITIES.map(r => (
              <button key={r}
                className={`inv-rarity-pill inv-rarity-pill--${r.toLowerCase()}${rarityFilter === r ? ' inv-rarity-pill--active' : ''}`}
                onClick={() => setRarityFilter(r)}>
                {r === 'all' ? t('inventory.rarityAll') : r[0] + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="inventory-grid inventory-grid--8col">
            {filteredEntries.map((entry, i) => {
              const isItem  = entry.kind === 'item';
              const rarity  = isItem ? ITEM_DATABASE[entry.itemId].rarity : EQUIPMENT_DATABASE[entry.templateId].rarity;
              const name    = isItem ? ITEM_DATABASE[entry.itemId].name   : EQUIPMENT_DATABASE[entry.templateId].name;
              const iconId  = isItem ? entry.itemId : entry.templateId;
              const isSelected = isItem
                ? selectedEntry?.kind === 'item' && selectedEntry.itemId === entry.itemId
                : selectedEntry?.kind === 'equipment' && selectedEntry.item.id === entry.item.id;
              const cls = `inventory-slot inventory-slot--occupied inventory-slot--sm`
                + (rarity !== 'COMMON' ? ` inventory-slot--rarity-${rarity.toLowerCase()}` : '')
                + (isSelected ? ' inventory-slot--selected' : '');
              return (
                <div key={isItem ? `item-${entry.itemId}-${i}` : `eq-${entry.item.id}`}
                  className={cls} onClick={() => handleSlotClick(entry)} title={name}>
                  <GameIcon category="item" id={iconId} size={34} fallbackText={name.slice(0, 3)} />
                  {isItem && entry.quantity > 1 && <span className="inventory-slot__qty">{entry.quantity}</span>}
                  {!isItem && equippedByMap.has(entry.item.id) && <span className="inventory-slot__equipped">{t('inventory.equippedBadge')}</span>}
                </div>
              );
            })}
            {Array.from({ length: emptyCount }, (_, i) => (
              <div key={`empty-${i}`} className="inventory-slot inventory-slot--empty inventory-slot--sm" />
            ))}
          </div>

          <div className="inv-footer">
            <span className="inv-footer-hints">{t('inventory.footer.hints')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="inv-footer-slots">
                {activeTab === 'all'
                  ? t('inventory.footer.totalItems', { count: allEntries.length })
                  : t('inventory.footer.slots', { used: filteredEntries.length, max: maxSlots })}
              </span>
              {activeTab !== 'all' && (
                <InventorySlotExpansion category={activeTab} currentSlots={maxSlots} maxSlots={200} />
              )}
            </div>
          </div>
        </div>

        <div className="inv-detail-col">
          <InventoryDetailPanel entry={selectedEntry} equippedByName={selectedEquippedBy} onDrop={handleDetailDrop} />
        </div>
      </PanelFrame>
    </div>
  );
}
