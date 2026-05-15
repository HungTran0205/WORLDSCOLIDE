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

/** v15→v16: Add mining skill to craftSkills for all members */
function migrateV15toV16(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;

  const DEFAULT_MINING_SKILL = { level: 0, xpAccumulated: 0 };

  const migrateMember = (m: AnyRecord): AnyRecord => {
    const skills = (m.craftSkills ?? {}) as AnyRecord;
    if (skills.mining !== undefined) return m; // already migrated
    return {
      ...m,
      craftSkills: { ...skills, mining: DEFAULT_MINING_SKILL },
    };
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
    version: 16,
    gameState: { ...gs, founder, roster, tavern: migratedTavern } as unknown as SaveEnvelope['gameState'],
  };
}

/** v16→v17: Add alchemy skill to all members; add alchemy-lab facility if absent */
function migrateV16toV17(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;

  const DEFAULT_ALCHEMY_SKILL = { level: 0, xpAccumulated: 0 };

  const migrateMember = (m: AnyRecord): AnyRecord => {
    const skills = (m.craftSkills ?? {}) as AnyRecord;
    if (skills.alchemy !== undefined) return m;
    return { ...m, craftSkills: { ...skills, alchemy: DEFAULT_ALCHEMY_SKILL } };
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

  const facilities: AnyRecord[] = Array.isArray(gs.facilities) ? [...gs.facilities] : [];
  if (!facilities.some((f) => f.type === 'alchemy-lab')) {
    facilities.push({ type: 'alchemy-lab', level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null });
  }

  return {
    ...envelope,
    version: 17,
    gameState: { ...gs, founder, roster, tavern: migratedTavern, facilities } as unknown as SaveEnvelope['gameState'],
  };
}

/** v17→v18: Add shadowsEnabled, bloomEnabled, bloomThreshold to settings */
function migrateV17toV18(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;
  const settings = (gs.settings ?? {}) as AnyRecord;

  return {
    ...envelope,
    version: 18,
    gameState: {
      ...gs,
      settings: {
        ...settings,
        shadowsEnabled: settings.shadowsEnabled ?? false,
        bloomEnabled: settings.bloomEnabled ?? false,
        bloomThreshold: settings.bloomThreshold ?? 0.85,
      },
    } as unknown as SaveEnvelope['gameState'],
  };
}

/** v18→v19: Add equipment slots to all members; add equipmentInventory to inventory state */
function migrateV18toV19(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;

  const migrateMember = (m: AnyRecord): AnyRecord => {
    if (m.equipment !== undefined) return m;
    return { ...m, equipment: null };
  };

  const founder = gs.founder ? migrateMember(gs.founder as AnyRecord) : null;
  const roster = Array.isArray(gs.roster)
    ? (gs.roster as AnyRecord[]).map(migrateMember)
    : [];

  const tavern = gs.tavern as AnyRecord | undefined;
  let migratedTavern = tavern;
  if (tavern?.availableMercenaries && Array.isArray(tavern.availableMercenaries)) {
    migratedTavern = {
      ...tavern,
      availableMercenaries: (tavern.availableMercenaries as AnyRecord[]).map(migrateMember),
    };
  }

  const inventory = (gs.inventory ?? {}) as AnyRecord;
  const migratedInventory = {
    ...inventory,
    equipmentInventory: inventory.equipmentInventory ?? [],
  };

  return {
    ...envelope,
    version: 19,
    gameState: {
      ...gs,
      founder,
      roster,
      tavern: migratedTavern,
      inventory: migratedInventory,
    } as unknown as SaveEnvelope['gameState'],
  };
}

const DEFAULT_MED_SLOTS = [
  { itemId: null, condition: 'start' },
  { itemId: null, condition: 'start' },
];

function migrateV19toV20(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as AnyRecord;
  const addMed = (m: AnyRecord) => m.medicineSlots ? m : { ...m, medicineSlots: DEFAULT_MED_SLOTS };
  const founder = gs.founder ? addMed(gs.founder as AnyRecord) : null;
  const roster = Array.isArray(gs.roster) ? (gs.roster as AnyRecord[]).map(addMed) : [];
  const tavern = gs.tavern as AnyRecord | undefined;
  const migratedTavern = tavern?.availableMercenaries && Array.isArray(tavern.availableMercenaries)
    ? { ...tavern, availableMercenaries: (tavern.availableMercenaries as AnyRecord[]).map(addMed) }
    : tavern;
  return { ...envelope, version: 20, gameState: { ...gs, founder, roster, tavern: migratedTavern } as unknown as SaveEnvelope['gameState'] };
}

/** v20→v21: Add id to GuildFacility — primary instances get id === type */
function migrateV20toV21(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;
  const facilities = Array.isArray(gs.facilities)
    ? (gs.facilities as AnyRecord[]).map((f) => ({
        id: f.type as string, // default: primary instance id = type
        ...f,                 // if id already exists in f, it wins
      }))
    : gs.facilities;
  return {
    ...envelope,
    version: 21,
    gameState: { ...gs, facilities } as unknown as SaveEnvelope['gameState'],
  };
}

/**
 * v21→v22: Combat panel idle redesign cleanup.
 *  - Drop ActiveMission.combatMode (manual/auto choice removed; new panel always opens)
 *  - Add ActiveMission.targetPriority defaulting to 'focus' (Focus/Balance toggle in formation)
 */
function migrateV21toV22(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;
  const activeMissions = Array.isArray(gs.activeMissions)
    ? (gs.activeMissions as AnyRecord[]).map((m) => {
        const { combatMode: _drop, ...rest } = m as AnyRecord & { combatMode?: unknown };
        return { ...rest, targetPriority: rest.targetPriority ?? 'focus' };
      })
    : gs.activeMissions;
  return {
    ...envelope,
    version: 22,
    gameState: { ...gs, activeMissions } as unknown as SaveEnvelope['gameState'],
  };
}

/**
 * v22→v23: Workshop Room v2 schema additions.
 *  - EquipmentItem gets `slots: []` (default empty) and `maxSlots: 4` for legacy gear.
 *  - GuildFacility gets `workshopQueue: []` and `workshopBlueprints: []` (workshop only).
 */
function migrateV22toV23(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;

  const migrateEquipment = (eq: AnyRecord): AnyRecord => ({
    ...eq,
    slots: Array.isArray(eq.slots) ? eq.slots : [],
    maxSlots: typeof eq.maxSlots === 'number' ? eq.maxSlots : 4,
  });

  const migrateMemberEquipment = (m: AnyRecord): AnyRecord => {
    const eq = m.equipment as AnyRecord | null | undefined;
    if (!eq) return m;
    const slots = ['weapon', 'armor', 'headgear'] as const;
    const newEq: AnyRecord = { ...eq };
    for (const slot of slots) {
      const item = eq[slot] as AnyRecord | null | undefined;
      if (item) newEq[slot] = migrateEquipment(item);
    }
    return { ...m, equipment: newEq };
  };

  const founder = gs.founder ? migrateMemberEquipment(gs.founder as AnyRecord) : null;
  const roster = Array.isArray(gs.roster)
    ? (gs.roster as AnyRecord[]).map(migrateMemberEquipment)
    : [];

  const tavern = gs.tavern as AnyRecord | undefined;
  const migratedTavern = tavern?.availableMercenaries && Array.isArray(tavern.availableMercenaries)
    ? { ...tavern, availableMercenaries: (tavern.availableMercenaries as AnyRecord[]).map(migrateMemberEquipment) }
    : tavern;

  const inventory = (gs.inventory ?? {}) as AnyRecord;
  const eqInv = Array.isArray(inventory.equipmentInventory)
    ? (inventory.equipmentInventory as AnyRecord[]).map(migrateEquipment)
    : [];
  const migratedInventory = { ...inventory, equipmentInventory: eqInv };

  const facilities = Array.isArray(gs.facilities)
    ? (gs.facilities as AnyRecord[]).map((f) =>
        f.type === 'workshop'
          ? {
              ...f,
              workshopQueue: Array.isArray(f.workshopQueue) ? f.workshopQueue : [],
              workshopBlueprints: Array.isArray(f.workshopBlueprints) ? f.workshopBlueprints : [],
            }
          : f,
      )
    : gs.facilities;

  return {
    ...envelope,
    version: 23,
    gameState: {
      ...gs,
      founder,
      roster,
      tavern: migratedTavern,
      inventory: migratedInventory,
      facilities,
    } as unknown as SaveEnvelope['gameState'],
  };
}

/**
 * v23→v24: Tavern Facility overhaul.
 *  - Member: normalize `rarity` to required 1 (legacy default); ensure `traits: []`.
 *  - TavernState: replace `{ lastRefreshTime, availableMercenaries }` with the new
 *    recruitment-hub shape. `currentRoster` starts empty; next day-tick respawns it.
 *  - ActiveMission: add parallel `mercContractIds: []` (AD1).
 */
// Game-day scale — kept local to avoid cross-imports from systems into save layer.
const MIGRATION_TICKS_PER_DAY = 14400;

function migrateV23toV24(envelope: SaveEnvelope): SaveEnvelope {
  const gs = envelope.gameState as unknown as AnyRecord;

  const normalizeMember = (m: AnyRecord): AnyRecord => ({
    ...m,
    rarity: typeof m.rarity === 'number' ? m.rarity : 1,
    traits: Array.isArray(m.traits) ? m.traits : [],
  });

  const founder = gs.founder ? normalizeMember(gs.founder as AnyRecord) : null;
  const roster = Array.isArray(gs.roster)
    ? (gs.roster as AnyRecord[]).map(normalizeMember)
    : [];

  const currentDay = Math.floor(((gs.gameTime as number) ?? 0) / MIGRATION_TICKS_PER_DAY);

  const tavern = {
    level: 1 as const,
    keeperId: null,
    reputation: 0,
    currentRoster: [],
    rerolledToday: false,
    factionBias: null,
    rumor: null,
    mercContracts: [],
    pendingPrompts: [],
    lastDayProcessed: currentDay,
    reputationLastTickWeek: currentDay,
    globalNegotiationDebuffUntilDay: null,
  };

  const activeMissions = Array.isArray(gs.activeMissions)
    ? (gs.activeMissions as AnyRecord[]).map((am) => ({
        ...am,
        mercContractIds: Array.isArray(am.mercContractIds) ? am.mercContractIds : [],
      }))
    : gs.activeMissions;

  return {
    ...envelope,
    version: 24,
    gameState: {
      ...gs,
      founder,
      roster,
      tavern,
      activeMissions,
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
  15: migrateV15toV16,
  16: migrateV16toV17,
  17: migrateV17toV18,
  18: migrateV18toV19,
  19: migrateV19toV20,
  20: migrateV20toV21,
  21: migrateV21toV22,
  22: migrateV22toV23,
  23: migrateV23toV24,
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
