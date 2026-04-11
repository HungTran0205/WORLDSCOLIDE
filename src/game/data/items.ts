/** Static item database — master data for all game items (read-only definitions). */

export type ItemID =
  | 'WOOD' | 'STONE' | 'IRON_ORE'
  | 'SLIME_GEL' | 'BOAR_PELT' | 'WOLF_FANG'
  | 'GOBLIN_EAR' | 'ORC_TUSK'
  | 'LOGGING_SITE_ACCESS';

export type ItemType = 'MATERIAL' | 'CONSUMABLE' | 'EQUIPMENT' | 'CURRENCY';
export type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface ItemTemplate {
  id: ItemID;
  name: string;
  type: ItemType;
  description: string;
  rarity: ItemRarity;
  /** Sell value in gold */
  basePrice: number;
}

export const ITEM_DATABASE: Record<ItemID, ItemTemplate> = {
  WOOD:       { id: 'WOOD',       name: 'Oak Wood',    type: 'MATERIAL', rarity: 'COMMON',   basePrice: 2,  description: 'Lumber for building.' },
  STONE:      { id: 'STONE',      name: 'Rough Stone', type: 'MATERIAL', rarity: 'COMMON',   basePrice: 3,  description: 'Solid rock for foundations.' },
  IRON_ORE:   { id: 'IRON_ORE',   name: 'Iron Ore',    type: 'MATERIAL', rarity: 'UNCOMMON', basePrice: 8,  description: 'Raw ore for smelting.' },
  SLIME_GEL:  { id: 'SLIME_GEL',  name: 'Slime Gel',   type: 'MATERIAL', rarity: 'COMMON',   basePrice: 5,  description: 'Sticky and flammable.' },
  BOAR_PELT:  { id: 'BOAR_PELT',  name: 'Boar Pelt',   type: 'MATERIAL', rarity: 'COMMON',   basePrice: 4,  description: 'Tough hide from forest boars.' },
  WOLF_FANG:  { id: 'WOLF_FANG',  name: 'Wolf Fang',   type: 'MATERIAL', rarity: 'UNCOMMON', basePrice: 10, description: 'Sharp canine tooth.' },
  GOBLIN_EAR: { id: 'GOBLIN_EAR', name: 'Goblin Ear',  type: 'MATERIAL', rarity: 'COMMON',   basePrice: 3,  description: 'Proof of goblin subjugation.' },
  ORC_TUSK:            { id: 'ORC_TUSK',            name: 'Orc Tusk',            type: 'MATERIAL',   rarity: 'UNCOMMON', basePrice: 15, description: 'Massive ivory tusk.' },
  LOGGING_SITE_ACCESS: { id: 'LOGGING_SITE_ACCESS', name: 'Logging Permit', type: 'CONSUMABLE', rarity: 'UNCOMMON', basePrice: 0,  description: "Authorization from the Forest Warden to establish a logging site. Consumed on build." },
};

/** O(1) lookup of item template by ID */
export function getItemInfo(id: ItemID): ItemTemplate {
  return ITEM_DATABASE[id];
}
