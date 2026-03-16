import type { RoomType, QuestTier } from '@/game/state/game-state';
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
  /** Grid width (x-axis cells) */
  width: number;
  /** Grid depth (z-axis cells) */
  depth: number;
}

/** Maps quest-board room level → maximum unlockable quest tier */
export const QUEST_BOARD_TIER_BY_LEVEL: Record<number, QuestTier> = {
  1: 'F',
  2: 'E',
  3: 'D',
  4: 'C',
  5: 'B',
};

export const ROOM_DEFINITIONS: RoomDefinition[] = [
  { type: 'quest-board', name: 'Quest Board', description: 'Enables missions', cost: { gold: 0 }, effect: 'mission-access', width: 1, depth: 1 },
  { type: 'tavern', name: 'Tavern', description: 'Reduces upkeep by 5% per level', cost: { gold: 200 }, effect: 'upkeep-reduction', width: 2, depth: 2 },
  { type: 'training-room', name: 'Training Room', description: 'Passive EXP gain for idle members', cost: { gold: 200, items: { WOOD: 10 } }, effect: 'passive-exp', width: 2, depth: 1 },
  { type: 'workshop', name: 'Workshop', description: 'Enables crafting (future)', cost: { gold: 300, items: { WOOD: 5, IRON_ORE: 5 } }, effect: 'crafting', width: 1, depth: 1 },
  { type: 'infirmary', name: 'Infirmary', description: 'Reduces injury recovery time', cost: { gold: 250, items: { STONE: 8 } }, effect: 'recovery-reduction', width: 2, depth: 1 },
];
