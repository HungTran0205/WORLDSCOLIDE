import type { RoomType, QuestTier, FurnitureType } from '@/game/state/game-state';
import type { ItemID } from '@/game/data/items';

export interface GuildUpgrade {
  level: number;
  cost: number;
  maxRooms: number;
  unlockedFeatures: string[];
}

export const GUILD_UPGRADES: GuildUpgrade[] = [
  { level: 1, cost: 0, maxRooms: 1, unlockedFeatures: ['quest-board-f'] },
  { level: 2, cost: 500, maxRooms: 2, unlockedFeatures: ['e-rank-quests'] },
  { level: 3, cost: 2000, maxRooms: 3, unlockedFeatures: ['d-rank-quests'] },
  { level: 4, cost: 8000, maxRooms: 4, unlockedFeatures: ['c-rank-quests'] },
  { level: 5, cost: 30000, maxRooms: 5, unlockedFeatures: ['b-rank-quests'] },
];

export interface ResourceCost {
  gold: number;
  items?: Partial<Record<ItemID, number>>;
}

export interface RoomDefinition {
  type: RoomType;
  name: string;
  description: string;
  cost: ResourceCost;
  effect: string;
  /** Default room width in cells (fixed 6x6 in v1) */
  defaultWidth: number;
  /** Default room depth in cells (fixed 6x6 in v1) */
  defaultDepth: number;
  /** Core furniture auto-placed when room is created */
  coreFurniture: FurnitureType;
  /** Floor tile color for 3D rendering */
  floorColor: string;
}

/** Maps quest-board furniture level -> maximum unlockable quest tier */
export const QUEST_BOARD_TIER_BY_LEVEL: Record<number, QuestTier> = {
  1: 'F',
  2: 'E',
  3: 'D',
  4: 'C',
  5: 'B',
};

export const ROOM_DEFINITIONS: RoomDefinition[] = [
  { type: 'guild-hall', name: 'Guild Hall', description: 'Central hub with quest board', cost: { gold: 0 }, effect: 'mission-access', defaultWidth: 6, defaultDepth: 6, coreFurniture: 'quest-board', floorColor: '#DAA520' },
  { type: 'tavern', name: 'Tavern', description: 'Reduces upkeep by 5% per level', cost: { gold: 200 }, effect: 'upkeep-reduction', defaultWidth: 6, defaultDepth: 6, coreFurniture: 'bar-counter', floorColor: '#8B4513' },
  { type: 'training-room', name: 'Training Room', description: 'Passive EXP gain for idle members', cost: { gold: 200, items: { WOOD: 10 } }, effect: 'passive-exp', defaultWidth: 6, defaultDepth: 6, coreFurniture: 'training-dummy', floorColor: '#4682B4' },
  { type: 'workshop', name: 'Workshop', description: 'Enables crafting (future)', cost: { gold: 300, items: { WOOD: 5, IRON_ORE: 5 } }, effect: 'crafting', defaultWidth: 6, defaultDepth: 6, coreFurniture: 'workbench', floorColor: '#708090' },
  { type: 'infirmary', name: 'Infirmary', description: 'Reduces injury recovery time', cost: { gold: 250, items: { STONE: 8 } }, effect: 'recovery-reduction', defaultWidth: 6, defaultDepth: 6, coreFurniture: 'alchemy-table', floorColor: '#FF6347' },
];
