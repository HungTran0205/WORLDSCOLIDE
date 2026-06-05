/** Alchemy recipe definitions — ingredients → output mappings used by the crafting panel. */

import type { ItemID } from './items';

export interface AlchemyRecipe {
  id: string;
  name: string;
  /** Per-output-unit ingredient requirements */
  ingredients: Partial<Record<ItemID, number>>;
  output: { itemId: ItemID; quantity: number };
  requiredAlchemyLevel: number;
}

export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
  {
    id: 'healing-syringe',
    name: 'Healing Syringe',
    ingredients: { SLIME_GEL: 1 },
    output: { itemId: 'HEALING_SYRINGE', quantity: 1 },
    requiredAlchemyLevel: 0,
  },
  {
    id: 'healing-syringe-2',
    name: 'Healing Syringe II',
    ingredients: { SLIME_GEL: 2 },
    output: { itemId: 'HEALING_SYRINGE_2', quantity: 1 },
    requiredAlchemyLevel: 3,
  },
  {
    id: 'healing-syringe-3',
    name: 'Healing Syringe III',
    ingredients: { SLIME_GEL: 3 },
    output: { itemId: 'HEALING_SYRINGE_3', quantity: 1 },
    requiredAlchemyLevel: 5,
  },
];

/**
 * Returns the first recipe whose ingredients exactly match the filled slots
 * (same item ids AND same counts) and whose level requirement is met.
 * Aggregate slots into a count map so 2× SLIME_GEL and 1× SLIME_GEL produce
 * distinct matches instead of both collapsing to the HS1 recipe.
 */
export function matchRecipe(
  slots: (ItemID | null)[],
  alchemyLevel: number
): AlchemyRecipe | null {
  const filled = slots.filter((s): s is ItemID => s !== null);
  if (filled.length === 0) return null;

  // Aggregate slot contents into a count map
  const slotCounts = new Map<ItemID, number>();
  for (const id of filled) {
    slotCounts.set(id, (slotCounts.get(id) ?? 0) + 1);
  }

  for (const recipe of ALCHEMY_RECIPES) {
    if (recipe.requiredAlchemyLevel > alchemyLevel) continue;
    const required = Object.entries(recipe.ingredients) as [ItemID, number][];
    // Exact match: same key count and same quantities
    if (required.length !== slotCounts.size) continue;
    const allMatch = required.every(([id, qty]) => slotCounts.get(id) === qty);
    if (allMatch) return recipe;
  }
  return null;
}
