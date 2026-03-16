/** Loot rolling utilities — pure functions for generating item drops from enemy loot tables. */

import type { LootRule } from '@/game/data/enemies';
import type { ItemID } from '@/game/data/items';

/** Roll loot from a single enemy's loot table. Returns accumulated items. */
export function rollLoot(lootTable: LootRule[]): Partial<Record<ItemID, number>> {
  const result: Partial<Record<ItemID, number>> = {};
  for (const rule of lootTable) {
    if (Math.random() <= rule.chance) {
      const amount = Math.floor(Math.random() * (rule.max - rule.min + 1)) + rule.min;
      result[rule.itemId] = (result[rule.itemId] ?? 0) + amount;
    }
  }
  return result;
}

/** Merge multiple loot results into one aggregated map. */
export function mergeLoot(
  ...loots: Partial<Record<ItemID, number>>[]
): Partial<Record<ItemID, number>> {
  const merged: Partial<Record<ItemID, number>> = {};
  for (const loot of loots) {
    for (const [id, amount] of Object.entries(loot)) {
      if (amount && amount > 0) {
        merged[id as ItemID] = (merged[id as ItemID] ?? 0) + amount;
      }
    }
  }
  return merged;
}
