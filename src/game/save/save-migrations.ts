/**
 * Save migration — v7 is a breaking change (cell-based rooms + furniture).
 * All saves prior to v7 are incompatible. No migration chain needed.
 */

import type { SaveEnvelope } from './save-types';
import { SAVE_VERSION } from './save-types';

export type MigrationFn = (envelope: SaveEnvelope) => SaveEnvelope;

/** No migrations — old saves are rejected outright */
export const migrations: MigrationFn[] = [];

/**
 * Validate save version. Throws if incompatible.
 * Version check runs BEFORE structural validation (isValidRoom).
 */
export function migrateSave(envelope: SaveEnvelope): SaveEnvelope {
  if (envelope.version > SAVE_VERSION) {
    throw new Error(
      `Save version ${envelope.version} is newer than supported version ${SAVE_VERSION}. ` +
        'Please update the game client.',
    );
  }

  if (envelope.version < SAVE_VERSION) {
    throw new Error(
      'Save data is from an older incompatible version. Please start a new game.',
    );
  }

  return envelope;
}
