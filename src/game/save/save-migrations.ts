/**
 * Save migration chain — v7→v8 adds rank hierarchy + missionsCompleted.
 * Saves <v7 are still rejected (cell-based rooms breaking change).
 */

import type { SaveEnvelope } from './save-types';
import { SAVE_VERSION } from './save-types';

export type MigrationFn = (envelope: SaveEnvelope) => SaveEnvelope;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/** v7→v8: Add missionsCompleted field, remap MEMBER rank to hierarchy */
function migrateV7toV8(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;

  const migrateMember = (m: AnyRecord): AnyRecord => {
    const level = (m.level as number) ?? 1;
    const seedMissions = Math.floor(level * 2);
    const migrated: AnyRecord = { ...m, missionsCompleted: seedMissions };

    if (m.rank === 'MERCENARY') return migrated;

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

  const founder = gs.founder ? migrateMember(gs.founder as AnyRecord) : null;
  const roster = Array.isArray(gs.roster) ? (gs.roster as AnyRecord[]).map(migrateMember) : [];

  const tavern = gs.tavern as AnyRecord | undefined;
  let migratedTavern = tavern;
  if (tavern?.availableMercenaries && Array.isArray(tavern.availableMercenaries)) {
    migratedTavern = {
      ...tavern,
      availableMercenaries: (tavern.availableMercenaries as AnyRecord[]).map(migrateMember),
    };
  }

  return {
    ...envelope,
    version: 8,
    gameState: { ...gs, founder, roster, tavern: migratedTavern } as unknown as SaveEnvelope['gameState'],
  };
}

/** v8→v9: Remap civilization names Viet→LinhSon, Nordic→DeQuoc, Saharan→ThienLu */
function migrateV8toV9(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;

  const CIV_REMAP: Record<string, string> = {
    Viet: 'LinhSon',
    Nordic: 'DeQuoc',
    Saharan: 'ThienLu',
  };

  const remapMember = (m: AnyRecord): AnyRecord => ({
    ...m,
    civilization: CIV_REMAP[m.civilization as string] ?? m.civilization,
  });

  const founder = gs.founder ? remapMember(gs.founder as AnyRecord) : null;
  const roster = Array.isArray(gs.roster) ? (gs.roster as AnyRecord[]).map(remapMember) : [];

  const tavern = gs.tavern as AnyRecord | undefined;
  let migratedTavern = tavern;
  if (tavern?.availableMercenaries && Array.isArray(tavern.availableMercenaries)) {
    migratedTavern = {
      ...tavern,
      availableMercenaries: (tavern.availableMercenaries as AnyRecord[]).map(remapMember),
    };
  }

  return {
    ...envelope,
    version: 9,
    gameState: { ...gs, founder, roster, tavern: migratedTavern } as unknown as SaveEnvelope['gameState'],
  };
}

/** Migration chain: index = source version, fn upgrades to next version */
const MIGRATIONS: Record<number, MigrationFn> = {
  7: migrateV7toV8,
  8: migrateV8toV9,
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
