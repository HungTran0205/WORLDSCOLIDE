/**
 * Save data model — envelope wrapping versioned game state + metadata.
 * All types are JSON-serializable (no Date, no functions).
 */

import type {
  Member,
  GuildHall,
  GameSettings,
  ActiveMission,
  TutorialStep,
  TavernState,
  InventoryState,
  GuildFacility,
} from '@/game/state/game-state';

/** Increment when game state shape changes; add a migration in save-migrations.ts */
export const SAVE_VERSION = 17;

/** Metadata shown on title-screen save slot cards */
export interface SaveSlotMetadata {
  slotId: number;
  guildName: string;
  guildLevel: number;
  playTimeMs: number;
  founderName: string;
  createdAt: number;
  updatedAt: number;
}

/** Data-only mirror of Zustand store (no action functions) */
export interface GameSaveData {
  gameTime: number;
  realTimeLastTick: number;
  guildName: string;
  guildLevel: number;
  gold: number;
  guildHall: GuildHall;
  settings: GameSettings;
  founder: Member | null;
  roster: Member[];
  activeMissions: ActiveMission[];
  completedMissions: string[];
  tutorialStep: TutorialStep;
  tavern: TavernState;
  inventory: InventoryState;
  facilities: GuildFacility[];
}

/** Top-level save structure persisted to IndexedDB */
export interface SaveEnvelope {
  version: number;
  savedAt: number;
  metadata: SaveSlotMetadata;
  gameState: GameSaveData;
}

/** Extract data-only fields from Zustand store state (strips action functions) */
export function extractGameSaveData(state: Record<string, unknown>): GameSaveData {
  return {
    gameTime: state.gameTime as number,
    realTimeLastTick: state.realTimeLastTick as number,
    guildName: state.guildName as string,
    guildLevel: state.guildLevel as number,
    gold: state.gold as number,
    guildHall: state.guildHall as GuildHall,
    settings: state.settings as GameSettings,
    founder: state.founder as Member | null,
    roster: state.roster as Member[],
    activeMissions: state.activeMissions as ActiveMission[],
    completedMissions: state.completedMissions as string[],
    tutorialStep: state.tutorialStep as TutorialStep,
    tavern: state.tavern as TavernState,
    inventory: state.inventory as InventoryState,
    facilities: state.facilities as GuildFacility[],
  };
}

/** Build a full SaveEnvelope from game data */
export function createSaveEnvelope(
  slotId: number,
  gameData: GameSaveData,
  existingMeta?: SaveSlotMetadata,
): SaveEnvelope {
  const now = Date.now();
  const metadata: SaveSlotMetadata = {
    slotId,
    guildName: gameData.guildName || 'Unnamed Guild',
    guildLevel: gameData.guildLevel,
    playTimeMs: existingMeta
      ? existingMeta.playTimeMs + (now - (existingMeta.updatedAt || now))
      : 0,
    founderName: gameData.founder?.name || 'Unknown',
    createdAt: existingMeta?.createdAt || now,
    updatedAt: now,
  };

  return {
    version: SAVE_VERSION,
    savedAt: now,
    metadata,
    gameState: gameData,
  };
}
