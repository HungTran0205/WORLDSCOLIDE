import { describe, it, expect } from 'vitest';
import { migrateSave } from './save-migrations';
import { VALID_SAVE_ENVELOPE } from './test-fixtures';
import { SAVE_VERSION } from './save-types';

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

  it('migrates v7 → v8: tavern mercenaries also migrated', () => {
    const result = migrateSave(makeV7Envelope() as any);
    const tavMerc = (result.gameState as any).tavern.availableMercenaries[0];
    expect(tavMerc.rank).toBe('MERCENARY');
    expect(tavMerc.missionsCompleted).toBe(4); // level 2 * 2
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

  it('migrates v8→v9: tavern mercenaries also remapped', () => {
    const result = migrateSave(makeV7Envelope() as any);
    const tavMerc = (result.gameState as any).tavern.availableMercenaries[0];
    expect(tavMerc.civilization).toBe('DeQuoc');
  });

  it('migrates v11→v12+: old tutorial steps remapped to complete', () => {
    const v11Envelope = {
      ...makeV7Envelope({ tutorialStep: 'first-build' }),
      version: 11,
    };
    const result = migrateSave(v11Envelope as any);
    expect(result.version).toBe(16); // chain now goes v11→v12→v13→v14→v15→v16
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
    expect(result.version).toBe(16);
    expect((result.gameState as any).founder.craftSkills).toEqual({
      woodcutting: { level: 0, xpAccumulated: 0 },
      mining: { level: 0, xpAccumulated: 0 },
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

  it('throws for version higher than SAVE_VERSION', () => {
    const futureEnvelope = { ...VALID_SAVE_ENVELOPE, version: 999 };
    expect(() => migrateSave(futureEnvelope)).toThrow(/newer than supported/);
  });

  it('throws for saves older than v7', () => {
    const oldEnvelope = { ...VALID_SAVE_ENVELOPE, version: 6 };
    expect(() => migrateSave(oldEnvelope as any)).toThrow(/older incompatible/);
  });
});
