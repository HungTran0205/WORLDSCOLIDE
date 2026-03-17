/** Furniture definitions — 5 core + 3 upgrade items (no decorative in this version) */

import type { FurnitureType, FurnitureCategory, RoomType } from '@/game/state/game-state';
import type { ResourceCost } from './buildings';

export interface FurnitureDefinition {
  type: FurnitureType;
  name: string;
  description: string;
  category: FurnitureCategory;
  cost: ResourceCost;
  /** Core furniture only: upgrade costs by target level (index 0 = level 1->2) */
  upgradeCosts?: ResourceCost[];
  /** Width in cells */
  width: number;
  /** Depth in cells */
  depth: number;
  /** Which room types this furniture can be placed in */
  allowedRooms: RoomType[] | 'any';
  effect?: string;
  maxPerRoom?: number;
}

export const FURNITURE_DEFINITIONS: FurnitureDefinition[] = [
  // === Core furniture (1 per room, auto-placed, upgradeable) ===
  {
    type: 'quest-board', name: 'Quest Board', description: 'Displays available quests',
    category: 'core', cost: { gold: 0 }, width: 1, depth: 1,
    allowedRooms: ['guild-hall'], effect: 'mission-access', maxPerRoom: 1,
    upgradeCosts: [
      { gold: 500 },
      { gold: 2000, items: { WOOD: 10 } },
      { gold: 8000, items: { WOOD: 20, IRON_ORE: 10 } },
      { gold: 30000, items: { WOOD: 40, IRON_ORE: 20 } },
    ],
  },
  {
    type: 'bar-counter', name: 'Bar Counter', description: 'Serves drinks to reduce upkeep',
    category: 'core', cost: { gold: 0 }, width: 2, depth: 1,
    allowedRooms: ['tavern'], effect: 'upkeep-reduction', maxPerRoom: 1,
    upgradeCosts: [
      { gold: 300 },
      { gold: 1500, items: { WOOD: 8 } },
      { gold: 6000, items: { WOOD: 15, IRON_ORE: 5 } },
    ],
  },
  {
    type: 'alchemy-table', name: 'Alchemy Table', description: 'Brews healing potions',
    category: 'core', cost: { gold: 0 }, width: 2, depth: 1,
    allowedRooms: ['infirmary'], effect: 'recovery-reduction', maxPerRoom: 1,
    upgradeCosts: [
      { gold: 400 },
      { gold: 2000, items: { STONE: 10 } },
      { gold: 8000, items: { STONE: 20, IRON_ORE: 10 } },
    ],
  },
  {
    type: 'workbench', name: 'Workbench', description: 'Crafting station (future)',
    category: 'core', cost: { gold: 0 }, width: 2, depth: 1,
    allowedRooms: ['workshop'], effect: 'crafting', maxPerRoom: 1,
    upgradeCosts: [
      { gold: 500, items: { IRON_ORE: 5 } },
      { gold: 2500, items: { IRON_ORE: 15 } },
    ],
  },
  {
    type: 'training-dummy', name: 'Training Dummy', description: 'Provides passive EXP',
    category: 'core', cost: { gold: 0 }, width: 1, depth: 1,
    allowedRooms: ['training-room'], effect: 'passive-exp', maxPerRoom: 1,
    upgradeCosts: [
      { gold: 300, items: { WOOD: 5 } },
      { gold: 1500, items: { WOOD: 10, IRON_ORE: 5 } },
      { gold: 6000, items: { WOOD: 20, IRON_ORE: 10 } },
    ],
  },

  // === Upgrade furniture (purchasable, room-specific) ===
  {
    type: 'reception-desk', name: 'Reception Desk', description: '+1 visitor bonus',
    category: 'upgrade', cost: { gold: 100 }, width: 2, depth: 1,
    allowedRooms: ['guild-hall'], effect: 'visitor-bonus', maxPerRoom: 1,
  },
  {
    type: 'wine-barrel', name: 'Wine Barrel', description: '2% additional upkeep reduction',
    category: 'upgrade', cost: { gold: 80 }, width: 1, depth: 1,
    allowedRooms: ['tavern'], effect: 'upkeep-reduction-bonus', maxPerRoom: 3,
  },
  {
    type: 'medical-bed', name: 'Medical Bed', description: '+0.5 recovery reduction',
    category: 'upgrade', cost: { gold: 120, items: { WOOD: 5 } }, width: 1, depth: 2,
    allowedRooms: ['infirmary'], effect: 'recovery-bonus', maxPerRoom: 2,
  },
];

/** Get furniture definition by type */
export function getFurnitureDefinition(type: FurnitureType): FurnitureDefinition | undefined {
  return FURNITURE_DEFINITIONS.find((f) => f.type === type);
}

/** Get the core furniture type for a given room type */
export function getCoreFurnitureType(roomType: RoomType): FurnitureType | undefined {
  return FURNITURE_DEFINITIONS.find(
    (f) => f.category === 'core' && f.allowedRooms !== 'any' && f.allowedRooms.includes(roomType),
  )?.type;
}
