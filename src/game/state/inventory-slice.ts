/** Inventory slice — manages item quantities in the guild inventory. */

import type { StateCreator } from 'zustand';
import type { ItemID } from '@/game/data/items';
import { ITEM_DATABASE, STACK_LIMIT } from '@/game/data/items';
import type { InventoryState, PlacedFurniture } from './game-state';

export const BASE_INVENTORY_SLOTS = 10;
export const SLOTS_PER_CHEST = 20;

/** Max inventory slots given placed storage chests */
export function getMaxSlots(furniture: PlacedFurniture[]): number {
  const chestCount = furniture.filter((f) => f.type === 'storage-chest').length;
  return BASE_INVENTORY_SLOTS + SLOTS_PER_CHEST * chestCount;
}

/** Count how many visual slots the current items occupy */
export function getUsedSlots(items: Partial<Record<ItemID, number>>): number {
  let used = 0;
  for (const [id, qty] of Object.entries(items)) {
    if (!qty || qty <= 0) continue;
    const template = ITEM_DATABASE[id as ItemID];
    used += template?.stackable ? Math.ceil(qty / STACK_LIMIT) : qty;
  }
  return used;
}

/** Inventory slot entry for UI grid rendering */
export interface InventorySlotEntry {
  itemId: ItemID;
  quantity: number;
}

/** Rarity sort order (higher = later in grid) */
const RARITY_ORDER: Record<string, number> = { COMMON: 0, UNCOMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4 };

/** Build visual slot array — splits stacks >99, sorted by type then rarity */
export function getInventorySlots(items: Partial<Record<ItemID, number>>): InventorySlotEntry[] {
  const slots: InventorySlotEntry[] = [];
  for (const [id, qty] of Object.entries(items)) {
    if (!qty || qty <= 0) continue;
    const itemId = id as ItemID;
    const template = ITEM_DATABASE[itemId];
    if (template?.stackable) {
      let remaining = qty;
      while (remaining > 0) {
        const chunk = Math.min(remaining, STACK_LIMIT);
        slots.push({ itemId, quantity: chunk });
        remaining -= chunk;
      }
    } else {
      const cap = Math.min(qty, 200); // defensive cap for corrupted data
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
}

export const createInventorySlice: StateCreator<InventorySlice> = (set, get) => ({
  inventory: { items: {} },

  addItem: (id, amount) => {
    if (amount <= 0) return;
    set((s) => ({
      inventory: {
        ...s.inventory,
        items: { ...s.inventory.items, [id]: (s.inventory.items[id] ?? 0) + amount },
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
});
