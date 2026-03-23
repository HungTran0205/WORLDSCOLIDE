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
  archetype?: string;   // CivArchetype — maps to sprite folder (missing in old saves)
  gender?: 'M' | 'F';  // maps to sprite folder suffix (missing in old saves)
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

export type Rotation = 0 | 90 | 180 | 270;

export interface GridCell {
  x: number;
  z: number;
}

export type FurnitureCategory = 'core' | 'upgrade';

export type FurnitureType =
  // Core (1 per guild, upgradeable)
  | 'quest-board'
  | 'bar-counter'
  | 'alchemy-table'
  | 'workbench'
  | 'training-dummy'
  // Upgrade (purchasable, placeable multiple times)
  | 'reception-desk'
  | 'wine-barrel'
  | 'medical-bed';

export interface PlacedFurniture {
  id: string;
  type: FurnitureType;
  level: number;
  position: GridCell;
  rotation: Rotation;
}

/** Preset floor tile colors for the build palette */
export const FLOOR_TILE_COLORS = [
  { id: 'gold', name: 'Gold', hex: '#DAA520' },
  { id: 'wood-brown', name: 'Wood', hex: '#8B4513' },
  { id: 'steel-blue', name: 'Steel', hex: '#4682B4' },
  { id: 'slate', name: 'Slate', hex: '#708090' },
  { id: 'stone', name: 'Stone', hex: '#A0A0A0' },
  { id: 'crimson', name: 'Crimson', hex: '#FF6347' },
  { id: 'forest', name: 'Forest', hex: '#2E8B57' },
  { id: 'ivory', name: 'Ivory', hex: '#FFFFF0' },
  { id: 'obsidian', name: 'Obsidian', hex: '#1C1C1C' },
  { id: 'royal-blue', name: 'Royal', hex: '#4169E1' },
] as const;

export type FloorTileColorId = typeof FLOOR_TILE_COLORS[number]['id'];

export interface FloorTile {
  x: number;
  z: number;
  color: string;
}

export interface GuildHall {
  level: number;
  floorTiles: FloorTile[];
  furniture: PlacedFurniture[];
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
