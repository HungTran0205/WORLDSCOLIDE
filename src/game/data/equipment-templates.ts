/** Static equipment template registry — read-only gear definitions. */

import type { ItemID, ItemRarity } from './items';

export type EquipmentSlot = 'weapon' | 'armor';

export type EquipmentTemplateId =
  // Weapons — by material tier
  | 'WOODEN_AXE'
  | 'WOODEN_CROSSBOW'
  | 'WOODEN_SWORD'
  | 'STONE_AXE'
  | 'STONE_CROSSBOW'
  | 'STONE_SWORD'
  | 'IRON_AXE'
  | 'IRON_CROSSBOW'
  | 'IRON_SWORD'
  // Armor — by pelt tier (T1=BOAR_PELT, T2=BEAR_PELT, T3=IRON_ORE)
  | 'BOAR_FUR_COAT'
  | 'BEAR_COAT'
  | 'IRON_ARMOR';

export interface EquipmentTemplate {
  id: EquipmentTemplateId;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  /** Flat damage bonus (weapons only) */
  damage?: number;
  /** Flat HP bonus (armor) */
  hp?: number;
  /** Flat defense bonus — adds to END for defense calc */
  defense?: number;
  maxDurability: number;
  /** Primary material used to craft — drives tier inference */
  craftMaterial?: ItemID;
  craftCost?: number;
  /**
   * Secondary materials consumed on craft in addition to craftMaterial×craftCost.
   * Not recovered on dismantle (KISS — only the primary pelt is returned).
   */
  extraMaterials?: Partial<Record<ItemID, number>>;
}

export const EQUIPMENT_DATABASE: Record<EquipmentTemplateId, EquipmentTemplate> = {
  // --- Weapons ---
  WOODEN_AXE:      { id: 'WOODEN_AXE',      name: 'Wooden Axe',      slot: 'weapon',   rarity: 'COMMON',   damage: 10, maxDurability: 50,  craftMaterial: 'WOOD',     craftCost: 20 },
  WOODEN_CROSSBOW: { id: 'WOODEN_CROSSBOW', name: 'Wooden Crossbow', slot: 'weapon',   rarity: 'COMMON',   damage: 10, maxDurability: 50,  craftMaterial: 'WOOD',     craftCost: 20 },
  WOODEN_SWORD:    { id: 'WOODEN_SWORD',    name: 'Wooden Sword',    slot: 'weapon',   rarity: 'COMMON',   damage: 10, maxDurability: 50,  craftMaterial: 'WOOD',     craftCost: 20 },
  STONE_AXE:       { id: 'STONE_AXE',       name: 'Stone Axe',       slot: 'weapon',   rarity: 'UNCOMMON', damage: 18, maxDurability: 80,  craftMaterial: 'STONE',    craftCost: 15 },
  STONE_CROSSBOW:  { id: 'STONE_CROSSBOW',  name: 'Stone Crossbow',  slot: 'weapon',   rarity: 'UNCOMMON', damage: 18, maxDurability: 80,  craftMaterial: 'STONE',    craftCost: 15 },
  STONE_SWORD:     { id: 'STONE_SWORD',     name: 'Stone Sword',     slot: 'weapon',   rarity: 'UNCOMMON', damage: 18, maxDurability: 80,  craftMaterial: 'STONE',    craftCost: 15 },
  IRON_AXE:        { id: 'IRON_AXE',        name: 'Iron Axe',        slot: 'weapon',   rarity: 'RARE',     damage: 30, maxDurability: 120, craftMaterial: 'IRON_ORE', craftCost: 10 },
  IRON_CROSSBOW:   { id: 'IRON_CROSSBOW',   name: 'Iron Crossbow',   slot: 'weapon',   rarity: 'RARE',     damage: 28, maxDurability: 100, craftMaterial: 'IRON_ORE', craftCost: 10 },
  IRON_SWORD:      { id: 'IRON_SWORD',      name: 'Iron Sword',      slot: 'weapon',   rarity: 'RARE',     damage: 30, maxDurability: 120, craftMaterial: 'IRON_ORE', craftCost: 10 },
  // --- Armor (pelt-primary: craftMaterial drives tier; WOOD/STONE are secondary) ---
  BOAR_FUR_COAT: { id: 'BOAR_FUR_COAT', name: 'Boar Fur Coat', slot: 'armor', rarity: 'COMMON',   hp: 20, defense: 3,  maxDurability: 40,  craftMaterial: 'BOAR_PELT', craftCost: 1, extraMaterials: { WOOD: 10 } },
  BEAR_COAT:     { id: 'BEAR_COAT',     name: 'Bear Coat',     slot: 'armor', rarity: 'UNCOMMON', hp: 40, defense: 7,  maxDurability: 70,  craftMaterial: 'BEAR_PELT', craftCost: 1, extraMaterials: { STONE: 10 } },
  IRON_ARMOR:    { id: 'IRON_ARMOR',    name: 'Iron Armor',    slot: 'armor', rarity: 'RARE',     hp: 70, defense: 15, maxDurability: 120, craftMaterial: 'IRON_ORE',  craftCost: 8 },
};

export function getEquipmentTemplate(id: EquipmentTemplateId): EquipmentTemplate {
  return EQUIPMENT_DATABASE[id];
}
