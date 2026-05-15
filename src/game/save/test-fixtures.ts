/**
 * Shared test fixtures for save system unit tests.
 * v9 envelope used for migration testing; VALID_GUILD_HALL matches v10 schema.
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
  civilization: 'LinhSon',
  archetype: 'warrior',
  gender: 'M',
  isFounder: true,
  rank: 'COMMANDER',
  missionsCompleted: 0,
  craftSkills: { woodcutting: { level: 0, xpAccumulated: 0 }, mining: { level: 0, xpAccumulated: 0 }, alchemy: { level: 0, xpAccumulated: 0 } },
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
  civilization: 'DeQuoc',
  archetype: 'engineer',
  gender: 'F',
  isFounder: false,
  rank: 'RECRUIT',
  missionsCompleted: 0,
  craftSkills: { woodcutting: { level: 0, xpAccumulated: 0 }, mining: { level: 0, xpAccumulated: 0 }, alchemy: { level: 0, xpAccumulated: 0 } },
};

/** Generate a 6x6 grid of floor tiles starting at (0,0) */
function makeTiles(ox = 0, oz = 0, w = 6, d = 6, color = '#DAA520') {
  const tiles = [];
  for (let x = ox; x < ox + w; x++) {
    for (let z = oz; z < oz + d; z++) {
      tiles.push({ x, z, color });
    }
  }
  return tiles;
}

export const VALID_GUILD_HALL: GuildHall = {
  level: 1,
  floorTiles: makeTiles(0, 0, 6, 6),
  furniture: [{
    id: 'furniture-quest-board',
    type: 'quest-board',
    level: 1,
    position: { x: 2, z: 2 },
    rotation: 0,
  }],
};

export const VALID_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  autoSkillDefault: true,
  graphicsQuality: 'high',
  shadowsEnabled: false,
  bloomEnabled: false,
  bloomThreshold: 0.85,
  atmosphericEnabled: true,
};

export const VALID_ACTIVE_MISSION: ActiveMission = {
  missionId: 'mission-f-01',
  memberIds: ['founder-001'],
  startTime: 1000,
  estimatedEndTime: 61000,
  phase: 'traveling',
  arrivalTime: null,
  targetPriority: 'focus',
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
  tutorialStep: 'complete',
  tavern: { lastRefreshTime: 0, availableMercenaries: [] },
  inventory: { items: {} },
  facilities: [
    { id: 'tavern',        type: 'tavern',        level: 1, assignedMemberIds: [], placedSlot: 8,    woodReserve: null },
    { id: 'training-yard', type: 'training-yard', level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
    { id: 'infirmary',     type: 'infirmary',     level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
    { id: 'workshop',      type: 'workshop',      level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
    { id: 'logging-site',  type: 'logging-site',  level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
    { id: 'stone-quarry',  type: 'stone-quarry',  level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  ],
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
  version: 12,
  savedAt: Date.now(),
  metadata: VALID_METADATA,
  gameState: VALID_GAME_SAVE_DATA,
};
