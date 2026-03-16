/**
 * Save migration chain — upgrades old save versions to current.
 *
 * To add a migration (e.g. v1 → v2):
 *   1. Increment SAVE_VERSION in save-types.ts
 *   2. Push a MigrationFn into the `migrations` array below
 *      - Index 0 = v1→v2, index 1 = v2→v3, etc.
 *   3. The function receives a SaveEnvelope and must return one with version + 1
 */

import type { SaveEnvelope } from './save-types';
import { SAVE_VERSION } from './save-types';

export type MigrationFn = (envelope: SaveEnvelope) => SaveEnvelope;

/**
 * v1 → v2: ActiveMission gained phase/arrivalTime/combatMode fields.
 * In-flight missions default to 'traveling'; already-expired ones get 'traveling' too
 * so the tick system can re-evaluate and resolve them on next load.
 */
const migrateV1toV2: MigrationFn = (envelope) => ({
  ...envelope,
  version: 2,
  gameState: {
    ...envelope.gameState,
    activeMissions: (envelope.gameState.activeMissions as unknown as Array<Record<string, unknown>>).map(
      (m) => ({
        ...m,
        phase: 'traveling',
        arrivalTime: null,
        combatMode: null,
      }),
    ) as unknown as typeof envelope.gameState.activeMissions,
  },
});

/**
 * v2 → v3: Room gained `rotation` field for grid-based placement.
 * Existing rooms default to rotation 0 (unrotated).
 */
const migrateV2toV3: MigrationFn = (envelope) => ({
  ...envelope,
  version: 3,
  gameState: {
    ...envelope.gameState,
    guildHall: {
      ...(envelope.gameState.guildHall as unknown as Record<string, unknown>),
      rooms: ((envelope.gameState.guildHall as unknown as Record<string, unknown>).rooms as Array<Record<string, unknown>>).map(
        (r) => ({ ...r, rotation: r.rotation ?? 0 }),
      ),
    } as unknown as typeof envelope.gameState.guildHall,
  },
});

/**
 * v3 → v4: Member gains `rank` field (default 'MEMBER').
 * GameSaveData gains `tavern` state with empty mercenaries.
 */
const migrateV3toV4: MigrationFn = (envelope) => ({
  ...envelope,
  version: 4,
  gameState: {
    ...envelope.gameState,
    founder: envelope.gameState.founder
      ? { ...envelope.gameState.founder, rank: 'MEMBER' as const }
      : null,
    roster: (envelope.gameState.roster as unknown as Array<Record<string, unknown>>).map((m) => ({
      ...m,
      rank: 'MEMBER',
    })) as unknown as typeof envelope.gameState.roster,
    tavern: { lastRefreshTime: 0, availableMercenaries: [] },
  },
});

/**
 * v4 → v5: Add inventory with empty items map.
 */
const migrateV4toV5: MigrationFn = (envelope) => ({
  ...envelope,
  version: 5,
  gameState: {
    ...envelope.gameState,
    inventory: { items: {} },
  },
});

/**
 * Ordered migration functions. Index N migrates version (N+1) → (N+2).
 * Index 0 = v1→v2, Index 1 = v2→v3, Index 2 = v3→v4, Index 3 = v4→v5.
 */
export const migrations: MigrationFn[] = [migrateV1toV2, migrateV2toV3, migrateV3toV4, migrateV4toV5];

/**
 * Apply all necessary migrations to bring an envelope up to SAVE_VERSION.
 * Throws if envelope version is higher than SAVE_VERSION (future save in old client).
 */
export function migrateSave(envelope: SaveEnvelope): SaveEnvelope {
  if (envelope.version > SAVE_VERSION) {
    throw new Error(
      `Save version ${envelope.version} is newer than supported version ${SAVE_VERSION}. ` +
        'Please update the game client.',
    );
  }

  let current = envelope;
  while (current.version < SAVE_VERSION) {
    const migrationIndex = current.version - 1;
    const migrationFn = migrations[migrationIndex];
    if (!migrationFn) {
      throw new Error(
        `Missing migration for version ${current.version} → ${current.version + 1}`,
      );
    }
    current = migrationFn(current);
  }

  return current;
}
