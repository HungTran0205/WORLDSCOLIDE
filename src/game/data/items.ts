/** Static item database — master data for all game items (read-only definitions). */

export type ItemID =
  | 'WOOD' | 'STONE' | 'IRON_ORE' | 'GEM'
  | 'SLIME_GEL' | 'BOAR_PELT' | 'WOLF_FANG'
  | 'GOBLIN_EAR' | 'ORC_TUSK'
  | 'LOGGING_SITE_ACCESS'
  | 'HEALING_SYRINGE' | 'HEALING_SYRINGE_2' | 'HEALING_SYRINGE_3';

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
  /** Whether this item stacks in inventory (max STACK_LIMIT per slot) */
  stackable: boolean;
}

/** Max quantity per inventory slot for stackable items */
export const STACK_LIMIT = 99;

export const ITEM_DATABASE: Record<ItemID, ItemTemplate> = {
  WOOD:       { id: 'WOOD',       name: 'Oak Wood',    type: 'MATERIAL', rarity: 'COMMON',   basePrice: 2,  description: 'Lumber for building.',       stackable: true },
  STONE:      { id: 'STONE',      name: 'Rough Stone', type: 'MATERIAL', rarity: 'COMMON',   basePrice: 3,  description: 'Solid rock for foundations.', stackable: true },
  IRON_ORE:   { id: 'IRON_ORE',   name: 'Iron Ore',    type: 'MATERIAL', rarity: 'UNCOMMON', basePrice: 8,  description: 'Raw ore for smelting.',       stackable: true },
  SLIME_GEL:  { id: 'SLIME_GEL',  name: 'Slime Gel',   type: 'MATERIAL', rarity: 'COMMON',   basePrice: 5,  description: 'Sticky and flammable.',      stackable: true },
  BOAR_PELT:  { id: 'BOAR_PELT',  name: 'Boar Pelt',   type: 'MATERIAL', rarity: 'COMMON',   basePrice: 4,  description: 'Tough hide from forest boars.', stackable: true },
  WOLF_FANG:  { id: 'WOLF_FANG',  name: 'Wolf Fang',   type: 'MATERIAL', rarity: 'UNCOMMON', basePrice: 10, description: 'Sharp canine tooth.',         stackable: true },
  GOBLIN_EAR: { id: 'GOBLIN_EAR', name: 'Goblin Ear',  type: 'MATERIAL', rarity: 'COMMON',   basePrice: 3,  description: 'Proof of goblin subjugation.', stackable: true },
  ORC_TUSK:            { id: 'ORC_TUSK',            name: 'Orc Tusk',       type: 'MATERIAL',   rarity: 'UNCOMMON', basePrice: 15, description: 'Massive ivory tusk.',   stackable: true },
  GEM:                 { id: 'GEM',                 name: 'Gemstone',       type: 'MATERIAL',   rarity: 'RARE',     basePrice: 50, description: 'A rough gemstone found deep in the quarry.', stackable: true },
  LOGGING_SITE_ACCESS: { id: 'LOGGING_SITE_ACCESS', name: 'Logging Permit', type: 'CONSUMABLE', rarity: 'UNCOMMON', basePrice: 0,  description: "Authorization from the Forest Warden to establish a logging site. Consumed on build.", stackable: true },
  HEALING_SYRINGE:   { id: 'HEALING_SYRINGE',   name: 'Healing Syringe',      type: 'CONSUMABLE', rarity: 'COMMON',   basePrice: 12, description: 'Alchemical syringe that restores 30% max HP. Auto-uses when HP drops below a set threshold.', stackable: true },
  HEALING_SYRINGE_2: { id: 'HEALING_SYRINGE_2', name: 'Healing Syringe II',   type: 'CONSUMABLE', rarity: 'UNCOMMON', basePrice: 30, description: 'Enhanced syringe that restores 50% max HP. Auto-uses when HP drops below a set threshold.', stackable: true },
  HEALING_SYRINGE_3: { id: 'HEALING_SYRINGE_3', name: 'Healing Syringe III',  type: 'CONSUMABLE', rarity: 'RARE',     basePrice: 80, description: 'Masterwork syringe that restores 80% max HP. Auto-uses when HP drops below a set threshold.', stackable: true },
};

/** O(1) lookup of item template by ID */
export function getItemInfo(id: ItemID): ItemTemplate {
  return ITEM_DATABASE[id];
}
