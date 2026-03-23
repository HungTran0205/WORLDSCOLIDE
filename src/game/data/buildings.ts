import type { QuestTier, FurnitureType } from '@/game/state/game-state';
import type { ItemID } from '@/game/data/items';

export interface GuildUpgrade {
  level: number;
  cost: number;
  unlockedFurniture: FurnitureType[];
  unlockedFeatures: string[];
}

export const GUILD_UPGRADES: GuildUpgrade[] = [
  { level: 1, cost: 0, unlockedFurniture: ['quest-board'], unlockedFeatures: ['quest-board-f'] },
  { level: 2, cost: 500, unlockedFurniture: ['bar-counter', 'wine-barrel', 'reception-desk'], unlockedFeatures: ['e-rank-quests'] },
  { level: 3, cost: 2000, unlockedFurniture: ['training-dummy', 'alchemy-table', 'medical-bed'], unlockedFeatures: ['d-rank-quests'] },
  { level: 4, cost: 8000, unlockedFurniture: ['workbench'], unlockedFeatures: ['c-rank-quests'] },
  { level: 5, cost: 30000, unlockedFurniture: [], unlockedFeatures: ['b-rank-quests'] },
];

export interface ResourceCost {
  gold: number;
  items?: Partial<Record<ItemID, number>>;
}

/** Maps quest-board furniture level -> maximum unlockable quest tier */
export const QUEST_BOARD_TIER_BY_LEVEL: Record<number, QuestTier> = {
  1: 'F',
  2: 'E',
  3: 'D',
  4: 'C',
  5: 'B',
};

/** Get all furniture types unlocked at or below given guild level */
export function getUnlockedFurniture(guildLevel: number): FurnitureType[] {
  return GUILD_UPGRADES
    .filter((u) => u.level <= guildLevel)
    .flatMap((u) => u.unlockedFurniture);
}

/** Gold cost per floor tile */
export const FLOOR_TILE_COST = 5;
