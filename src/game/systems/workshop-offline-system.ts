/**
 * Workshop Room v2 — offline progression module.
 * Bulk-advances workshop queues over a time delta in O(tasksCompleted) iterations
 * by stepping by min(activeRemaining, timeLeft) instead of one tick per second.
 *
 * Pure: no store access. Caller commits results via store.set().
 * Spec: docs/feature/Room/workshop-room-v2.md §2.1 "Offline: queue chạy bình thường".
 */

import type { ItemID } from '@/game/data/items';
import type { EquipmentItem, GuildFacility, InventoryState } from '@/game/state/game-state';
import type { WorkshopTask } from '@/game/data/workshop-types';
import { getEquipmentTemplate } from '@/game/data/equipment-templates';
import {
  processCraft,
  processEnhanceAdd,
  processEnhanceReroll,
  processRepair,
} from './workshop-system';

type Rng = () => number;

export interface WorkshopOfflineSummary {
  crafted: number;
  enhanced: number;
  repaired: number;
  skipped: number;
}

export interface WorkshopOfflineResult {
  /** Updated facility list — workshop facilities have advanced queues; others untouched. */
  facilities: GuildFacility[];
  /** Aggregate inventory mutation. Negative = consumed, positive = produced (none currently). */
  inventoryDelta: Partial<Record<ItemID, number>>;
  /** Items crafted during the offline window (caller pushes onto equipmentInventory). */
  newEquipment: EquipmentItem[];
  /** Equipment instances modified by enhance/repair, keyed by id. */
  updatedEquipment: Map<string, EquipmentItem>;
  summary: WorkshopOfflineSummary;
}

interface ValidateOk { ok: true; consumed: Partial<Record<ItemID, number>>; }
interface ValidateFail { ok: false; }
type StartValidation = ValidateOk | ValidateFail;

function validateTaskStart(
  task: WorkshopTask,
  inventoryView: (id: ItemID) => number,
): StartValidation {
  switch (task.payload.kind) {
    case 'CRAFT': {
      const tpl = getEquipmentTemplate(task.payload.templateId);
      const need: Partial<Record<ItemID, number>> = {};
      if (tpl.craftMaterial && tpl.craftCost) need[tpl.craftMaterial] = tpl.craftCost;
      if (task.payload.monsterMaterial) {
        need[task.payload.monsterMaterial] = (need[task.payload.monsterMaterial] ?? 0) + 1;
      }
      for (const id of Object.keys(need) as ItemID[]) {
        if (inventoryView(id) < (need[id] ?? 0)) return { ok: false };
      }
      return { ok: true, consumed: need };
    }
    case 'ENHANCE_ADD':
    case 'ENHANCE_REROLL': {
      const mat = task.payload.monsterMaterial;
      if (inventoryView(mat) < 1) return { ok: false };
      return { ok: true, consumed: { [mat]: 1 } };
    }
    case 'REPAIR':
      return { ok: true, consumed: {} };
  }
}

/**
 * Bulk-advance all workshop queues over `elapsedSeconds`. Caller is responsible
 * for the 30-game-day cap (workshop reuses the same wall-clock cap as other
 * offline systems — see use-game-tick-loop.ts).
 *
 * @param facilities current facility list (any non-workshop entries pass through)
 * @param inventory baseline snapshot used for material validation
 * @param getEquipment lookup over inventory + member-equipped instances by id
 * @param elapsedSeconds real-time seconds offline
 * @param gameTime engine clock (ms) at resume — stamped onto newly-started tasks
 * @param rng injectable random source for craft/enhance rolls
 */
export function advanceWorkshopQueues(
  facilities: readonly GuildFacility[],
  inventory: InventoryState,
  getEquipment: (id: string) => EquipmentItem | null,
  elapsedSeconds: number,
  gameTime: number,
  rng: Rng = Math.random,
): WorkshopOfflineResult {
  const inventoryDelta: Partial<Record<ItemID, number>> = {};
  const newEquipment: EquipmentItem[] = [];
  const updatedEquipment = new Map<string, EquipmentItem>();
  const summary: WorkshopOfflineSummary = { crafted: 0, enhanced: 0, repaired: 0, skipped: 0 };

  if (elapsedSeconds <= 0) {
    return { facilities: [...facilities], inventoryDelta, newEquipment, updatedEquipment, summary };
  }

  const inventoryView = (id: ItemID): number =>
    (inventory.items[id] ?? 0) + (inventoryDelta[id] ?? 0);

  // Equipment lookup that prefers our in-flight updates so chained ops on the
  // same instance (e.g. repair → enhance) see the latest version.
  const lookup = (id: string): EquipmentItem | null =>
    updatedEquipment.get(id) ?? getEquipment(id);

  const newFacilities = facilities.map((facility) => {
    if (facility.type !== 'workshop' || facility.level === 0) return facility;
    const queue = facility.workshopQueue ?? [];
    if (queue.length === 0) return facility;
    return {
      ...facility,
      workshopQueue: advanceFacility(
        facility,
        queue,
        elapsedSeconds,
        gameTime,
        rng,
        inventoryView,
        inventoryDelta,
        lookup,
        newEquipment,
        updatedEquipment,
        summary,
      ),
    };
  });

  return { facilities: newFacilities, inventoryDelta, newEquipment, updatedEquipment, summary };
}

function advanceFacility(
  facility: GuildFacility,
  initialQueue: readonly WorkshopTask[],
  elapsedSeconds: number,
  gameTime: number,
  rng: Rng,
  inventoryView: (id: ItemID) => number,
  inventoryDelta: Partial<Record<ItemID, number>>,
  lookup: (id: string) => EquipmentItem | null,
  newEquipment: EquipmentItem[],
  updatedEquipment: Map<string, EquipmentItem>,
  summary: WorkshopOfflineSummary,
): WorkshopTask[] {
  const workerCount = facility.assignedMemberIds.length;
  let queue: WorkshopTask[] = initialQueue.map((t) => ({ ...t }));
  let timeLeft = elapsedSeconds;
  // Tasks proven impossible (missing-mat) within this offline window — won't be retried.
  // Permanent-block invariant: no current task type produces materials (CRAFT/ENHANCE/REPAIR
  // only consume), so once a task fails validation the inventory cannot recover within this
  // call. If a future task type ever produces mats, lift this set into a per-step retry.
  // Diverges from online tickWorkshopQueues which retries each tick.
  const blocked = new Set<string>();

  const tryStartOnePending = (): boolean => {
    for (let i = 0; i < queue.length; i++) {
      const t = queue[i];
      if (t.startedAt !== null) continue;
      if (blocked.has(t.id)) continue;
      const v = validateTaskStart(t, inventoryView);
      if (!v.ok) {
        blocked.add(t.id);
        summary.skipped++;
        // Rotate the skipped task to the back so other pending entries get tried.
        queue.splice(i, 1);
        queue.push(t);
        i--;
        continue;
      }
      for (const [id, qty] of Object.entries(v.consumed) as [ItemID, number][]) {
        if (qty > 0) inventoryDelta[id] = (inventoryDelta[id] ?? 0) - qty;
      }
      queue[i] = { ...t, startedAt: gameTime };
      return true;
    }
    return false;
  };

  const fillSlots = (): void => {
    if (workerCount === 0) return;
    let active = queue.filter((t) => t.startedAt !== null).length;
    while (active < workerCount) {
      if (!tryStartOnePending()) break;
      active++;
    }
  };

  fillSlots();

  // Each non-break loop iteration either completes ≥1 task or exhausts timeLeft,
  // so iterations ≤ initialQueue.length + 1. Pad for paranoia.
  let safety = initialQueue.length + 10;
  while (timeLeft > 0 && safety-- > 0) {
    const activeSlots = queue.filter((t) => t.startedAt !== null);
    if (activeSlots.length === 0) break;

    const minRemaining = Math.min(...activeSlots.map((t) => t.remainingSeconds));
    const step = Math.min(Math.max(0, minRemaining), timeLeft);

    if (step > 0) {
      queue = queue.map((t) =>
        t.startedAt !== null ? { ...t, remainingSeconds: t.remainingSeconds - step } : t,
      );
      timeLeft -= step;
    }

    const next: WorkshopTask[] = [];
    for (const t of queue) {
      if (t.startedAt !== null && t.remainingSeconds <= 0) {
        completeTask(t, lookup, rng, newEquipment, updatedEquipment, summary);
        continue;
      }
      next.push(t);
    }
    queue = next;

    fillSlots();
  }

  return queue;
}

function completeTask(
  task: WorkshopTask,
  lookup: (id: string) => EquipmentItem | null,
  rng: Rng,
  newEquipment: EquipmentItem[],
  updatedEquipment: Map<string, EquipmentItem>,
  summary: WorkshopOfflineSummary,
): void {
  switch (task.payload.kind) {
    case 'CRAFT': {
      const result = processCraft(task.payload, rng);
      newEquipment.push(result.equipment);
      summary.crafted++;
      return;
    }
    case 'ENHANCE_ADD': {
      const eq = lookup(task.payload.equipmentInstanceId);
      if (!eq) return;
      const result = processEnhanceAdd(eq, task.payload.monsterMaterial, rng);
      if ('equipment' in result) {
        updatedEquipment.set(result.equipment.id, result.equipment);
        summary.enhanced++;
      }
      return;
    }
    case 'ENHANCE_REROLL': {
      const eq = lookup(task.payload.equipmentInstanceId);
      if (!eq) return;
      const result = processEnhanceReroll(eq, task.payload.slotIndex, task.payload.monsterMaterial, rng);
      if ('equipment' in result) {
        updatedEquipment.set(result.equipment.id, result.equipment);
        summary.enhanced++;
      }
      return;
    }
    case 'REPAIR': {
      const eq = lookup(task.payload.equipmentInstanceId);
      if (!eq) return;
      const result = processRepair(eq);
      updatedEquipment.set(result.equipment.id, result.equipment);
      summary.repaired++;
      return;
    }
  }
}
