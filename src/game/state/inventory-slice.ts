/** Inventory slice — manages item quantities in the guild inventory. */

import type { StateCreator } from 'zustand';
import type { ItemID } from '@/game/data/items';
import type { InventoryState } from './game-state';

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
      success = true;
      return { inventory: { ...s.inventory, items: newItems } };
    });
    return success;
  },

  getItemCount: (id) => get().inventory.items[id] ?? 0,
});
