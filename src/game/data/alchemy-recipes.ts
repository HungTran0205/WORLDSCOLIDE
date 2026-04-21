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
];

/**
 * Returns the first recipe that matches the filled ingredient slots,
 * or null if no recipe matches.
 */
export function matchRecipe(
  slots: (ItemID | null)[],
  alchemyLevel: number
): AlchemyRecipe | null {
  const filled = slots.filter((s): s is ItemID => s !== null);
  if (filled.length === 0) return null;

  for (const recipe of ALCHEMY_RECIPES) {
    if (recipe.requiredAlchemyLevel > alchemyLevel) continue;
    const required = Object.entries(recipe.ingredients) as [ItemID, number][];
    if (required.length !== filled.length) continue;
    const allMatch = required.every(([id]) => filled.includes(id));
    if (allMatch) return recipe;
  }
  return null;
}
