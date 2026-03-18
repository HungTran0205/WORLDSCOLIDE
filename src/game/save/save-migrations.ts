/**
 * Save migration chain — v7→v8 adds rank hierarchy + missionsCompleted.
 * Saves <v7 are still rejected (cell-based rooms breaking change).
 */

import type { SaveEnvelope } from './save-types';
import { SAVE_VERSION } from './save-types';

export type MigrationFn = (envelope: SaveEnvelope) => SaveEnvelope;

/** v7→v8: Add missionsCompleted field, remap MEMBER rank to hierarchy */
function migrateV7toV8(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as Record<string, unknown>;

  const migrateMember = (m: Record<string, unknown>): Record<string, unknown> => {
    // Seed missionsCompleted heuristic: level * 2
    const level = (m.level as number) ?? 1;
    const seedMissions = Math.floor(level * 2);
    const migrated = { ...m, missionsCompleted: seedMissions };

    // Keep mercenaries as-is
    if (m.rank === 'MERCENARY') return migrated;

    // Remap rank based on level heuristic
    if (m.isFounder) {
      migrated.rank = 'COMMANDER';
    } else if (level >= 10) {
      migrated.rank = 'VETERAN';
    } else if (level >= 5) {
      migrated.rank = 'MEMBER';
    } else {
      migrated.rank = 'RECRUIT';
    }

    return migrated;
  };

  // Migrate founder
  const founder = gs.founder ? migrateMember(gs.founder as Record<string, unknown>) : null;

  // Migrate roster
  const roster = Array.isArray(gs.roster)
    ? (gs.roster as Record<string, unknown>[]).map(migrateMember)
    : [];

  // Migrate tavern mercenaries (also Member objects)
  const tavern = gs.tavern as Record<string, unknown> | undefined;
  let migratedTavern = tavern;
  if (tavern?.availableMercenaries && Array.isArray(tavern.availableMercenaries)) {
    migratedTavern = {
      ...tavern,
      availableMercenaries: (tavern.availableMercenaries as Record<string, unknown>[]).map(migrateMember),
    };
  }

  return {
    ...envelope,
    version: 8,
    gameState: { ...gs, founder, roster, tavern: migratedTavern } as SaveEnvelope['gameState'],
  };
}

/** Migration chain: index = source version, fn upgrades to next version */
const MIGRATIONS: Record<number, MigrationFn> = {
  7: migrateV7toV8,
};

/**
 * Migrate save from any supported version to current.
 * Rejects saves <v7 (incompatible) and >SAVE_VERSION (too new).
 */
export function migrateSave(envelope: SaveEnvelope): SaveEnvelope {
  if (envelope.version > SAVE_VERSION) {
    throw new Error(
      `Save version ${envelope.version} is newer than supported ${SAVE_VERSION}. Update the game.`,
    );
  }

  if (envelope.version < 7) {
    throw new Error('Save data is from an older incompatible version. Please start a new game.');
  }

  // Apply migrations sequentially
  let result = envelope;
  while (result.version < SAVE_VERSION) {
    const fn = MIGRATIONS[result.version];
    if (!fn) {
      throw new Error(`No migration for version ${result.version}. Save may be corrupted.`);
    }
    result = fn(result);
  }

  return result;
}
