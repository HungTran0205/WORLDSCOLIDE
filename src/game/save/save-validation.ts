/**
 * Save data validation — structural type guards + semantic checks.
 * No external validation libs (no Zod). Manual guards only (KISS).
 */

import type { SaveEnvelope, GameSaveData, SaveSlotMetadata } from './save-types';
import type { Stats, Member, GuildHall, Room, PlacedFurniture } from '@/game/state/game-state';
import { SAVE_VERSION } from './save-types';
import { migrateSave } from './save-migrations';

/** Maximum cells a single room may occupy (matches building-system constant) */
const MAX_ROOM_CELLS = 100;

const TUTORIAL_STEPS = [
  'char-creation', 'sandbox-intro', 'first-build',
  'first-quest', 'first-combat', 'first-recruit', 'complete',
] as const;

const STAT_KEYS: (keyof Stats)[] = ['STR', 'END', 'INT', 'DEX', 'CHA', 'LCK', 'AGI'];

const VALID_RANKS = ['RECRUIT', 'MEMBER', 'VETERAN', 'OFFICER', 'COMMANDER', 'MERCENARY'];

const VALID_ROTATIONS = [0, 90, 180, 270];

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isValidStats(v: unknown): v is Stats {
  if (!isRecord(v)) return false;
  return STAT_KEYS.every((k) => typeof v[k] === 'number');
}

function isValidMember(v: unknown): v is Member {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.level === 'number' &&
    typeof v.exp === 'number' &&
    isValidStats(v.stats) &&
    typeof v.unallocatedPoints === 'number' &&
    typeof v.civilization === 'string' &&
    typeof v.isFounder === 'boolean' &&
    typeof v.status === 'string' &&
    typeof v.rank === 'string' &&
    VALID_RANKS.includes(v.rank as string) &&
    typeof v.missionsCompleted === 'number' &&
    (v.missionsCompleted as number) >= 0 &&
    Number.isFinite(v.missionsCompleted as number)
  );
}

function isValidGridCell(v: unknown): boolean {
  if (!isRecord(v)) return false;
  return typeof v.x === 'number' && typeof v.z === 'number';
}

function isValidPlacedFurniture(v: unknown): v is PlacedFurniture {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === 'string' &&
    typeof v.type === 'string' &&
    typeof v.level === 'number' &&
    isValidGridCell(v.position) &&
    VALID_ROTATIONS.includes(v.rotation as number)
  );
}

function isValidRoom(v: unknown): v is Room {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === 'string' &&
    typeof v.type === 'string' &&
    typeof v.level === 'number' &&
    Array.isArray(v.cells) &&
    v.cells.length > 0 &&
    v.cells.length <= MAX_ROOM_CELLS &&
    v.cells.every(isValidGridCell) &&
    Array.isArray(v.furniture) &&
    v.furniture.every(isValidPlacedFurniture)
  );
}

function isValidGuildHall(v: unknown): v is GuildHall {
  if (!isRecord(v)) return false;
  return (
    typeof v.level === 'number' &&
    Array.isArray(v.rooms) &&
    v.rooms.every(isValidRoom) &&
    typeof v.maxRooms === 'number'
  );
}

function isValidMetadata(v: unknown): v is SaveSlotMetadata {
  if (!isRecord(v)) return false;
  return (
    typeof v.slotId === 'number' &&
    typeof v.guildName === 'string' &&
    typeof v.guildLevel === 'number' &&
    typeof v.playTimeMs === 'number' &&
    typeof v.founderName === 'string' &&
    typeof v.createdAt === 'number' &&
    typeof v.updatedAt === 'number'
  );
}

function isValidGameSaveData(v: unknown): v is GameSaveData {
  if (!isRecord(v)) return false;
  return (
    typeof v.gameTime === 'number' &&
    typeof v.realTimeLastTick === 'number' &&
    typeof v.guildName === 'string' &&
    typeof v.guildLevel === 'number' &&
    typeof v.gold === 'number' &&
    isValidGuildHall(v.guildHall) &&
    isRecord(v.settings) &&
    (v.founder === null || isValidMember(v.founder)) &&
    Array.isArray(v.roster) &&
    v.roster.every(isValidMember) &&
    Array.isArray(v.activeMissions) &&
    Array.isArray(v.completedMissions) &&
    typeof v.tutorialStep === 'string' &&
    (v.inventory === undefined || (isRecord(v.inventory) && isRecord((v.inventory as Record<string, unknown>).items)))
  );
}

/** Structural type guard for SaveEnvelope */
export function isValidSaveEnvelope(data: unknown): data is SaveEnvelope {
  if (!isRecord(data)) return false;
  return (
    typeof data.version === 'number' &&
    typeof data.savedAt === 'number' &&
    isValidMetadata(data.metadata) &&
    isValidGameSaveData(data.gameState)
  );
}

/** Semantic validation — returns list of error strings (empty = valid) */
export function validateSemantics(data: GameSaveData): string[] {
  const errors: string[] = [];
  if (data.guildLevel < 1) errors.push('guildLevel must be >= 1');
  if (data.gold < 0) errors.push('gold must be >= 0');
  if (data.roster.length > 200) errors.push('roster too large');
  for (const m of data.roster) {
    if (m.level < 1) errors.push(`member "${m.name}" level must be >= 1`);
  }
  if (data.founder && data.founder.level < 1) {
    errors.push('founder level must be >= 1');
  }
  if (!TUTORIAL_STEPS.includes(data.tutorialStep as typeof TUTORIAL_STEPS[number])) {
    errors.push(`invalid tutorialStep: ${data.tutorialStep}`);
  }
  return errors;
}

export type ValidationResult =
  | { ok: true; data: SaveEnvelope }
  | { ok: false; errors: string[] };

/** Full validation + migration pipeline for imported data */
export function validateAndMigrate(raw: unknown): ValidationResult {
  // Parse string input
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, errors: ['Invalid JSON'] };
    }
  }

  if (!isRecord(parsed)) {
    return { ok: false, errors: ['Invalid save file structure'] };
  }

  // Reject saves too old to migrate (< v7)
  if (typeof parsed.version === 'number' && parsed.version < 7) {
    return { ok: false, errors: ['Save data is from an older incompatible version. Please start a new game.'] };
  }

  // Run migration BEFORE structural validation — v7 saves won't have
  // missionsCompleted yet, so structural check would fail on unmigrated data
  let migrated: SaveEnvelope;
  try {
    migrated = migrateSave(parsed as SaveEnvelope);
  } catch (e) {
    return { ok: false, errors: [(e as Error).message] };
  }

  // Structural check on migrated data
  if (!isValidSaveEnvelope(migrated)) {
    return { ok: false, errors: ['Invalid save file structure'] };
  }

  // Semantic checks
  const semanticErrors = validateSemantics(migrated.gameState);
  if (semanticErrors.length > 0) {
    return { ok: false, errors: semanticErrors };
  }

  return { ok: true, data: migrated };
}
