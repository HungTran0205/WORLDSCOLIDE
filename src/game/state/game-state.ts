/** Core type definitions for game state — all interfaces must be JSON-serializable */

import type { ItemID } from '@/game/data/items';

export type StatKey = 'STR' | 'END' | 'INT' | 'DEX' | 'CHA' | 'LCK' | 'AGI';

export interface Stats {
  STR: number;
  END: number;
  INT: number;
  DEX: number;
  CHA: number;
  LCK: number;
  AGI: number;
}

export interface Skill {
  id: string;
  name: string;
  damageMultiplier: number;
  cooldownMs: number;
  autoEnabled: boolean;
}

export type MemberStatus = 'idle' | 'on-mission' | 'injured' | 'training';

/** Guild hierarchy ranks (promotable). MERCENARY is orthogonal — not in hierarchy. */
export type GuildRank = 'RECRUIT' | 'MEMBER' | 'VETERAN' | 'OFFICER' | 'COMMANDER';
export type MemberRank = GuildRank | 'MERCENARY';

export interface Member {
  id: string;
  name: string;
  level: number;
  exp: number;
  stats: Stats;
  unallocatedPoints: number;
  skill: Skill | null;
  status: MemberStatus;
  injuredUntil: number | null;
  civilization: string;
  isFounder: boolean;
  rank: MemberRank;
  missionsCompleted: number;
}

export interface TavernState {
  lastRefreshTime: number; // Unix ms timestamp
  availableMercenaries: Member[];
}

export type QuestTier = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

/** Phase of an active mission in the state machine */
export type MissionPhase = 'traveling' | 'arrived' | 'in-combat' | 'completed' | 'failed';

export interface Mission {
  id: string;
  name: string;
  tier: QuestTier;
  description?: string;
  zone?: string;
  durationMs: number;
  travelTimeMs: number;
  goldRewardMin: number;
  goldRewardMax: number;
  expReward: number;
  enemyIds: string[];
  requiredMembers: number;
  requiredLevel: number;
  chainId?: string;
  chainOrder?: number;
  prerequisiteId?: string;
  isBossGate?: boolean;
}

export interface ActiveMission {
  missionId: string;
  memberIds: string[];
  startTime: number;
  estimatedEndTime: number;
  phase: MissionPhase;
  arrivalTime: number | null;
  combatMode: 'auto' | 'manual' | null;
}

export type RoomType = 'guild-hall' | 'tavern' | 'workshop' | 'training-room' | 'infirmary';

export type Rotation = 0 | 90 | 180 | 270;

export interface GridCell {
  x: number;
  z: number;
}

export type FurnitureCategory = 'core' | 'upgrade';

export type FurnitureType =
  // Core (1 per room, upgradeable -> room level)
  | 'quest-board'      // guild-hall core
  | 'bar-counter'      // tavern core
  | 'alchemy-table'    // infirmary core
  | 'workbench'        // workshop core
  | 'training-dummy'   // training-room core
  // Upgrade (purchasable, room-specific)
  | 'reception-desk'   // guild-hall upgrade
  | 'wine-barrel'      // tavern upgrade
  | 'medical-bed';     // infirmary upgrade

export interface PlacedFurniture {
  id: string;
  type: FurnitureType;
  level: number;
  position: GridCell;
  rotation: Rotation;
}

export interface Room {
  id: string;
  type: RoomType;
  level: number;
  cells: GridCell[];
  furniture: PlacedFurniture[];
}

export interface GuildHall {
  level: number;
  rooms: Room[];
  maxRooms: number;
}

export type TutorialStep =
  | 'char-creation'
  | 'sandbox-intro'
  | 'first-build'
  | 'first-quest'
  | 'first-combat'
  | 'first-recruit'
  | 'complete';

export interface InventoryState {
  items: Partial<Record<ItemID, number>>;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  autoSkillDefault: boolean;
}
