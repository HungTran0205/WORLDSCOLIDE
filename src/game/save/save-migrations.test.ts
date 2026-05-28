import { describe, it, expect } from 'vitest';
import { migrateSave } from './save-migrations';
import { VALID_SAVE_ENVELOPE } from './test-fixtures';
import { SAVE_VERSION } from './save-types';
import { CIV_CONFIG } from '@/game/data/civilization-config';

/** Build a minimal v7 save envelope for migration testing */
function makeV7Envelope(overrides: Record<string, unknown> = {}) {
  return {
    version: 7,
    savedAt: Date.now(),
    metadata: { slotId: 1, guildName: 'Test', guildLevel: 1, playTimeMs: 0, founderName: 'F', createdAt: 0, updatedAt: 0 },
    gameState: {
      gameTime: 0, realTimeLastTick: 0, guildName: 'Test', guildLevel: 1, gold: 100,
      guildHall: { level: 1, rooms: [{ id: 'r1', type: 'guild-hall', level: 1, cells: [{ x: 0, z: 0 }], furniture: [] }], maxRooms: 3 },
      settings: { musicVolume: 0.5, sfxVolume: 0.7, autoSkillDefault: true },
      founder: { id: 'f1', name: 'Founder', level: 5, exp: 0, stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 }, unallocatedPoints: 0, skill: null, status: 'idle', injuredUntil: null, civilization: 'Viet', isFounder: true, rank: 'MEMBER' },
      roster: [
        { id: 'r1', name: 'Newbie', level: 2, exp: 0, stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 }, unallocatedPoints: 0, skill: null, status: 'idle', injuredUntil: null, civilization: 'Nordic', isFounder: false, rank: 'MEMBER' },
        { id: 'r2', name: 'Veteran', level: 12, exp: 0, stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 }, unallocatedPoints: 0, skill: null, status: 'idle', injuredUntil: null, civilization: 'Saharan', isFounder: false, rank: 'MEMBER' },
        { id: 'r3', name: 'Merc', level: 3, exp: 0, stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 }, unallocatedPoints: 0, skill: null, status: 'idle', injuredUntil: null, civilization: 'Viet', isFounder: false, rank: 'MERCENARY' },
      ],
      activeMissions: [], completedMissions: [], tutorialStep: 'complete',
      tavern: { lastRefreshTime: 0, availableMercenaries: [
        { id: 'm1', name: 'TavMerc', level: 2, exp: 0, stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 }, unallocatedPoints: 0, skill: null, status: 'idle', injuredUntil: null, civilization: 'Nordic', isFounder: false, rank: 'MERCENARY' },
      ] },
      inventory: { items: {} },
      ...overrides,
    },
  };
}

describe('migrateSave', () => {
  it('passes through current-version saves unchanged', () => {
    const result = migrateSave(VALID_SAVE_ENVELOPE);
    expect(result.version).toBe(SAVE_VERSION);
    expect(result.gameState.founder?.rank).toBe('COMMANDER');
    expect(result.gameState.founder?.missionsCompleted).toBe(0);
  });

  it('migrates v7 → current: bumps version to SAVE_VERSION', () => {
    const result = migrateSave(makeV7Envelope() as any);
    expect(result.version).toBe(SAVE_VERSION);
  });

  it('migrates v7 → v8: founder gets COMMANDER rank', () => {
    const result = migrateSave(makeV7Envelope() as any);
    expect((result.gameState as any).founder.rank).toBe('COMMANDER');
  });

  it('migrates v7 → v8: low-level member becomes RECRUIT', () => {
    const result = migrateSave(makeV7Envelope() as any);
    const newbie = (result.gameState as any).roster.find((m: any) => m.id === 'r1');
    expect(newbie.rank).toBe('RECRUIT');
  });

  it('migrates v7 → v8: high-level member becomes VETERAN', () => {
    const result = migrateSave(makeV7Envelope() as any);
    const vet = (result.gameState as any).roster.find((m: any) => m.id === 'r2');
    expect(vet.rank).toBe('VETERAN');
  });

  it('migrates v7 → v8: mercenary stays MERCENARY', () => {
    const result = migrateSave(makeV7Envelope() as any);
    const merc = (result.gameState as any).roster.find((m: any) => m.id === 'r3');
    expect(merc.rank).toBe('MERCENARY');
  });

  it('migrates v7 → v8: seeds missionsCompleted = level * 2', () => {
    const result = migrateSave(makeV7Envelope() as any);
    expect((result.gameState as any).founder.missionsCompleted).toBe(10); // level 5 * 2
    const newbie = (result.gameState as any).roster.find((m: any) => m.id === 'r1');
    expect(newbie.missionsCompleted).toBe(4); // level 2 * 2
  });

  // v8→v9 civilization remap tests
  it('migrates v8→v9: remaps Viet to LinhSon', () => {
    const result = migrateSave(makeV7Envelope() as any);
    expect((result.gameState as any).founder.civilization).toBe('LinhSon');
  });

  it('migrates v8→v9: remaps Nordic to DeQuoc', () => {
    const result = migrateSave(makeV7Envelope() as any);
    const newbie = (result.gameState as any).roster.find((m: any) => m.id === 'r1');
    expect(newbie.civilization).toBe('DeQuoc');
  });

  it('migrates v8→v9: remaps Saharan to ThienLu', () => {
    const result = migrateSave(makeV7Envelope() as any);
    const vet = (result.gameState as any).roster.find((m: any) => m.id === 'r2');
    expect(vet.civilization).toBe('ThienLu');
  });

  // v23→v24: tavern rewrite — old availableMercenaries are wiped and replaced with the new
  // recruitment-hub shape. Phase 02 will respawn currentRoster on next day-tick.
  it('migrates v23→v24: tavern reshape — currentRoster empty, new fields initialized', () => {
    const result = migrateSave(makeV7Envelope() as any);
    const tavern = (result.gameState as any).tavern;
    expect(tavern.availableMercenaries).toBeUndefined();
    expect(tavern.currentRoster).toEqual([]);
    expect(tavern.mercContracts).toEqual([]);
    expect(tavern.pendingPrompts).toEqual([]);
    expect(tavern.level).toBe(1);
    expect(tavern.keeperId).toBeNull();
    expect(tavern.reputation).toBe(0);
    expect(tavern.factionBias).toBeNull();
    expect(tavern.globalNegotiationDebuffUntilDay).toBeNull();
  });

  it('migrates v23→v24: legacy members get rarity=1 and traits=[]', () => {
    const result = migrateSave(makeV7Envelope() as any);
    const founder = (result.gameState as any).founder;
    expect(founder.rarity).toBe(1);
    expect(founder.traits).toEqual([]);
    const newbie = (result.gameState as any).roster.find((m: any) => m.id === 'r1');
    expect(newbie.rarity).toBe(1);
    expect(newbie.traits).toEqual([]);
  });

  // v24→v25: Phase 04 backfill — `tavern.veteranPool: []` for in-flight v24 saves
  // that predate the field. Without this, day-tick crashes on `.length` of undefined.
  it('migrates v24→v25: backfills tavern.veteranPool=[] when missing', () => {
    const v24Envelope = {
      version: 24,
      savedAt: Date.now(),
      metadata: { slotId: 1, guildName: 'Test', guildLevel: 1, playTimeMs: 0, founderName: 'F', createdAt: 0, updatedAt: 0 },
      gameState: {
        gameTime: 0, realTimeLastTick: 0, guildName: 'Test', guildLevel: 1, gold: 100,
        guildHall: { level: 1, floorTiles: [{ x: 0, z: 0, color: '#DAA520' }], furniture: [] },
        settings: { musicVolume: 0.5, sfxVolume: 0.7, autoSkillDefault: true, graphicsQuality: 'high', shadowsEnabled: false, bloomEnabled: false, bloomThreshold: 0.85 },
        founder: null, roster: [], activeMissions: [], completedMissions: [],
        tutorialStep: 'complete',
        // veteranPool intentionally absent — pre-Phase-04 v24 shape.
        tavern: {
          level: 1, keeperId: null, reputation: 0, currentRoster: [], rerolledToday: false,
          factionBias: null, rumor: null, mercContracts: [], pendingPrompts: [],
          lastDayProcessed: 0, reputationLastTickWeek: 0, globalNegotiationDebuffUntilDay: null,
        },
        inventory: { items: {} }, facilities: [],
      },
    };
    const result = migrateSave(v24Envelope as any);
    expect(result.version).toBe(SAVE_VERSION);
    expect((result.gameState as any).tavern.veteranPool).toEqual([]);
  });

  it('migrates v24→v25: preserves existing veteranPool entries', () => {
    const existingPool = [
      { contractId: 'merc-old-1', visitorSnapshot: { id: 'v1' }, relationshipPoints: 7, addedDay: 1 },
    ];
    const v24Envelope = {
      version: 24,
      savedAt: Date.now(),
      metadata: { slotId: 1, guildName: 'Test', guildLevel: 1, playTimeMs: 0, founderName: 'F', createdAt: 0, updatedAt: 0 },
      gameState: {
        gameTime: 0, realTimeLastTick: 0, guildName: 'Test', guildLevel: 1, gold: 100,
        guildHall: { level: 1, floorTiles: [{ x: 0, z: 0, color: '#DAA520' }], furniture: [] },
        settings: { musicVolume: 0.5, sfxVolume: 0.7, autoSkillDefault: true, graphicsQuality: 'high', shadowsEnabled: false, bloomEnabled: false, bloomThreshold: 0.85 },
        founder: null, roster: [], activeMissions: [], completedMissions: [],
        tutorialStep: 'complete',
        tavern: {
          level: 1, keeperId: null, reputation: 0, currentRoster: [], rerolledToday: false,
          factionBias: null, rumor: null, mercContracts: [], pendingPrompts: [],
          lastDayProcessed: 0, reputationLastTickWeek: 0, globalNegotiationDebuffUntilDay: null,
          veteranPool: existingPool,
        },
        inventory: { items: {} }, facilities: [],
      },
    };
    const result = migrateSave(v24Envelope as any);
    const pool = (result.gameState as any).tavern.veteranPool;
    expect(pool).toHaveLength(1);
    expect(pool[0].contractId).toBe('merc-old-1');
    expect(pool[0].relationshipPoints).toBe(7);
    expect(pool[0].addedDay).toBe(1);
    expect(pool[0].visitorSnapshot.id).toBe('v1');
    // v26→v27 additionally backfills name + gender onto the embedded snapshot.
    expect(pool[0].visitorSnapshot.gender).toBeDefined();
    expect(typeof pool[0].visitorSnapshot.name).toBe('string');
  });

  it('migrates v11→v12+: old tutorial steps remapped to complete', () => {
    const v11Envelope = {
      ...makeV7Envelope({ tutorialStep: 'first-build' }),
      version: 11,
    };
    const result = migrateSave(v11Envelope as any);
    expect(result.version).toBe(SAVE_VERSION); // chain now goes v11→v12→v13→v14→v15→v16
    expect((result.gameState as any).tutorialStep).toBe('complete');
  });

  it('migrates v13→v14: adds craftSkills to members', () => {
    const v13Envelope = {
      version: 13,
      savedAt: Date.now(),
      metadata: { slotId: 1, guildName: 'Test', guildLevel: 1, playTimeMs: 0, founderName: 'F', createdAt: 0, updatedAt: 0 },
      gameState: {
        gameTime: 0, realTimeLastTick: 0, guildName: 'Test', guildLevel: 1, gold: 100,
        guildHall: { level: 1, floorTiles: [{ x: 0, z: 0, color: '#DAA520' }], furniture: [] },
        settings: { musicVolume: 0.5, sfxVolume: 0.7, autoSkillDefault: true },
        founder: { id: 'f1', name: 'Founder', level: 5, exp: 0, stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 }, unallocatedPoints: 0, skill: null, status: 'idle', injuredUntil: null, civilization: 'LinhSon', isFounder: true, rank: 'COMMANDER', missionsCompleted: 0 },
        roster: [],
        activeMissions: [], completedMissions: [], tutorialStep: 'complete',
        tavern: { lastRefreshTime: 0, availableMercenaries: [] },
        inventory: { items: {} },
        facilities: [
          { type: 'tavern',       level: 1, assignedMemberIds: [], placedSlot: 0 },
          { type: 'logging-site', level: 1, assignedMemberIds: [], placedSlot: 1 },
        ],
      },
    };
    const result = migrateSave(v13Envelope as any);
    expect(result.version).toBe(SAVE_VERSION);
    expect((result.gameState as any).founder.craftSkills).toEqual({
      woodcutting: { level: 0, xpAccumulated: 0 },
      mining: { level: 0, xpAccumulated: 0 },
      alchemy: { level: 0, xpAccumulated: 0 },
    });
    const loggingSite = (result.gameState as any).facilities.find((f: any) => f.type === 'logging-site');
    expect(loggingSite.woodReserve).toBe(1000);
    const tavern = (result.gameState as any).facilities.find((f: any) => f.type === 'tavern');
    expect(tavern.woodReserve).toBe(null);
  });

  it('migrates v11→v12: valid steps pass through unchanged', () => {
    const v11Envelope = {
      ...makeV7Envelope({ tutorialStep: 'complete' }),
      version: 11,
    };
    const result = migrateSave(v11Envelope as any);
    expect((result.gameState as any).tutorialStep).toBe('complete');
  });

  it('migrates v22→v23: legacy equipment gets slots:[] and maxSlots:4; workshop gets queue/blueprints arrays', () => {
    const v22Envelope = {
      version: 22,
      savedAt: Date.now(),
      metadata: { slotId: 1, guildName: 'Test', guildLevel: 1, playTimeMs: 0, founderName: 'F', createdAt: 0, updatedAt: 0 },
      gameState: {
        gameTime: 0, realTimeLastTick: 0, guildName: 'Test', guildLevel: 1, gold: 100,
        guildHall: { level: 1, floorTiles: [{ x: 0, z: 0, color: '#DAA520' }], furniture: [] },
        settings: { musicVolume: 0.5, sfxVolume: 0.7, autoSkillDefault: true, graphicsQuality: 'high', shadowsEnabled: false, bloomEnabled: false, bloomThreshold: 0.85 },
        founder: {
          id: 'f1', name: 'Founder', level: 5, exp: 0,
          stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
          unallocatedPoints: 0, skill: null, status: 'idle', injuredUntil: null,
          civilization: 'LinhSon', isFounder: true, rank: 'COMMANDER', missionsCompleted: 0,
          craftSkills: { woodcutting: { level: 0, xpAccumulated: 0 }, mining: { level: 0, xpAccumulated: 0 }, alchemy: { level: 0, xpAccumulated: 0 } },
          equipment: { weapon: { id: 'eq-equipped', templateId: 'WOODEN_AXE', durability: 50 }, armor: null },
          medicineSlots: [{ itemId: null, condition: 'start' }, { itemId: null, condition: 'start' }],
        },
        roster: [],
        activeMissions: [], completedMissions: [], tutorialStep: 'complete',
        tavern: { lastRefreshTime: 0, availableMercenaries: [] },
        inventory: {
          items: {},
          equipmentInventory: [{ id: 'eq-1', templateId: 'STONE_SWORD', durability: 80 }],
        },
        facilities: [
          { id: 'workshop', type: 'workshop', level: 1, assignedMemberIds: [], placedSlot: 4, woodReserve: null },
          { id: 'tavern',   type: 'tavern',   level: 1, assignedMemberIds: [], placedSlot: 8, woodReserve: null },
        ],
      },
    };
    const result = migrateSave(v22Envelope as any);
    expect(result.version).toBe(SAVE_VERSION);

    const eqInv = (result.gameState as any).inventory.equipmentInventory;
    expect(eqInv[0].slots).toEqual([]);
    expect(eqInv[0].maxSlots).toBe(4);

    const equippedWeapon = (result.gameState as any).founder.equipment.weapon;
    expect(equippedWeapon.slots).toEqual([]);
    expect(equippedWeapon.maxSlots).toBe(4);

    const workshop = (result.gameState as any).facilities.find((f: any) => f.type === 'workshop');
    expect(workshop.workshopQueue).toEqual([]);
    expect(workshop.workshopBlueprints).toEqual([]);

    const tavern = (result.gameState as any).facilities.find((f: any) => f.type === 'tavern');
    expect(tavern.workshopQueue).toBeUndefined();
    expect(tavern.workshopBlueprints).toBeUndefined();
  });

  // v25→v26: tutorial redesign — legacy 8-id steps remap forward to the 14-beat flow,
  // the deleted slime mission is stripped, and its members are freed.
  function makeV25Envelope(gameStateOverrides: Record<string, unknown> = {}) {
    return {
      version: 25,
      savedAt: Date.now(),
      metadata: { slotId: 1, guildName: 'Test', guildLevel: 1, playTimeMs: 0, founderName: 'F', createdAt: 0, updatedAt: 0 },
      gameState: {
        gameTime: 0, realTimeLastTick: 0, guildName: 'Test', guildLevel: 1, gold: 100,
        guildHall: { level: 1, floorTiles: [{ x: 0, z: 0, color: '#DAA520' }], furniture: [] },
        settings: { musicVolume: 0.5, sfxVolume: 0.7, autoSkillDefault: true, graphicsQuality: 'high', shadowsEnabled: false, bloomEnabled: false, bloomThreshold: 0.85, atmosphericEnabled: true },
        founder: null, roster: [], activeMissions: [], completedMissions: [],
        tutorialStep: 'complete',
        tavern: {
          level: 1, keeperId: null, reputation: 0, currentRoster: [], rerolledToday: false,
          factionBias: null, rumor: null, mercContracts: [], pendingPrompts: [],
          lastDayProcessed: 0, reputationLastTickWeek: 0, globalNegotiationDebuffUntilDay: null, veteranPool: [],
        },
        inventory: { items: {} }, facilities: [],
        ...gameStateOverrides,
      },
    };
  }

  it('migrates v25→v26: world-board → arrival-alarm', () => {
    const result = migrateSave(makeV25Envelope({ tutorialStep: 'world-board' }) as any);
    expect(result.version).toBe(SAVE_VERSION);
    expect((result.gameState as any).tutorialStep).toBe('arrival-alarm');
  });

  it('migrates v25→v26: complete passes through', () => {
    const result = migrateSave(makeV25Envelope({ tutorialStep: 'complete' }) as any);
    expect((result.gameState as any).tutorialStep).toBe('complete');
  });

  it('migrates v25→v26: unknown legacy step falls back to complete', () => {
    const result = migrateSave(makeV25Envelope({ tutorialStep: 'some-removed-step' }) as any);
    expect((result.gameState as any).tutorialStep).toBe('complete');
  });

  it('migrates v25→v26: mid-combat slime state collapses to open-quest-board, dead mission stripped, member freed', () => {
    const result = migrateSave(
      makeV25Envelope({
        tutorialStep: 'tutorial-quest-active',
        founder: { id: 'f1', name: 'Founder', level: 1, exp: 0, stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 }, unallocatedPoints: 0, skill: null, status: 'on-mission', injuredUntil: null, civilization: 'LinhSon', isFounder: true, rank: 'COMMANDER', missionsCompleted: 0, rarity: 1, traits: [] },
        activeMissions: [
          { missionId: 'tutorial-into-the-clearing', memberIds: ['f1'], mercContractIds: [], startTime: 0, estimatedEndTime: 0, phase: 'in-combat', arrivalTime: 0, targetPriority: 'focus' },
        ],
      }) as any,
    );
    expect(result.version).toBe(SAVE_VERSION);
    expect((result.gameState as any).tutorialStep).toBe('open-quest-board');
    expect((result.gameState as any).activeMissions).toEqual([]);
    expect((result.gameState as any).founder.status).toBe('idle');
  });

  // v27→v28: TavernVisitor gains name + gender. Backfill embedded visitor snapshots
  // (currentRoster + visitorSnapshot inside mercContracts / pendingPrompts / veteranPool).
  function makeV26TavernEnvelope(tavern: Record<string, unknown>) {
    return {
      version: 26,
      savedAt: Date.now(),
      metadata: { slotId: 1, guildName: 'Test', guildLevel: 1, playTimeMs: 0, founderName: 'F', createdAt: 0, updatedAt: 0 },
      gameState: {
        gameTime: 0, realTimeLastTick: 0, guildName: 'Test', guildLevel: 1, gold: 100,
        guildHall: { level: 1, floorTiles: [], furniture: [] }, settings: {},
        founder: null, roster: [], activeMissions: [], completedMissions: [],
        tutorialStep: 'complete', tavern, inventory: { items: {} }, facilities: [],
      },
    };
  }

  const staleVisitor = (id: string, archetype: string) => ({
    id, archetype, civilization: 'LinhSon', rarity: 2, level: 2,
    stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    derivedDemand: 0, dailyMoodBias: 0, traits: [],
    preferredGiftCategory: 'consumable', attemptHistory: [], veteranTag: false, spawnedDay: 0,
    // name + gender intentionally absent (pre-name/gender shape)
  });

  const baseTavern = (extra: Record<string, unknown>) => ({
    level: 1, keeperId: null, reputation: 0, currentRoster: [], rerolledToday: false,
    factionBias: null, rumor: null, mercContracts: [], pendingPrompts: [],
    lastDayProcessed: 0, reputationLastTickWeek: 0, globalNegotiationDebuffUntilDay: null, veteranPool: [],
    ...extra,
  });

  it('migrates tavern visitors: backfills currentRoster gender from archetype + VN name from pool', () => {
    const env = makeV26TavernEnvelope(baseTavern({
      currentRoster: [staleVisitor('tav-1-0', 'scout'), staleVisitor('tav-1-1', 'warrior')],
    }));
    const result = migrateSave(env as any);
    expect(result.version).toBe(SAVE_VERSION);
    const roster = (result.gameState as any).tavern.currentRoster;
    const pool = new Set(CIV_CONFIG.LinhSon.namePool);
    expect(roster[0].gender).toBe('F'); // scout → Ranger
    expect(roster[1].gender).toBe('M'); // warrior → Forester
    for (const v of roster) {
      expect(typeof v.name).toBe('string');
      expect(pool.has(v.name)).toBe(true);
    }
  });

  it('migrates tavern visitors: backfills visitorSnapshot in mercContracts / pendingPrompts / veteranPool', () => {
    const env = makeV26TavernEnvelope(baseTavern({
      mercContracts: [{ id: 'c1', visitorSnapshot: staleVisitor('v-c1', 'warrior'), hireCost: 0, hireDay: 0, questId: null, relationshipPoints: 0, status: 'available' }],
      pendingPrompts: [{ kind: 'reinvite', contractId: 'c1', visitorSnapshot: staleVisitor('v-p1', 'scout'), bonusModifier: 25, createdDay: 0 }],
      veteranPool: [{ contractId: 'c1', visitorSnapshot: staleVisitor('v-vp1', 'scout'), relationshipPoints: 5, addedDay: 0 }],
    }));
    const tavern = (migrateSave(env as any).gameState as any).tavern;
    expect(tavern.mercContracts[0].visitorSnapshot.gender).toBe('M');
    expect(typeof tavern.mercContracts[0].visitorSnapshot.name).toBe('string');
    expect(tavern.pendingPrompts[0].visitorSnapshot.gender).toBe('F');
    expect(tavern.veteranPool[0].visitorSnapshot.gender).toBe('F');
  });

  it('migrates tavern visitors: name backfill is deterministic across runs (hash by id)', () => {
    const make = () => makeV26TavernEnvelope(baseTavern({ currentRoster: [staleVisitor('tav-X-0', 'scout')] }));
    const a = migrateSave(make() as any);
    const b = migrateSave(make() as any);
    expect((a.gameState as any).tavern.currentRoster[0].name).toBe((b.gameState as any).tavern.currentRoster[0].name);
  });

  it('migrates v26→v27: backfills distinct instanceId on same-template parties', () => {
    const envelope = {
      version: 26,
      savedAt: Date.now(),
      metadata: { slotId: 1, guildName: 'Test', guildLevel: 1, playTimeMs: 0, founderName: 'F', createdAt: 0, updatedAt: 0 },
      gameState: {
        gameTime: 0, realTimeLastTick: 0, guildName: 'Test', guildLevel: 1, gold: 100,
        guildHall: { level: 1, floorTiles: [{ x: 0, z: 0, color: '#DAA520' }], furniture: [] },
        settings: { musicVolume: 0.5, sfxVolume: 0.7, autoSkillDefault: true, graphicsQuality: 'high', shadowsEnabled: false, bloomEnabled: false, bloomThreshold: 0.85, atmosphericEnabled: true },
        founder: null, roster: [], completedMissions: [], tutorialStep: 'complete',
        tavern: {
          level: 1, keeperId: null, reputation: 0, currentRoster: [], rerolledToday: false,
          factionBias: null, rumor: null, mercContracts: [], pendingPrompts: [],
          lastDayProcessed: 0, reputationLastTickWeek: 0, globalNegotiationDebuffUntilDay: null, veteranPool: [],
        },
        inventory: { items: {} }, facilities: [],
        activeMissions: [
          { missionId: 'slime-extermination', memberIds: ['a'], mercContractIds: [], startTime: 0, estimatedEndTime: 0, phase: 'arrived', arrivalTime: 0, targetPriority: 'focus' },
          { missionId: 'slime-extermination', memberIds: ['b'], mercContractIds: [], startTime: 0, estimatedEndTime: 0, phase: 'arrived', arrivalTime: 0, targetPriority: 'focus' },
        ],
      },
    };
    const result = migrateSave(envelope as any);
    expect(result.version).toBe(SAVE_VERSION);
    const ams = (result.gameState as any).activeMissions;
    expect(ams).toHaveLength(2);
    expect(typeof ams[0].instanceId).toBe('string');
    expect(ams[0].instanceId).not.toBe('');
    expect(ams[0].instanceId).not.toBe(ams[1].instanceId);
  });

  // v29→v30: infirmary bed/queue recovery model. Converts in-flight injured members from
  // the old deadline-driven model to the progress-driven one and seeds lastSkipDay on the
  // infirmary facility.
  it('migrates v29→v30: injured members get baseRecoveryMs/injuredAt/recoveryProgress + cleared injuredUntil', () => {
    const futureUntil = Date.now() + 120_000;
    const envelope = {
      version: 29,
      savedAt: Date.now(),
      metadata: { slotId: 1, guildName: 'Test', guildLevel: 1, playTimeMs: 0, founderName: 'F', createdAt: 0, updatedAt: 0 },
      gameState: {
        gameTime: 0, realTimeLastTick: 0, guildName: 'Test', guildLevel: 1, gold: 100,
        guildHall: { level: 1, floorTiles: [{ x: 0, z: 0, color: '#DAA520' }], furniture: [] },
        settings: { musicVolume: 0.5, sfxVolume: 0.7, autoSkillDefault: true, graphicsQuality: 'high', shadowsEnabled: false, bloomEnabled: false, bloomThreshold: 0.85, atmosphericEnabled: true },
        founder: null,
        roster: [
          { id: 'hurt', name: 'Hurt', level: 5, exp: 0, stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 }, unallocatedPoints: 0, skill: null, status: 'injured', injuredUntil: futureUntil, civilization: 'LinhSon', isFounder: false, rank: 'MEMBER', missionsCompleted: 0, rarity: 1, traits: [] },
          { id: 'ok',   name: 'Ok',   level: 5, exp: 0, stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 }, unallocatedPoints: 0, skill: null, status: 'idle',     injuredUntil: null,        civilization: 'LinhSon', isFounder: false, rank: 'MEMBER', missionsCompleted: 0, rarity: 1, traits: [] },
        ],
        completedMissions: [], tutorialStep: 'complete',
        tavern: { level: 1, keeperId: null, reputation: 0, currentRoster: [], rerolledToday: false, factionBias: null, rumor: null, mercContracts: [], pendingPrompts: [], lastDayProcessed: 0, reputationLastTickWeek: 0, globalNegotiationDebuffUntilDay: null, veteranPool: [] },
        inventory: { items: {} },
        facilities: [
          { id: 'infirmary', type: 'infirmary', level: 2, assignedMemberIds: [], placedSlot: 0 },
        ],
        activeMissions: [],
      },
    };
    const result = migrateSave(envelope as any);
    expect(result.version).toBe(SAVE_VERSION);

    const roster = (result.gameState as any).roster;
    const hurt = roster.find((m: any) => m.id === 'hurt');
    expect(hurt.injuredUntil).toBeNull();
    expect(typeof hurt.injuredAt).toBe('number');
    expect(typeof hurt.baseRecoveryMs).toBe('number');
    expect(hurt.baseRecoveryMs).toBeGreaterThanOrEqual(30_000); // floor enforced
    expect(hurt.recoveryProgress).toBe(0);

    // Healthy members are untouched.
    const ok = roster.find((m: any) => m.id === 'ok');
    expect(ok.status).toBe('idle');
    expect(ok.injuredAt).toBeUndefined();
    expect(ok.baseRecoveryMs).toBeUndefined();

    // Infirmary gains lastSkipDay (null = never used).
    const infirmary = (result.gameState as any).facilities.find((f: any) => f.id === 'infirmary');
    expect(infirmary.lastSkipDay).toBeNull();
  });

  it('migrates v29→v30: stale injuredUntil floors baseRecoveryMs at 30s (not a negative value)', () => {
    const envelope = {
      version: 29,
      savedAt: Date.now(),
      metadata: { slotId: 1, guildName: 'Test', guildLevel: 1, playTimeMs: 0, founderName: 'F', createdAt: 0, updatedAt: 0 },
      gameState: {
        gameTime: 0, realTimeLastTick: 0, guildName: 'Test', guildLevel: 1, gold: 100,
        guildHall: { level: 1, floorTiles: [{ x: 0, z: 0, color: '#DAA520' }], furniture: [] },
        settings: { musicVolume: 0.5, sfxVolume: 0.7, autoSkillDefault: true, graphicsQuality: 'high', shadowsEnabled: false, bloomEnabled: false, bloomThreshold: 0.85, atmosphericEnabled: true },
        founder: { id: 'f1', name: 'F', level: 5, exp: 0, stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 }, unallocatedPoints: 0, skill: null, status: 'injured', injuredUntil: 0 /* in the past */, civilization: 'LinhSon', isFounder: true, rank: 'COMMANDER', missionsCompleted: 0, rarity: 1, traits: [] },
        roster: [], completedMissions: [], tutorialStep: 'complete',
        tavern: { level: 1, keeperId: null, reputation: 0, currentRoster: [], rerolledToday: false, factionBias: null, rumor: null, mercContracts: [], pendingPrompts: [], lastDayProcessed: 0, reputationLastTickWeek: 0, globalNegotiationDebuffUntilDay: null, veteranPool: [] },
        inventory: { items: {} },
        facilities: [{ id: 'infirmary', type: 'infirmary', level: 0, assignedMemberIds: [], placedSlot: null }],
        activeMissions: [],
      },
    };
    const result = migrateSave(envelope as any);
    const founder = (result.gameState as any).founder;
    expect(founder.baseRecoveryMs).toBe(30_000);
    expect(founder.injuredUntil).toBeNull();
  });

  it('throws for version higher than SAVE_VERSION', () => {
    const futureEnvelope = { ...VALID_SAVE_ENVELOPE, version: 999 };
    expect(() => migrateSave(futureEnvelope)).toThrow(/newer than supported/);
  });

  it('throws for saves older than v7', () => {
    const oldEnvelope = { ...VALID_SAVE_ENVELOPE, version: 6 };
    expect(() => migrateSave(oldEnvelope as any)).toThrow(/older incompatible/);
  });
});
