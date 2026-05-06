/**
 * Workshop slice integration — exercises action wiring against the real store
 * (slices composed via `useGameStore`). Pure-function correctness already
 * covered in `workshop-system.test.ts`; here we verify state transitions:
 *  - addWorkshopTask / cancelWorkshopTask
 *  - saveBlueprint / enqueueBlueprint / deleteBlueprint
 *  - tickWorkshopQueues (full craft cycle, mat consumption)
 *  - dismantleEquipment (instant)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, resetGameState } from './store';
import type { EquipmentItem, GuildFacility } from './game-state';

const WORKSHOP_ID = 'workshop';

function setupWorkshop(opts: { workers?: number; wood?: number; equipment?: EquipmentItem[] } = {}) {
  resetGameState();
  const { workers = 1, wood = 1000, equipment = [] } = opts;

  useGameStore.setState((s) => ({
    facilities: s.facilities.map((f) =>
      f.id === WORKSHOP_ID
        ? {
            ...f,
            level: 1,
            placedSlot: 4,
            assignedMemberIds: Array.from({ length: workers }, (_, i) => `m${i + 1}`),
            workshopQueue: [],
            workshopBlueprints: [],
          }
        : f,
    ),
    inventory: { items: { WOOD: wood }, equipmentInventory: equipment },
    gameTime: 0,
  }));
}

function getWorkshop(): GuildFacility {
  const f = useGameStore.getState().facilities.find((x) => x.id === WORKSHOP_ID);
  if (!f) throw new Error('workshop missing');
  return f;
}

// ─── addWorkshopTask / cancelWorkshopTask ─────────────────────────────────

describe('addWorkshopTask', () => {
  beforeEach(() => setupWorkshop());

  it('appends a CRAFT task to the queue', () => {
    const ok = useGameStore.getState().addWorkshopTask(WORKSHOP_ID, {
      kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE',
    });
    expect(ok).toBe(true);
    const q = getWorkshop().workshopQueue ?? [];
    expect(q).toHaveLength(1);
    expect(q[0].type).toBe('CRAFT');
    expect(q[0].totalSeconds).toBe(30); // T1 craft
    expect(q[0].startedAt).toBeNull();
  });

  it('rejects when facility is locked (level 0)', () => {
    useGameStore.setState((s) => ({
      facilities: s.facilities.map((f) => f.id === WORKSHOP_ID ? { ...f, level: 0 } : f),
    }));
    const ok = useGameStore.getState().addWorkshopTask(WORKSHOP_ID, {
      kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE',
    });
    expect(ok).toBe(false);
    expect(getWorkshop().workshopQueue ?? []).toHaveLength(0);
  });
});

describe('cancelWorkshopTask', () => {
  it('removes the named task and leaves siblings intact', () => {
    setupWorkshop();
    const add = useGameStore.getState().addWorkshopTask;
    add(WORKSHOP_ID, { kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE' });
    add(WORKSHOP_ID, { kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE' });
    const queue = getWorkshop().workshopQueue ?? [];
    expect(queue).toHaveLength(2);

    const ok = useGameStore.getState().cancelWorkshopTask(WORKSHOP_ID, queue[0].id);
    expect(ok).toBe(true);
    expect(getWorkshop().workshopQueue?.map((t) => t.id)).toEqual([queue[1].id]);
  });
});

// ─── tickWorkshopQueues — full craft cycle ────────────────────────────────

describe('tickWorkshopQueues — craft cycle', () => {
  beforeEach(() => setupWorkshop({ wood: 100 }));

  it('30 ticks complete a craft → equipment lands in inventory, queue empties, mats consumed', () => {
    const { addWorkshopTask, tickWorkshopQueues } = useGameStore.getState();
    addWorkshopTask(WORKSHOP_ID, { kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE' });

    // First tick activates task (consumes 20 WOOD) and decrements remaining to 29.
    tickWorkshopQueues();
    expect(useGameStore.getState().inventory.items.WOOD).toBe(80);
    const afterStart = getWorkshop().workshopQueue ?? [];
    expect(afterStart[0].startedAt).toBe(0);
    expect(afterStart[0].remainingSeconds).toBe(29);

    // Tick the remaining 29 seconds + completion tick.
    for (let i = 0; i < 29; i++) tickWorkshopQueues();

    expect(getWorkshop().workshopQueue).toEqual([]);
    expect(useGameStore.getState().inventory.equipmentInventory).toHaveLength(1);
    const eq = useGameStore.getState().inventory.equipmentInventory![0];
    expect(eq.templateId).toBe('WOODEN_AXE');
    expect(eq.maxSlots).toBe(4);
    expect(eq.durability).toBe(50);
  });

  it('skips on missing material → task rotates to back, no infinite loop', () => {
    setupWorkshop({ wood: 5 }); // < craftCost (20) → skip
    const { addWorkshopTask, tickWorkshopQueues } = useGameStore.getState();
    addWorkshopTask(WORKSHOP_ID, { kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE' });

    tickWorkshopQueues();
    const q = getWorkshop().workshopQueue ?? [];
    expect(q).toHaveLength(1);
    expect(q[0].startedAt).toBeNull(); // never activated
    expect(useGameStore.getState().inventory.items.WOOD).toBe(5); // unchanged
  });

  it('no-op when no facilities have queued work', () => {
    const before = useGameStore.getState();
    useGameStore.getState().tickWorkshopQueues();
    expect(useGameStore.getState()).toBe(before); // referentially unchanged
  });
});

// ─── Blueprints ───────────────────────────────────────────────────────────

describe('saveBlueprint + enqueueBlueprint', () => {
  beforeEach(() => setupWorkshop({ wood: 1000 }));

  it('saves blueprint, then batch-enqueues 5 craft tasks', () => {
    const { saveBlueprint, enqueueBlueprint } = useGameStore.getState();
    const id = saveBlueprint(WORKSHOP_ID, {
      name: 'Wood Axe x5',
      baseMaterial: 'WOOD',
      templateId: 'WOODEN_AXE',
      quantity: 5,
    });
    expect(id).toBeTruthy();
    expect(getWorkshop().workshopBlueprints).toHaveLength(1);

    const enqueued = enqueueBlueprint(WORKSHOP_ID, id!, 5);
    expect(enqueued).toBe(5);
    expect(getWorkshop().workshopQueue).toHaveLength(5);
    // All tasks reference the source blueprint
    for (const t of getWorkshop().workshopQueue ?? []) {
      expect(t.blueprintId).toBe(id);
    }
  });

  it('respects blueprint slot cap at Lv1 (3 slots)', () => {
    const { saveBlueprint } = useGameStore.getState();
    const ids = [1, 2, 3, 4].map((n) =>
      saveBlueprint(WORKSHOP_ID, {
        name: `bp${n}`, baseMaterial: 'WOOD', templateId: 'WOODEN_AXE', quantity: 1,
      }),
    );
    expect(ids[0]).toBeTruthy();
    expect(ids[1]).toBeTruthy();
    expect(ids[2]).toBeTruthy();
    expect(ids[3]).toBeNull(); // 4th rejected at cap
    expect(getWorkshop().workshopBlueprints).toHaveLength(3);
  });

  it('deleteBlueprint removes and is idempotent on missing id', () => {
    const { saveBlueprint, deleteBlueprint } = useGameStore.getState();
    const id = saveBlueprint(WORKSHOP_ID, {
      name: 'bp', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE', quantity: 1,
    });
    expect(deleteBlueprint(WORKSHOP_ID, id!)).toBe(true);
    expect(deleteBlueprint(WORKSHOP_ID, id!)).toBe(false);
    expect(getWorkshop().workshopBlueprints).toEqual([]);
  });
});

// ─── dismantleEquipment ───────────────────────────────────────────────────

describe('dismantleEquipment', () => {
  it('removes equipment and adds recovered materials atomically', () => {
    const eq: EquipmentItem = {
      id: 'eq-test', templateId: 'WOODEN_AXE', durability: 50, slots: [], maxSlots: 4,
    };
    setupWorkshop({ wood: 0, equipment: [eq] });

    const ok = useGameStore.getState().dismantleEquipment('eq-test');
    expect(ok).toBe(true);
    expect(useGameStore.getState().inventory.equipmentInventory).toEqual([]);
    // Plain item: 70-80% of craftCost (20) → 14..16 wood
    const wood = useGameStore.getState().inventory.items.WOOD ?? 0;
    expect(wood).toBeGreaterThanOrEqual(14);
    expect(wood).toBeLessThanOrEqual(16);
  });

  it('rejects when equipment id not found', () => {
    setupWorkshop();
    const ok = useGameStore.getState().dismantleEquipment('does-not-exist');
    expect(ok).toBe(false);
  });
});
