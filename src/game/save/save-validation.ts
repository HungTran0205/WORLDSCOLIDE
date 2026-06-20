/**
 * Save data validation — structural type guards + semantic checks.
 * No external validation libs (no Zod). Manual guards only (KISS).
 */

import type { SaveEnvelope, GameSaveData, SaveSlotMetadata } from './save-types';
import type { Stats, Member, GuildHall, PlacedFurniture } from '@/game/state/game-state';
import { migrateSave } from './save-migrations';
import { GRADE_ORDER } from '@/game/data/grades';

const TUTORIAL_STEPS = [
  'char-creation', 'arrival-alarm', 'open-quest-board', 'accept-bear-quest',
  'assign-and-dispatch', 'quest-travel', 'moonbear-combat', 'kael-rescue',
  'reward-splash', 'build-logging-site', 'assign-kael', 'first-haul-reward',
  'build-tavern', 'assign-keeper', 'recruit-first-member', 'complete',
] as const;

const STAT_KEYS: (keyof Stats)[] = ['STR', 'END', 'INT', 'DEX', 'CHA', 'LCK', 'AGI'];

const VALID_ROTATIONS = [0, 90, 180, 270];

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isValidStats(v: unknown): v is Stats {
  if (!isRecord(v)) return false;
  // RT-Med: guard NaN — typeof NaN === 'number' passes without isFinite check
  return STAT_KEYS.every((k) => typeof v[k] === 'number' && Number.isFinite(v[k] as number));
}

function isValidMember(v: unknown): v is Member {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.grade === 'string' &&
    GRADE_ORDER.includes(v.grade as import('@/game/data/grades').Grade) &&
    typeof v.isMercenary === 'boolean' &&
    isValidStats(v.stats) &&
    typeof v.unallocatedPoints === 'number' &&
    typeof v.civilization === 'string' &&
    typeof v.isFounder === 'boolean' &&
    typeof v.status === 'string' &&
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

function isValidFloorTile(v: unknown): boolean {
  if (!isRecord(v)) return false;
  return (
    typeof v.x === 'number' &&
    typeof v.z === 'number' &&
    typeof v.color === 'string'
  );
}

function isValidGuildHall(v: unknown): v is GuildHall {
  if (!isRecord(v)) return false;
  return (
    typeof v.level === 'number' &&
    Array.isArray(v.floorTiles) &&
    v.floorTiles.every(isValidFloorTile) &&
    Array.isArray(v.furniture) &&
    v.furniture.every(isValidPlacedFurniture)
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
    if (!GRADE_ORDER.includes(m.grade)) errors.push(`member "${m.name}" has invalid grade: ${m.grade}`);
  }
  if (data.founder && !GRADE_ORDER.includes(data.founder.grade)) {
    errors.push(`founder has invalid grade: ${data.founder.grade}`);
  }
  if (!TUTORIAL_STEPS.includes(data.tutorialStep as typeof TUTORIAL_STEPS[number])) {
    errors.push(`invalid tutorialStep: ${data.tutorialStep}`);
  }
  if (data.guildHall.floorTiles.length === 0) {
    errors.push('guildHall must have at least 1 floor tile');
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
    migrated = migrateSave(parsed as unknown as SaveEnvelope);
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
