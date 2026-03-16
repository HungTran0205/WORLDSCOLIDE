/**
 * Shared test fixtures for save system unit tests.
 * All fixtures match current game-state.ts types.
 */

import type { Member, GuildHall, GameSettings, ActiveMission } from '@/game/state/game-state';
import type { SaveEnvelope, GameSaveData, SaveSlotMetadata } from './save-types';

export const VALID_MEMBER: Member = {
  id: 'founder-001',
  name: 'TestFounder',
  level: 3,
  exp: 50,
  stats: { STR: 10, END: 8, INT: 7, DEX: 9, CHA: 5, LCK: 6, AGI: 5 },
  unallocatedPoints: 0,
  skill: null,
  status: 'idle',
  injuredUntil: null,
  civilization: 'human',
  isFounder: true,
  rank: 'MEMBER',
};

export const VALID_ROSTER_MEMBER: Member = {
  id: 'member-002',
  name: 'Recruit',
  level: 1,
  exp: 0,
  stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
  unallocatedPoints: 0,
  skill: null,
  status: 'idle',
  injuredUntil: null,
  civilization: 'elf',
  isFounder: false,
  rank: 'MEMBER',
};

export const VALID_GUILD_HALL: GuildHall = {
  level: 1,
  rooms: [{ id: 'room-quest-board', type: 'quest-board', level: 1, position: { x: 0, z: 0 }, rotation: 0 }],
  maxRooms: 3,
};

export const VALID_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  autoSkillDefault: true,
};

export const VALID_ACTIVE_MISSION: ActiveMission = {
  missionId: 'mission-f-01',
  memberIds: ['founder-001'],
  startTime: 1000,
  estimatedEndTime: 61000,
  phase: 'traveling',
  arrivalTime: null,
  combatMode: null,
};

export const VALID_GAME_SAVE_DATA: GameSaveData = {
  gameTime: 360000,
  realTimeLastTick: Date.now(),
  guildName: 'Test Guild',
  guildLevel: 1,
  gold: 100,
  guildHall: VALID_GUILD_HALL,
  settings: VALID_SETTINGS,
  founder: VALID_MEMBER,
  roster: [VALID_ROSTER_MEMBER],
  activeMissions: [],
  completedMissions: [],
  tutorialStep: 'sandbox-intro',
  tavern: { lastRefreshTime: 0, availableMercenaries: [] },
  inventory: { items: {} },
};

export const VALID_METADATA: SaveSlotMetadata = {
  slotId: 1,
  guildName: 'Test Guild',
  guildLevel: 1,
  playTimeMs: 0,
  founderName: 'TestFounder',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const VALID_SAVE_ENVELOPE: SaveEnvelope = {
  version: 1,
  savedAt: Date.now(),
  metadata: VALID_METADATA,
  gameState: VALID_GAME_SAVE_DATA,
};
