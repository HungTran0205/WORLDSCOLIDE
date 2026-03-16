/** Core type definitions for game state — all interfaces must be JSON-serializable */

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

export type MemberRank = 'MEMBER' | 'MERCENARY';

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

export type RoomType = 'quest-board' | 'tavern' | 'workshop' | 'training-room' | 'infirmary';

export type Rotation = 0 | 90 | 180 | 270;

export interface Room {
  id: string;
  type: RoomType;
  level: number;
  position: { x: number; z: number };
  rotation: Rotation;
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

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  autoSkillDefault: boolean;
}
