import type { RoomType } from '@/game/state/game-state';

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

export interface RoomDefinition {
  type: RoomType;
  name: string;
  description: string;
  baseCost: number;
  effect: string;
  /** Grid width (x-axis cells) */
  width: number;
  /** Grid depth (z-axis cells) */
  depth: number;
}

export const ROOM_DEFINITIONS: RoomDefinition[] = [
  { type: 'quest-board', name: 'Quest Board', description: 'Enables missions', baseCost: 0, effect: 'mission-access', width: 1, depth: 1 },
  { type: 'tavern', name: 'Tavern', description: 'Reduces upkeep by 5% per level', baseCost: 200, effect: 'upkeep-reduction', width: 2, depth: 2 },
  { type: 'training-room', name: 'Training Room', description: 'Passive EXP gain for idle members', baseCost: 300, effect: 'passive-exp', width: 2, depth: 1 },
  { type: 'workshop', name: 'Workshop', description: 'Enables crafting (future)', baseCost: 400, effect: 'crafting', width: 1, depth: 1 },
  { type: 'infirmary', name: 'Infirmary', description: 'Reduces injury recovery time', baseCost: 350, effect: 'recovery-reduction', width: 2, depth: 1 },
];
