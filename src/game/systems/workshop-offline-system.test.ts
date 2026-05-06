/**
 * Workshop offline progression — bulk-advance algorithm tests.
 * Covers: full queue completion, stuck-queue (missing-mat), no-worker stall,
 * multi-facility isolation, enhance/repair equipment threading.
 */

import { describe, it, expect } from 'vitest';
import type { EquipmentItem, GuildFacility, InventoryState } from '@/game/state/game-state';
import type { WorkshopTask } from '@/game/data/workshop-types';
import { advanceWorkshopQueues } from './workshop-offline-system';

const fixedRng = (v: number) => () => v;

function craftTask(id: string, opts: Partial<{ remaining: number; total: number; startedAt: number | null; monsterMaterial: 'SLIME_GEL' }> = {}): WorkshopTask {
  return {
    id,
    type: 'CRAFT',
    payload: {
      kind: 'CRAFT',
      baseMaterial: 'WOOD',
      templateId: 'WOODEN_AXE',
      ...(opts.monsterMaterial ? { monsterMaterial: opts.monsterMaterial } : {}),
    },
    remainingSeconds: opts.remaining ?? 30,
    totalSeconds: opts.total ?? 30,
    startedAt: opts.startedAt ?? null,
  };
}

function workshopFacility(opts: Partial<GuildFacility> & { workshopQueue?: WorkshopTask[] }): GuildFacility {
  return {
    id: opts.id ?? 'workshop',
    type: 'workshop',
    level: opts.level ?? 1,
    assignedMemberIds: opts.assignedMemberIds ?? [],
    placedSlot: opts.placedSlot ?? 0,
    woodReserve: null,
    workshopQueue: opts.workshopQueue ?? [],
  };
}

const emptyLookup = (): EquipmentItem | null => null;

// ── Bulk advance: empty/no-op cases ───────────────────────────────────────

describe('advanceWorkshopQueues — no-op cases', () => {
  it('returns input untouched when elapsedSeconds <= 0', () => {
    const facilities = [workshopFacility({ workshopQueue: [craftTask('t1')] })];
    const inv: InventoryState = { items: { WOOD: 1000 } };
    const r = advanceWorkshopQueues(facilities, inv, emptyLookup, 0, 0, fixedRng(0.5));
    expect(r.summary).toEqual({ crafted: 0, enhanced: 0, repaired: 0, skipped: 0 });
    expect(r.newEquipment).toEqual([]);
  });

  it('skips facilities with empty queue', () => {
    const facilities = [workshopFacility({ workshopQueue: [] })];
    const inv: InventoryState = { items: { WOOD: 1000 } };
    const r = advanceWorkshopQueues(facilities, inv, emptyLookup, 3600, 0, fixedRng(0.5));
    expect(r.summary.crafted).toBe(0);
  });

  it('skips workshops at level 0', () => {
    const facilities = [workshopFacility({ level: 0, assignedMemberIds: ['m1'], workshopQueue: [craftTask('t1')] })];
    const inv: InventoryState = { items: { WOOD: 1000 } };
    const r = advanceWorkshopQueues(facilities, inv, emptyLookup, 3600, 0, fixedRng(0.5));
    expect(r.summary.crafted).toBe(0);
  });
});

// ── Bulk advance: completion math ─────────────────────────────────────────

describe('advanceWorkshopQueues — bulk completion', () => {
  it('1 worker + 10 tasks T1 (30s) over 600s → 10 crafted, queue empty', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => craftTask(`t${i}`));
    const facilities = [workshopFacility({
      assignedMemberIds: ['m1'],
      workshopQueue: tasks,
    })];
    // 10 tasks × 20 wood = 200 wood needed
    const inv: InventoryState = { items: { WOOD: 200 } };

    const r = advanceWorkshopQueues(facilities, inv, emptyLookup, 600, 0, fixedRng(0.5));

    expect(r.summary.crafted).toBe(10);
    expect(r.newEquipment).toHaveLength(10);
    expect(r.facilities[0].workshopQueue).toEqual([]);
    expect(r.inventoryDelta.WOOD).toBe(-200);
  });

  it('1 worker + T1 queue, 1h offline → 120 crafts (3600/30)', () => {
    // 200 tasks queued (more than enough), 4000 wood available (200*20)
    const tasks = Array.from({ length: 200 }, (_, i) => craftTask(`t${i}`));
    const facilities = [workshopFacility({
      assignedMemberIds: ['m1'],
      workshopQueue: tasks,
    })];
    const inv: InventoryState = { items: { WOOD: 4000 } };

    const r = advanceWorkshopQueues(facilities, inv, emptyLookup, 3600, 0, fixedRng(0.5));

    expect(r.summary.crafted).toBe(120);
    expect(r.facilities[0].workshopQueue).toHaveLength(80); // 200 - 120
    // 120 completed + 1 mid-craft (started, materials consumed, not yet finished)
    expect(r.inventoryDelta.WOOD).toBe(-121 * 20);
    const remaining = r.facilities[0].workshopQueue ?? [];
    expect(remaining.filter((t) => t.startedAt !== null)).toHaveLength(1);
  });

  it('2 workers + 10 T1 tasks over 60s → both slots active, 4 crafted (2 parallel × 2 cycles)', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => craftTask(`t${i}`));
    const facilities = [workshopFacility({
      assignedMemberIds: ['m1', 'm2'],
      workshopQueue: tasks,
    })];
    const inv: InventoryState = { items: { WOOD: 1000 } };

    const r = advanceWorkshopQueues(facilities, inv, emptyLookup, 60, 0, fixedRng(0.5));

    expect(r.summary.crafted).toBe(4);
    // Remaining 6 tasks: 2 active (started, 30s remaining), 4 still pending
    const remaining = r.facilities[0].workshopQueue ?? [];
    expect(remaining).toHaveLength(6);
    expect(remaining.filter((t) => t.startedAt !== null)).toHaveLength(2);
  });
});

// ── Stuck queue + skip semantics ──────────────────────────────────────────

describe('advanceWorkshopQueues — stuck queue', () => {
  it('material exhaust mid-queue → completes possible, skips rest, no infinite loop', () => {
    // 5 tasks × 20 wood = 100 needed, only 60 → 3 complete, 2 skipped
    const tasks = Array.from({ length: 5 }, (_, i) => craftTask(`t${i}`));
    const facilities = [workshopFacility({
      assignedMemberIds: ['m1'],
      workshopQueue: tasks,
    })];
    const inv: InventoryState = { items: { WOOD: 60 } };

    const r = advanceWorkshopQueues(facilities, inv, emptyLookup, 3600, 0, fixedRng(0.5));

    expect(r.summary.crafted).toBe(3);
    expect(r.summary.skipped).toBe(2);
    expect(r.inventoryDelta.WOOD).toBe(-60);
    // 2 skipped tasks remain pending in queue (rotated to back, never started)
    expect((r.facilities[0].workshopQueue ?? []).filter((t) => t.startedAt === null)).toHaveLength(2);
  });

  it('all tasks blocked from start → no infinite loop, queue intact', () => {
    const tasks = Array.from({ length: 3 }, (_, i) => craftTask(`t${i}`));
    const facilities = [workshopFacility({
      assignedMemberIds: ['m1'],
      workshopQueue: tasks,
    })];
    // Zero wood → every task fails validation
    const inv: InventoryState = { items: {} };

    const r = advanceWorkshopQueues(facilities, inv, emptyLookup, 3600, 0, fixedRng(0.5));

    expect(r.summary.crafted).toBe(0);
    expect(r.summary.skipped).toBe(3);
    expect(r.facilities[0].workshopQueue).toHaveLength(3);
  });
});

// ── Worker count edge cases ───────────────────────────────────────────────

describe('advanceWorkshopQueues — worker semantics', () => {
  it('zero workers + pending tasks → no progress, queue unchanged', () => {
    const tasks = [craftTask('t1')];
    const facilities = [workshopFacility({ assignedMemberIds: [], workshopQueue: tasks })];
    const inv: InventoryState = { items: { WOOD: 1000 } };

    const r = advanceWorkshopQueues(facilities, inv, emptyLookup, 3600, 0, fixedRng(0.5));

    expect(r.summary.crafted).toBe(0);
    expect(r.facilities[0].workshopQueue?.[0].startedAt).toBeNull();
  });

  it('zero workers + already-active task → completes anyway (ticks already-running work)', () => {
    // Edge case: workers were assigned, task started, then unassigned offline.
    // Existing online behavior already lets active tasks finish.
    const tasks = [craftTask('t1', { startedAt: 100, remaining: 20 })];
    const facilities = [workshopFacility({ assignedMemberIds: [], workshopQueue: tasks })];
    const inv: InventoryState = { items: {} }; // no mat needed since task already started

    const r = advanceWorkshopQueues(facilities, inv, emptyLookup, 60, 0, fixedRng(0.5));

    expect(r.summary.crafted).toBe(1);
    expect(r.facilities[0].workshopQueue).toEqual([]);
  });
});

// ── Multi-facility isolation ──────────────────────────────────────────────

describe('advanceWorkshopQueues — multi-facility', () => {
  it('two workshops advance independently, share inventory pool', () => {
    const f1 = workshopFacility({
      id: 'workshop',
      assignedMemberIds: ['m1'],
      workshopQueue: [craftTask('a1'), craftTask('a2')],
    });
    const f2 = workshopFacility({
      id: 'workshop-2',
      assignedMemberIds: ['m2'],
      workshopQueue: [craftTask('b1')],
    });
    // 60 wood = 3 crafts max — first-served wins on shared pool
    const inv: InventoryState = { items: { WOOD: 60 } };

    const r = advanceWorkshopQueues([f1, f2], inv, emptyLookup, 3600, 0, fixedRng(0.5));

    expect(r.summary.crafted).toBe(3);
    expect(r.summary.skipped).toBe(0);
    expect(r.inventoryDelta.WOOD).toBe(-60);
  });

  it('non-workshop facilities pass through unmodified', () => {
    const tavern: GuildFacility = {
      id: 'tavern',
      type: 'tavern',
      level: 1,
      assignedMemberIds: [],
      placedSlot: 0,
      woodReserve: null,
    };
    const ws = workshopFacility({
      assignedMemberIds: ['m1'],
      workshopQueue: [craftTask('t1')],
    });
    const inv: InventoryState = { items: { WOOD: 100 } };

    const r = advanceWorkshopQueues([tavern, ws], inv, emptyLookup, 60, 0, fixedRng(0.5));

    expect(r.facilities[0]).toBe(tavern);
    expect(r.summary.crafted).toBe(1);
  });
});

// ── Enhance / repair equipment threading ──────────────────────────────────

describe('advanceWorkshopQueues — enhance/repair', () => {
  it('REPAIR completes and emits updated equipment', () => {
    const broken: EquipmentItem = {
      id: 'eq1', templateId: 'WOODEN_AXE', durability: 10, slots: [], maxSlots: 4,
    };
    const lookup = (id: string): EquipmentItem | null => (id === 'eq1' ? broken : null);

    const repairTask: WorkshopTask = {
      id: 'r1',
      type: 'REPAIR',
      payload: { kind: 'REPAIR', equipmentInstanceId: 'eq1' },
      remainingSeconds: 60,
      totalSeconds: 60,
      startedAt: null,
    };
    const facilities = [workshopFacility({
      assignedMemberIds: ['m1'],
      workshopQueue: [repairTask],
    })];

    const r = advanceWorkshopQueues(facilities, { items: {} }, lookup, 120, 0, fixedRng(0.5));

    expect(r.summary.repaired).toBe(1);
    const repaired = r.updatedEquipment.get('eq1');
    expect(repaired?.durability).toBe(50); // WOODEN_AXE max durability
  });

  it('ENHANCE_REROLL chained with later op sees updated equipment', () => {
    // Two reroll tasks on same equipment — second sees first's result.
    const eq: EquipmentItem = {
      id: 'eq1', templateId: 'WOODEN_AXE', durability: 50,
      slots: [{ category: 'TANKY', statKey: 'HP', value: 100 }],
      maxSlots: 4,
    };
    const lookup = (id: string): EquipmentItem | null => (id === 'eq1' ? eq : null);

    const t1: WorkshopTask = {
      id: 't1',
      type: 'ENHANCE_REROLL',
      payload: { kind: 'ENHANCE_REROLL', equipmentInstanceId: 'eq1', slotIndex: 0, monsterMaterial: 'SLIME_GEL' },
      remainingSeconds: 30,
      totalSeconds: 30,
      startedAt: null,
    };
    const t2: WorkshopTask = { ...t1, id: 't2' };

    const facilities = [workshopFacility({
      assignedMemberIds: ['m1'],
      workshopQueue: [t1, t2],
    })];
    const inv: InventoryState = { items: { SLIME_GEL: 2 } };

    const r = advanceWorkshopQueues(facilities, inv, lookup, 120, 0, fixedRng(0.5));

    expect(r.summary.enhanced).toBe(2);
    expect(r.inventoryDelta.SLIME_GEL).toBe(-2);
    const final = r.updatedEquipment.get('eq1');
    expect(final?.slots).toHaveLength(1);
    expect(final?.slots?.[0].value).toBe(125); // mid-range of [50,200] for SLIME_GEL
  });
});

// ── Cap protection ────────────────────────────────────────────────────────

describe('advanceWorkshopQueues — cap protection', () => {
  it('30-game-day window (432000s) processes queue without hanging', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => craftTask(`t${i}`));
    const facilities = [workshopFacility({
      assignedMemberIds: ['m1'],
      workshopQueue: tasks,
    })];
    const inv: InventoryState = { items: { WOOD: 100 } };

    const start = performance.now();
    const r = advanceWorkshopQueues(facilities, inv, emptyLookup, 432000, 0, fixedRng(0.5));
    const elapsed = performance.now() - start;

    expect(r.summary.crafted).toBe(5);
    expect(elapsed).toBeLessThan(50); // bulk-advance must be near-instant
  });
});
