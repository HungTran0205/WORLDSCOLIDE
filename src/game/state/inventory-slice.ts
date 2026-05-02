/** Inventory slice — manages item quantities in the guild inventory. */

import type { StateCreator } from 'zustand';
import type { ItemID, InventoryCategory } from '@/game/data/items';
import { ITEM_DATABASE, STACK_LIMIT } from '@/game/data/items';
import type { EquipmentItem, InventoryState } from './game-state';
import type { EquipmentTemplateId } from '@/game/data/equipment-templates';

export const CATEGORY_DEFAULT_SLOTS = 30;
export const SLOT_EXPANSION_AMOUNT = 10;

export const SLOT_EXPANSION_COSTS: Record<string, Partial<Record<ItemID, number>>> = {
  tier1: { WOOD: 20, STONE: 10 },
  tier2: { IRON_ORE: 10, GEM: 2 },
};

/** Returns max slots for a category — falls back to default if no override set */
export function getCategoryMaxSlots(
  category: InventoryCategory,
  capacity?: Partial<Record<InventoryCategory, number>>
): number {
  return capacity?.[category] ?? CATEGORY_DEFAULT_SLOTS;
}

/** Unified slot entry for the inventory grid — items or equipment */
export type UnifiedSlotEntry =
  | { kind: 'item'; itemId: ItemID; quantity: number }
  | { kind: 'equipment'; item: EquipmentItem; templateId: EquipmentTemplateId };

/** Count how many visual slots the current items occupy (equipment items each take 1 slot) */
export function getUsedSlots(items: Partial<Record<ItemID, number>>, equipmentItems: EquipmentItem[] = []): number {
  let used = 0;
  for (const [id, qty] of Object.entries(items)) {
    if (!qty || qty <= 0) continue;
    const intQty = Math.floor(qty);
    if (intQty <= 0) continue;
    const template = ITEM_DATABASE[id as ItemID];
    used += template?.stackable ? Math.ceil(intQty / STACK_LIMIT) : intQty;
  }
  return used + equipmentItems.length;
}

/** Inventory slot entry for UI grid rendering */
export interface InventorySlotEntry {
  itemId: ItemID;
  quantity: number;
}

/** Rarity sort order — export so UI can import instead of duplicating */
export const RARITY_ORDER: Record<string, number> = { COMMON: 0, UNCOMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4 };

/** Build visual slot array — splits stacks >99, sorted by type then rarity */
export function getInventorySlots(items: Partial<Record<ItemID, number>>): InventorySlotEntry[] {
  const slots: InventorySlotEntry[] = [];
  for (const [id, qty] of Object.entries(items)) {
    if (!qty || qty <= 0) continue;
    const intQty = Math.floor(qty);
    if (intQty <= 0) continue;
    const itemId = id as ItemID;
    const template = ITEM_DATABASE[itemId];
    if (template?.stackable) {
      let remaining = intQty;
      while (remaining > 0) {
        const chunk = Math.min(remaining, STACK_LIMIT);
        slots.push({ itemId, quantity: chunk });
        remaining -= chunk;
      }
    } else {
      const cap = Math.min(intQty, 200); // defensive cap for corrupted data
      for (let i = 0; i < cap; i++) slots.push({ itemId, quantity: 1 });
    }
  }
  // Sort: type alphabetical, then rarity ascending
  slots.sort((a, b) => {
    const ta = ITEM_DATABASE[a.itemId], tb = ITEM_DATABASE[b.itemId];
    const typeCmp = ta.type.localeCompare(tb.type);
    if (typeCmp !== 0) return typeCmp;
    return (RARITY_ORDER[ta.rarity] ?? 0) - (RARITY_ORDER[tb.rarity] ?? 0);
  });
  return slots;
}

export interface InventorySlice {
  inventory: InventoryState;
  addItem: (id: ItemID, amount: number) => void;
  removeItem: (id: ItemID, amount: number) => void;
  /** Check if inventory has at least the specified quantities of all items */
  hasItems: (cost: Partial<Record<ItemID, number>>) => boolean;
  /** Atomically deduct items — returns false with no mutation if any item insufficient */
  consumeItems: (cost: Partial<Record<ItemID, number>>) => boolean;
  getItemCount: (id: ItemID) => number;
  /** Add slots to a specific category, capped at 200 */
  expandCategorySlots: (category: InventoryCategory, amount: number) => void;
  /** Remove an equipment instance from the unequipped inventory pool */
  removeEquipmentFromInventory: (instanceId: string) => void;
}

export const createInventorySlice: StateCreator<InventorySlice> = (set, get) => ({
  inventory: { items: {}, equipmentInventory: [] },

  addItem: (id, amount) => {
    if (amount <= 0) return;
    const rounded = Math.floor(amount);
    if (rounded <= 0) return;
    set((s) => ({
      inventory: {
        ...s.inventory,
        items: { ...s.inventory.items, [id]: (s.inventory.items[id] ?? 0) + rounded },
      },
    }));
  },

  removeItem: (id, amount) => {
    if (amount <= 0) return;
    set((s) => {
      const current = s.inventory.items[id] ?? 0;
      const newAmount = Math.max(0, current - amount);
      const newItems = { ...s.inventory.items };
      if (newAmount > 0) {
        newItems[id] = newAmount;
      } else {
        delete newItems[id];
      }
      return { inventory: { ...s.inventory, items: newItems } };
    });
  },

  hasItems: (cost) => {
    const { inventory } = get();
    for (const [id, needed] of Object.entries(cost)) {
      if (needed && needed > 0 && (inventory.items[id as ItemID] ?? 0) < needed) {
        return false;
      }
    }
    return true;
  },

  consumeItems: (cost) => {
    let success = false;
    set((s) => {
      // Check + deduct inside single set() for atomicity
      for (const [id, needed] of Object.entries(cost)) {
        if (needed && needed > 0 && (s.inventory.items[id as ItemID] ?? 0) < needed) {
          return s; // insufficient — no mutation
        }
      }
      const newItems = { ...s.inventory.items };
      for (const [id, needed] of Object.entries(cost)) {
        if (needed && needed > 0) {
          newItems[id as ItemID] = (newItems[id as ItemID] ?? 0) - needed;
        }
      }
      // Clean up zero-quantity entries (match removeItem behavior)
      for (const key of Object.keys(newItems)) {
        if ((newItems[key as ItemID] ?? 0) <= 0) delete newItems[key as ItemID];
      }
      success = true;
      return { inventory: { ...s.inventory, items: newItems } };
    });
    return success;
  },

  getItemCount: (id) => get().inventory.items[id] ?? 0,

  removeEquipmentFromInventory: (instanceId) => {
    set((s) => ({
      inventory: {
        ...s.inventory,
        equipmentInventory: (s.inventory.equipmentInventory ?? []).filter(e => e.id !== instanceId),
      },
    }));
  },

  expandCategorySlots: (category, amount) => {
    set((s) => {
      const current = s.inventory.categoryCapacity?.[category] ?? CATEGORY_DEFAULT_SLOTS;
      const next = Math.min(current + amount, 200);
      return {
        inventory: {
          ...s.inventory,
          categoryCapacity: { ...s.inventory.categoryCapacity, [category]: next },
        },
      };
    });
  },
});
