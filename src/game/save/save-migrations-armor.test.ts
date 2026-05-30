/**
 * Save migration v30→v31 tests — armor template remapping.
 * Covers: CLOTH_VEST→BOAR_FUR_COAT, LEATHER_ARMOR→BEAR_COAT
 * for both equipped armor and inventory items, plus idempotence.
 */

import { describe, it, expect } from 'vitest';
import { migrateSave } from './save-migrations';
import type { SaveEnvelope } from './save-types';

/** Build a minimal v30 save envelope for migration testing */
function makeV30Envelope(overrides: Record<string, unknown> = {}) {
  return {
    version: 30,
    savedAt: Date.now(),
    metadata: { slotId: 1, guildName: 'Test', guildLevel: 1, playTimeMs: 0, founderName: 'F', createdAt: 0, updatedAt: 0 },
    gameState: {
      gameTime: 0,
      realTimeLastTick: 0,
      guildName: 'Test',
      guildLevel: 1,
      gold: 100,
      guildHall: {
        level: 1,
        floorTiles: [{ x: 0, z: 0, color: '#DAA520' }],
        furniture: [],
      },
      settings: { musicVolume: 0.5, sfxVolume: 0.7, autoSkillDefault: true },
      founder: {
        id: 'f1',
        name: 'Founder',
        level: 5,
        exp: 0,
        stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
        unallocatedPoints: 0,
        skill: null,
        status: 'idle',
        injuredUntil: null,
        civilization: 'LinhSon',
        isFounder: true,
        rank: 'COMMANDER',
        missionsCompleted: 0,
        rarity: 1,
        traits: [],
        equipment: null,
        medicineSlots: undefined,
      },
      roster: [],
      activeMissions: [],
      completedMissions: [],
      tutorialStep: 'complete',
      tavern: { lastRefreshTime: 0, availableMercenaries: [] },
      inventory: { items: {} },
      facilities: [],
      ...overrides,
    },
  } as unknown as SaveEnvelope;
}

describe('save-migrations: v30→v31 armor remap', () => {
  it('migrates to version 31', () => {
    const result = migrateSave(makeV30Envelope() as any);
    expect(result.version).toBe(31);
  });

  describe('equipped armor remapping', () => {
    it('remaps equipped CLOTH_VEST → BOAR_FUR_COAT', () => {
      const envelope = makeV30Envelope({
        founder: {
          id: 'f1',
          name: 'Founder',
          level: 5,
          exp: 0,
          stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
          unallocatedPoints: 0,
          skill: null,
          status: 'idle',
          injuredUntil: null,
          civilization: 'LinhSon',
          isFounder: true,
          rank: 'COMMANDER',
          missionsCompleted: 0,
          rarity: 1,
          traits: [],
          equipment: {
            weapon: null,
            armor: {
              id: 'a1',
              templateId: 'CLOTH_VEST',
              durability: 30,
              slots: [],
              maxSlots: 4,
            },
          },
          medicineSlots: undefined,
        },
      });

      const result = migrateSave(envelope as any);
      const founder = (result.gameState as any).founder;
      expect(founder.equipment.armor.templateId).toBe('BOAR_FUR_COAT');
    });

    it('remaps equipped LEATHER_ARMOR → BEAR_COAT', () => {
      const envelope = makeV30Envelope({
        founder: {
          id: 'f1',
          name: 'Founder',
          level: 5,
          exp: 0,
          stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
          unallocatedPoints: 0,
          skill: null,
          status: 'idle',
          injuredUntil: null,
          civilization: 'LinhSon',
          isFounder: true,
          rank: 'COMMANDER',
          missionsCompleted: 0,
          rarity: 1,
          traits: [],
          equipment: {
            weapon: null,
            armor: {
              id: 'a2',
              templateId: 'LEATHER_ARMOR',
              durability: 40,
              slots: [],
              maxSlots: 4,
            },
          },
          medicineSlots: undefined,
        },
      });

      const result = migrateSave(envelope as any);
      const founder = (result.gameState as any).founder;
      expect(founder.equipment.armor.templateId).toBe('BEAR_COAT');
    });

    it('preserves armor durability and slots after remap', () => {
      const envelope = makeV30Envelope({
        founder: {
          id: 'f1',
          name: 'Founder',
          level: 5,
          exp: 0,
          stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
          unallocatedPoints: 0,
          skill: null,
          status: 'idle',
          injuredUntil: null,
          civilization: 'LinhSon',
          isFounder: true,
          rank: 'COMMANDER',
          missionsCompleted: 0,
          rarity: 1,
          traits: [],
          equipment: {
            weapon: null,
            armor: {
              id: 'a1',
              templateId: 'CLOTH_VEST',
              durability: 25,
              slots: [{ category: 'TANKY', statKey: 'HP', value: 100 }],
              maxSlots: 4,
            },
          },
          medicineSlots: undefined,
        },
      });

      const result = migrateSave(envelope as any);
      const armor = (result.gameState as any).founder.equipment.armor;
      expect(armor.durability).toBe(25);
      expect(armor.slots).toHaveLength(1);
      expect(armor.slots[0].value).toBe(100);
    });

    it('does not remap other armor templates', () => {
      const envelope = makeV30Envelope({
        founder: {
          id: 'f1',
          name: 'Founder',
          level: 5,
          exp: 0,
          stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
          unallocatedPoints: 0,
          skill: null,
          status: 'idle',
          injuredUntil: null,
          civilization: 'LinhSon',
          isFounder: true,
          rank: 'COMMANDER',
          missionsCompleted: 0,
          rarity: 1,
          traits: [],
          equipment: {
            weapon: null,
            armor: {
              id: 'a3',
              templateId: 'BOAR_FUR_COAT', // Already new
              durability: 30,
              slots: [],
              maxSlots: 4,
            },
          },
          medicineSlots: undefined,
        },
      });

      const result = migrateSave(envelope as any);
      const founder = (result.gameState as any).founder;
      expect(founder.equipment.armor.templateId).toBe('BOAR_FUR_COAT');
    });

    it('leaves equipment unchanged if armor is null', () => {
      const envelope = makeV30Envelope({
        founder: {
          id: 'f1',
          name: 'Founder',
          level: 5,
          exp: 0,
          stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
          unallocatedPoints: 0,
          skill: null,
          status: 'idle',
          injuredUntil: null,
          civilization: 'LinhSon',
          isFounder: true,
          rank: 'COMMANDER',
          missionsCompleted: 0,
          rarity: 1,
          traits: [],
          equipment: {
            weapon: { id: 'w1', templateId: 'WOODEN_AXE', durability: 50, slots: [], maxSlots: 4 },
            armor: null,
          },
          medicineSlots: undefined,
        },
      });

      const result = migrateSave(envelope as any);
      const founder = (result.gameState as any).founder;
      expect(founder.equipment.armor).toBeNull();
    });

    it('leaves equipment unchanged if equipment is null', () => {
      const envelope = makeV30Envelope();

      const result = migrateSave(envelope as any);
      const founder = (result.gameState as any).founder;
      expect(founder.equipment).toBeNull();
    });
  });

  describe('roster equipped armor remapping', () => {
    it('remaps CLOTH_VEST in roster members', () => {
      const envelope = makeV30Envelope({
        roster: [
          {
            id: 'r1',
            name: 'Member1',
            level: 3,
            exp: 0,
            stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
            unallocatedPoints: 0,
            skill: null,
            status: 'idle',
            injuredUntil: null,
            civilization: 'LinhSon',
            isFounder: false,
            rank: 'MEMBER',
            missionsCompleted: 0,
            rarity: 1,
            traits: [],
            equipment: {
              weapon: null,
              armor: {
                id: 'a1',
                templateId: 'CLOTH_VEST',
                durability: 30,
                slots: [],
                maxSlots: 4,
              },
            },
            medicineSlots: undefined,
          },
        ],
      });

      const result = migrateSave(envelope as any);
      const member = (result.gameState as any).roster[0];
      expect(member.equipment.armor.templateId).toBe('BOAR_FUR_COAT');
    });

    it('remaps multiple roster members independently', () => {
      const envelope = makeV30Envelope({
        roster: [
          {
            id: 'r1',
            name: 'Member1',
            level: 3,
            exp: 0,
            stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
            unallocatedPoints: 0,
            skill: null,
            status: 'idle',
            injuredUntil: null,
            civilization: 'LinhSon',
            isFounder: false,
            rank: 'MEMBER',
            missionsCompleted: 0,
            rarity: 1,
            traits: [],
            equipment: {
              weapon: null,
              armor: { id: 'a1', templateId: 'CLOTH_VEST', durability: 30, slots: [], maxSlots: 4 },
            },
            medicineSlots: undefined,
          },
          {
            id: 'r2',
            name: 'Member2',
            level: 4,
            exp: 0,
            stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
            unallocatedPoints: 0,
            skill: null,
            status: 'idle',
            injuredUntil: null,
            civilization: 'LinhSon',
            isFounder: false,
            rank: 'MEMBER',
            missionsCompleted: 0,
            rarity: 1,
            traits: [],
            equipment: {
              weapon: null,
              armor: { id: 'a2', templateId: 'LEATHER_ARMOR', durability: 40, slots: [], maxSlots: 4 },
            },
            medicineSlots: undefined,
          },
        ],
      });

      const result = migrateSave(envelope as any);
      const roster = (result.gameState as any).roster;
      expect(roster[0].equipment.armor.templateId).toBe('BOAR_FUR_COAT');
      expect(roster[1].equipment.armor.templateId).toBe('BEAR_COAT');
    });
  });

  describe('inventory equipment remapping', () => {
    it('remaps CLOTH_VEST in equipment inventory', () => {
      const envelope = makeV30Envelope({
        inventory: {
          items: {},
          equipmentInventory: [
            {
              id: 'ei1',
              templateId: 'CLOTH_VEST',
              durability: 30,
              slots: [],
              maxSlots: 4,
            },
          ],
        },
      });

      const result = migrateSave(envelope as any);
      const inventory = (result.gameState as any).inventory;
      expect(inventory.equipmentInventory[0].templateId).toBe('BOAR_FUR_COAT');
    });

    it('remaps LEATHER_ARMOR in equipment inventory', () => {
      const envelope = makeV30Envelope({
        inventory: {
          items: {},
          equipmentInventory: [
            {
              id: 'ei2',
              templateId: 'LEATHER_ARMOR',
              durability: 40,
              slots: [],
              maxSlots: 4,
            },
          ],
        },
      });

      const result = migrateSave(envelope as any);
      const inventory = (result.gameState as any).inventory;
      expect(inventory.equipmentInventory[0].templateId).toBe('BEAR_COAT');
    });

    it('remaps multiple equipment items in inventory', () => {
      const envelope = makeV30Envelope({
        inventory: {
          items: {},
          equipmentInventory: [
            { id: 'ei1', templateId: 'CLOTH_VEST', durability: 30, slots: [], maxSlots: 4 },
            { id: 'ei2', templateId: 'LEATHER_ARMOR', durability: 40, slots: [], maxSlots: 4 },
            { id: 'ei3', templateId: 'WOODEN_AXE', durability: 50, slots: [], maxSlots: 4 }, // Not remapped
          ],
        },
      });

      const result = migrateSave(envelope as any);
      const inventory = (result.gameState as any).inventory;
      expect(inventory.equipmentInventory[0].templateId).toBe('BOAR_FUR_COAT');
      expect(inventory.equipmentInventory[1].templateId).toBe('BEAR_COAT');
      expect(inventory.equipmentInventory[2].templateId).toBe('WOODEN_AXE');
    });

    it('skips undefined equipmentInventory gracefully', () => {
      const envelope = makeV30Envelope({
        inventory: { items: {} },
      });

      const result = migrateSave(envelope as any);
      const inventory = (result.gameState as any).inventory;
      expect(inventory.equipmentInventory).toBeUndefined();
    });
  });

  describe('idempotence and re-run safety', () => {
    it('does not double-remap on re-run (idempotent)', () => {
      const envelope = makeV30Envelope({
        founder: {
          id: 'f1',
          name: 'Founder',
          level: 5,
          exp: 0,
          stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
          unallocatedPoints: 0,
          skill: null,
          status: 'idle',
          injuredUntil: null,
          civilization: 'LinhSon',
          isFounder: true,
          rank: 'COMMANDER',
          missionsCompleted: 0,
          rarity: 1,
          traits: [],
          equipment: {
            weapon: null,
            armor: {
              id: 'a1',
              templateId: 'CLOTH_VEST',
              durability: 30,
              slots: [],
              maxSlots: 4,
            },
          },
          medicineSlots: undefined,
        },
      });

      // First migration: v30 → v31
      const result1 = migrateSave(envelope as any);
      expect((result1.gameState as any).founder.equipment.armor.templateId).toBe('BOAR_FUR_COAT');

      // Re-run migration on already-migrated save
      const result2 = migrateSave(result1);
      // Should stay at v31 and keep BOAR_FUR_COAT (no double remap to something else)
      expect(result2.version).toBe(31);
      expect((result2.gameState as any).founder.equipment.armor.templateId).toBe('BOAR_FUR_COAT');
    });

    it('already-remapped BOAR_FUR_COAT stays unchanged', () => {
      const envelope = makeV30Envelope({
        founder: {
          id: 'f1',
          name: 'Founder',
          level: 5,
          exp: 0,
          stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
          unallocatedPoints: 0,
          skill: null,
          status: 'idle',
          injuredUntil: null,
          civilization: 'LinhSon',
          isFounder: true,
          rank: 'COMMANDER',
          missionsCompleted: 0,
          rarity: 1,
          traits: [],
          equipment: {
            weapon: null,
            armor: {
              id: 'a1',
              templateId: 'BOAR_FUR_COAT', // Already new template
              durability: 30,
              slots: [],
              maxSlots: 4,
            },
          },
          medicineSlots: undefined,
        },
      });

      const result = migrateSave(envelope as any);
      const armor = (result.gameState as any).founder.equipment.armor;
      expect(armor.templateId).toBe('BOAR_FUR_COAT'); // Unchanged
      expect(armor.durability).toBe(30);
    });
  });

  describe('full integration: equipped + inventory + roster', () => {
    it('remaps all sources together', () => {
      const envelope = makeV30Envelope({
        founder: {
          id: 'f1',
          name: 'Founder',
          level: 5,
          exp: 0,
          stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
          unallocatedPoints: 0,
          skill: null,
          status: 'idle',
          injuredUntil: null,
          civilization: 'LinhSon',
          isFounder: true,
          rank: 'COMMANDER',
          missionsCompleted: 0,
          rarity: 1,
          traits: [],
          equipment: {
            weapon: null,
            armor: { id: 'a1', templateId: 'CLOTH_VEST', durability: 30, slots: [], maxSlots: 4 },
          },
          medicineSlots: undefined,
        },
        roster: [
          {
            id: 'r1',
            name: 'Member',
            level: 3,
            exp: 0,
            stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
            unallocatedPoints: 0,
            skill: null,
            status: 'idle',
            injuredUntil: null,
            civilization: 'LinhSon',
            isFounder: false,
            rank: 'MEMBER',
            missionsCompleted: 0,
            rarity: 1,
            traits: [],
            equipment: {
              weapon: null,
              armor: { id: 'a2', templateId: 'LEATHER_ARMOR', durability: 40, slots: [], maxSlots: 4 },
            },
            medicineSlots: undefined,
          },
        ],
        inventory: {
          items: {},
          equipmentInventory: [
            { id: 'ei1', templateId: 'CLOTH_VEST', durability: 25, slots: [], maxSlots: 4 },
          ],
        },
      });

      const result = migrateSave(envelope as any);
      const gs = result.gameState as any;

      expect(gs.founder.equipment.armor.templateId).toBe('BOAR_FUR_COAT');
      expect(gs.roster[0].equipment.armor.templateId).toBe('BEAR_COAT');
      expect(gs.inventory.equipmentInventory[0].templateId).toBe('BOAR_FUR_COAT');
      expect(result.version).toBe(31);
    });
  });
});
