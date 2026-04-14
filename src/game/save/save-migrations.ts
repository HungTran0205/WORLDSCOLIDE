/**
 * Save migration chain — v7→v8 adds rank hierarchy + missionsCompleted.
 * Saves <v7 are still rejected (cell-based rooms breaking change).
 */

import type { SaveEnvelope } from './save-types';
import { SAVE_VERSION } from './save-types';
import { FACILITY_DEFAULT_SLOTS } from '@/game/data/facility-slot-positions';

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

/** v9→v10: Remove rooms, flatten to floorTiles + furniture at guild level */
function migrateV9toV10(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;
  const guildHall = gs.guildHall as AnyRecord;

  // If already migrated (has floorTiles), skip
  if (Array.isArray(guildHall.floorTiles)) {
    return { ...envelope, version: 10 };
  }

  const rooms = (guildHall.rooms as AnyRecord[]) ?? [];
  const floorTiles: AnyRecord[] = [];
  const furniture: AnyRecord[] = [];

  // Room type → floor color mapping (hardcoded since ROOM_DEFINITIONS is removed)
  const ROOM_COLORS: Record<string, string> = {
    'guild-hall': '#DAA520',
    'tavern': '#8B4513',
    'training-room': '#4682B4',
    'workshop': '#708090',
    'infirmary': '#FF6347',
  };

  const seenTiles = new Set<string>();
  for (const room of rooms) {
    const color = ROOM_COLORS[room.type as string] ?? '#DAA520';
    const cells = (room.cells as AnyRecord[]) ?? [];
    const roomFurniture = (room.furniture as AnyRecord[]) ?? [];

    // Flatten cells → floor tiles with room's color (deduplicate overlapping rooms)
    for (const cell of cells) {
      const key = `${cell.x},${cell.z}`;
      if (!seenTiles.has(key)) {
        seenTiles.add(key);
        floorTiles.push({ x: cell.x, z: cell.z, color });
      }
    }

    // Move furniture up to guild level (positions already world coords)
    furniture.push(...roomFurniture);
  }

  // Fallback: if no rooms existed, create default 6x6 gold floor + quest-board
  if (floorTiles.length === 0) {
    for (let x = 0; x < 6; x++) {
      for (let z = 0; z < 6; z++) {
        floorTiles.push({ x, z, color: '#DAA520' });
      }
    }
    furniture.push({
      id: crypto.randomUUID(),
      type: 'quest-board',
      level: 1,
      position: { x: 3, z: 3 },
      rotation: 0,
    });
  }

  const migratedGuildHall = {
    level: guildHall.level ?? 1,
    floorTiles,
    furniture,
  };

  return {
    ...envelope,
    version: 10,
    gameState: {
      ...gs,
      guildHall: migratedGuildHall,
    } as unknown as SaveEnvelope['gameState'],
  };
}

/** v10→v11: Add facilities array; reset orphaned 'assigned' member statuses */
function migrateV10toV11(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;

  // Add default facilities (tavern lv1, others locked)
  const facilities = [
    { type: 'tavern',        level: 1, assignedMemberIds: [] },
    { type: 'training-yard', level: 0, assignedMemberIds: [] },
    { type: 'infirmary',     level: 0, assignedMemberIds: [] },
    { type: 'workshop',      level: 0, assignedMemberIds: [] },
  ];

  // Reset any members with 'assigned' status back to 'idle'
  // (v10 saves have no facility data so assignments can't be restored)
  const resetStatus = (m: AnyRecord): AnyRecord =>
    m.status === 'assigned' ? { ...m, status: 'idle' } : m;

  const founder = gs.founder ? resetStatus(gs.founder as AnyRecord) : null;
  const roster = Array.isArray(gs.roster)
    ? (gs.roster as AnyRecord[]).map(resetStatus)
    : [];

  return {
    ...envelope,
    version: 11,
    gameState: { ...gs, founder, roster, facilities } as unknown as SaveEnvelope['gameState'],
  };
}

/** v11→v12: Remap old sandbox tutorial steps + add logging-site/stone-quarry if absent */
function migrateV11toV12(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;

  // Remap old sandbox tutorial steps to 'complete'
  const OLD_STEPS = ['sandbox-intro', 'first-build', 'first-quest', 'first-combat', 'first-recruit'];
  const tutorialStep = OLD_STEPS.includes(gs.tutorialStep as string)
    ? 'complete'
    : gs.tutorialStep;

  // Ensure logging-site and stone-quarry exist in facilities (added in recent feature)
  const facilities: AnyRecord[] = Array.isArray(gs.facilities) ? [...gs.facilities] : [];
  const ENSURE_FACILITIES = [
    { type: 'logging-site', level: 0, assignedMemberIds: [] },
    { type: 'stone-quarry', level: 0, assignedMemberIds: [] },
  ];
  for (const f of ENSURE_FACILITIES) {
    if (!facilities.some((existing) => existing.type === f.type)) {
      facilities.push(f);
    }
  }

  return {
    ...envelope,
    version: 12,
    gameState: { ...gs, tutorialStep, facilities } as unknown as SaveEnvelope['gameState'],
  };
}

/** v12→v13: Add placedSlot to GuildFacility; built facilities get default slot, unbuilt get null */
function migrateV12toV13(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;

  const facilities = Array.isArray(gs.facilities)
    ? (gs.facilities as AnyRecord[]).map((f) => {
        if (f.placedSlot !== undefined) return f; // already migrated
        const slot = f.level > 0
          ? (FACILITY_DEFAULT_SLOTS[f.type as string] ?? null)
          : null;
        return { ...f, placedSlot: slot };
      })
    : gs.facilities;

  return {
    ...envelope,
    version: 13,
    gameState: { ...gs, facilities } as unknown as SaveEnvelope['gameState'],
  };
}

/** v13→v14: Add craftSkills to members; add woodReserve to facilities */
function migrateV13toV14(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;

  const DEFAULT_CRAFT_SKILLS = { woodcutting: { level: 0, xpAccumulated: 0 } };

  const migrateMember = (m: AnyRecord): AnyRecord => ({
    ...m,
    craftSkills: m.craftSkills ?? DEFAULT_CRAFT_SKILLS,
  });

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

  const facilities = Array.isArray(gs.facilities)
    ? (gs.facilities as AnyRecord[]).map((f) => ({
        ...f,
        woodReserve: f.woodReserve !== undefined
          ? f.woodReserve
          : f.type === 'logging-site' && f.level > 0
            ? 1000   // existing built logging sites start full
            : null,  // all other facilities get null
      }))
    : gs.facilities;

  return {
    ...envelope,
    version: 14,
    gameState: { ...gs, founder, roster, tavern: migratedTavern, facilities } as unknown as SaveEnvelope['gameState'],
  };
}

/** v14→v15: Add graphicsQuality field to settings (default 'high') */
function migrateV14toV15(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;
  const settings = (gs.settings ?? {}) as AnyRecord;

  return {
    ...envelope,
    version: 15,
    gameState: {
      ...gs,
      settings: {
        ...settings,
        graphicsQuality: settings.graphicsQuality ?? 'high',
      },
    } as unknown as SaveEnvelope['gameState'],
  };
}

/** Migration chain: index = source version, fn upgrades to next version */
const MIGRATIONS: Record<number, MigrationFn> = {
  7: migrateV7toV8,
  8: migrateV8toV9,
  9: migrateV9toV10,
  10: migrateV10toV11,
  11: migrateV11toV12,
  12: migrateV12toV13,
  13: migrateV13toV14,
  14: migrateV14toV15,
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
