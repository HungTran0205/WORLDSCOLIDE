/** Static equipment template registry — read-only gear definitions. */

import type { ItemID, ItemRarity } from './items';

export type EquipmentSlot = 'weapon' | 'armor' | 'headgear';

export type EquipmentTemplateId =
  // Weapons — by material tier
  | 'WOODEN_AXE'
  | 'WOODEN_CROSSBOW'
  | 'WOODEN_SWORD'
  | 'STONE_SWORD'
  | 'IRON_SWORD'
  | 'IRON_SPEAR'
  // Armor — by material tier
  | 'CLOTH_VEST'
  | 'LEATHER_ARMOR'
  | 'IRON_ARMOR'
  // Headgear — by material tier
  | 'CLOTH_HOOD'
  | 'LEATHER_HELMET'
  | 'IRON_HELMET';

export interface EquipmentTemplate {
  id: EquipmentTemplateId;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  /** Flat damage bonus (weapons only) */
  damage?: number;
  /** Flat HP bonus (armor/headgear) */
  hp?: number;
  /** Flat defense bonus — adds to END for defense calc */
  defense?: number;
  maxDurability: number;
  /** Material used to craft (for Phase 2 workshop) */
  craftMaterial?: ItemID;
  craftCost?: number;
}

export const EQUIPMENT_DATABASE: Record<EquipmentTemplateId, EquipmentTemplate> = {
  // --- Weapons ---
  WOODEN_AXE:      { id: 'WOODEN_AXE',      name: 'Wooden Axe',      slot: 'weapon',   rarity: 'COMMON',   damage: 10, maxDurability: 50,  craftMaterial: 'WOOD',     craftCost: 20 },
  WOODEN_CROSSBOW: { id: 'WOODEN_CROSSBOW', name: 'Wooden Crossbow', slot: 'weapon',   rarity: 'COMMON',   damage: 10, maxDurability: 50,  craftMaterial: 'WOOD',     craftCost: 20 },
  WOODEN_SWORD:    { id: 'WOODEN_SWORD',    name: 'Wooden Sword',    slot: 'weapon',   rarity: 'COMMON',   damage: 10, maxDurability: 50,  craftMaterial: 'WOOD',     craftCost: 20 },
  STONE_SWORD:     { id: 'STONE_SWORD',     name: 'Stone Sword',     slot: 'weapon',   rarity: 'UNCOMMON', damage: 18, maxDurability: 80,  craftMaterial: 'STONE',    craftCost: 15 },
  IRON_SWORD:      { id: 'IRON_SWORD',      name: 'Iron Sword',      slot: 'weapon',   rarity: 'RARE',     damage: 30, maxDurability: 120, craftMaterial: 'IRON_ORE', craftCost: 10 },
  IRON_SPEAR:      { id: 'IRON_SPEAR',      name: 'Iron Spear',      slot: 'weapon',   rarity: 'RARE',     damage: 28, maxDurability: 100, craftMaterial: 'IRON_ORE', craftCost: 10 },
  // --- Armor ---
  CLOTH_VEST:      { id: 'CLOTH_VEST',      name: 'Cloth Vest',      slot: 'armor',    rarity: 'COMMON',   hp: 20, defense: 3,  maxDurability: 40,  craftMaterial: 'WOOD',     craftCost: 10 },
  LEATHER_ARMOR:   { id: 'LEATHER_ARMOR',   name: 'Leather Armor',   slot: 'armor',    rarity: 'UNCOMMON', hp: 40, defense: 7,  maxDurability: 70,  craftMaterial: 'STONE',    craftCost: 10 },
  IRON_ARMOR:      { id: 'IRON_ARMOR',      name: 'Iron Armor',      slot: 'armor',    rarity: 'RARE',     hp: 70, defense: 15, maxDurability: 120, craftMaterial: 'IRON_ORE', craftCost: 8  },
  // --- Headgear ---
  CLOTH_HOOD:      { id: 'CLOTH_HOOD',      name: 'Cloth Hood',      slot: 'headgear', rarity: 'COMMON',   hp: 10, defense: 1,  maxDurability: 40,  craftMaterial: 'WOOD',     craftCost: 8  },
  LEATHER_HELMET:  { id: 'LEATHER_HELMET',  name: 'Leather Helmet',  slot: 'headgear', rarity: 'UNCOMMON', hp: 20, defense: 4,  maxDurability: 70,  craftMaterial: 'STONE',    craftCost: 8  },
  IRON_HELMET:     { id: 'IRON_HELMET',     name: 'Iron Helmet',     slot: 'headgear', rarity: 'RARE',     hp: 35, defense: 10, maxDurability: 120, craftMaterial: 'IRON_ORE', craftCost: 6  },
};

export function getEquipmentTemplate(id: EquipmentTemplateId): EquipmentTemplate {
  return EQUIPMENT_DATABASE[id];
}
