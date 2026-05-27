/**
 * Workshop Room v2 — slice-action factory.
 * Wraps pure systems from `workshop-system.ts` into Zustand mutations:
 *  - addWorkshopTask / cancelWorkshopTask
 *  - saveBlueprint / deleteBlueprint / enqueueBlueprint
 *  - dismantleEquipment (instant)
 *  - tickWorkshopQueues (1Hz scheduler with skip-on-missing-mat)
 *
 * Materials consumed at task START (when a worker picks it up), not at queue
 * enqueue — lets users overcommit blueprints and skip rotates pending tasks.
 */

import type { StoreApi } from 'zustand';
import type { ItemID } from '@/game/data/items';
import type {
  WorkshopTask,
  WorkshopTaskPayload,
  WorkshopBlueprint,
  CraftPayload,
} from '@/game/data/workshop-types';
import type { EquipmentItem, GuildFacility, Member, MemberEquipment } from './game-state';
import {
  WORKSHOP_CONFIG,
  getCraftingTime,
  getTierForMaterial,
  getTierForTemplate,
  getRepairTime,
} from '@/game/data/workshop-config';
import {
  processCraft,
  processEnhanceAdd,
  processEnhanceReroll,
  processRepair,
  processDismantle,
} from '@/game/systems/workshop-system';
import { getEquipmentTemplate } from '@/game/data/equipment-templates';
import type { GuildSlice } from './guild-slice';
import type { InventorySlice } from './inventory-slice';
import type { RosterSlice } from './roster-slice';
import type { ClockSlice } from './clock-slice';

type StoreState = GuildSlice & InventorySlice & RosterSlice & ClockSlice;
type Setter = StoreApi<StoreState>['setState'];

export interface WorkshopActions {
  addWorkshopTask: (facilityId: string, payload: WorkshopTaskPayload, blueprintId?: string) => boolean;
  cancelWorkshopTask: (facilityId: string, taskId: string) => boolean;
  saveBlueprint: (facilityId: string, bp: Omit<WorkshopBlueprint, 'id' | 'createdAt'>) => string | null;
  updateBlueprint: (facilityId: string, blueprintId: string, patch: { name?: string; quantity?: number }) => boolean;
  deleteBlueprint: (facilityId: string, blueprintId: string) => boolean;
  enqueueBlueprint: (facilityId: string, blueprintId: string, qty: number) => number;
  dismantleEquipment: (equipmentInstanceId: string) => boolean;
  tickWorkshopQueues: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function calcTaskSeconds(payload: WorkshopTaskPayload, equipmentInventory: readonly EquipmentItem[]): number {
  switch (payload.kind) {
    case 'CRAFT':
      return getCraftingTime(getTierForMaterial(payload.baseMaterial));
    case 'ENHANCE_ADD':
    case 'ENHANCE_REROLL': {
      const eq = equipmentInventory.find((e) => e.id === payload.equipmentInstanceId);
      const tier = eq ? getTierForTemplate(eq.templateId) : 1;
      return getCraftingTime(tier);
    }
    case 'REPAIR': {
      const eq = equipmentInventory.find((e) => e.id === payload.equipmentInstanceId);
      if (!eq) return getRepairTime(0);
      const tpl = getEquipmentTemplate(eq.templateId);
      const damagePct = 1 - eq.durability / Math.max(1, tpl.maxDurability);
      return getRepairTime(damagePct);
    }
  }
}

function findEquipmentInState(state: StoreState, instanceId: string): EquipmentItem | null {
  const inv = state.inventory.equipmentInventory ?? [];
  const fromInv = inv.find((e) => e.id === instanceId);
  if (fromInv) return fromInv;
  const allMembers: Member[] = state.founder ? [state.founder, ...state.roster] : state.roster;
  for (const m of allMembers) {
    if (!m.equipment) continue;
    for (const slot of ['weapon', 'armor'] as const) {
      const cur = m.equipment[slot];
      if (cur && cur.id === instanceId) return cur;
    }
  }
  return null;
}

interface StartValidationOk { ok: true; consumed: Partial<Record<ItemID, number>>; }
interface StartValidationFail { ok: false; }
type StartValidation = StartValidationOk | StartValidationFail;

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

interface CompletionAcc {
  newEquipmentToInventory: EquipmentItem[];
  equipmentReplacements: Map<string, EquipmentItem>;
}

function completeTask(task: WorkshopTask, state: StoreState, acc: CompletionAcc): void {
  switch (task.payload.kind) {
    case 'CRAFT': {
      acc.newEquipmentToInventory.push(processCraft(task.payload).equipment);
      return;
    }
    case 'ENHANCE_ADD': {
      const eq = findEquipmentInState(state, task.payload.equipmentInstanceId);
      if (!eq) return;
      const result = processEnhanceAdd(eq, task.payload.monsterMaterial);
      if ('equipment' in result) acc.equipmentReplacements.set(result.equipment.id, result.equipment);
      return;
    }
    case 'ENHANCE_REROLL': {
      const eq = findEquipmentInState(state, task.payload.equipmentInstanceId);
      if (!eq) return;
      const result = processEnhanceReroll(eq, task.payload.slotIndex, task.payload.monsterMaterial);
      if ('equipment' in result) acc.equipmentReplacements.set(result.equipment.id, result.equipment);
      return;
    }
    case 'REPAIR': {
      const eq = findEquipmentInState(state, task.payload.equipmentInstanceId);
      if (!eq) return;
      const result = processRepair(eq);
      acc.equipmentReplacements.set(result.equipment.id, result.equipment);
      return;
    }
  }
}

// ─── Action factory ────────────────────────────────────────────────────────

export function createWorkshopActions(set: Setter): WorkshopActions {
  function isActiveWorkshop(f: GuildFacility | undefined): f is GuildFacility {
    return !!f && f.type === 'workshop' && f.level > 0;
  }

  return {
    addWorkshopTask(facilityId, payload, blueprintId) {
      let success = false;
      set((s) => {
        const facility = s.facilities.find((f) => f.id === facilityId);
        if (!isActiveWorkshop(facility)) return s;
        const eqInv = s.inventory.equipmentInventory ?? [];
        const totalSeconds = calcTaskSeconds(payload, eqInv);
        const task: WorkshopTask = {
          id: crypto.randomUUID(),
          type: payload.kind,
          payload,
          remainingSeconds: totalSeconds,
          totalSeconds,
          startedAt: null,
          ...(blueprintId ? { blueprintId } : {}),
        };
        success = true;
        return {
          facilities: s.facilities.map((f) =>
            f.id === facilityId ? { ...f, workshopQueue: [...(f.workshopQueue ?? []), task] } : f,
          ),
        } as Partial<StoreState>;
      });
      return success;
    },

    cancelWorkshopTask(facilityId, taskId) {
      let success = false;
      set((s) => {
        const facility = s.facilities.find((f) => f.id === facilityId);
        if (!facility) return s;
        const queue = facility.workshopQueue ?? [];
        if (!queue.some((t) => t.id === taskId)) return s;
        success = true;
        return {
          facilities: s.facilities.map((f) =>
            f.id === facilityId ? { ...f, workshopQueue: queue.filter((t) => t.id !== taskId) } : f,
          ),
        } as Partial<StoreState>;
      });
      return success;
    },

    saveBlueprint(facilityId, bp) {
      let newId: string | null = null;
      set((s) => {
        const facility = s.facilities.find((f) => f.id === facilityId);
        if (!isActiveWorkshop(facility)) return s;
        const bps = facility.workshopBlueprints ?? [];
        const slotLimit =
          WORKSHOP_CONFIG.blueprintSlotsByLevel[facility.level - 1] ??
          WORKSHOP_CONFIG.blueprintSlotsByLevel[0];
        if (bps.length >= slotLimit) return s;
        const id = crypto.randomUUID();
        newId = id;
        const created: WorkshopBlueprint = { ...bp, id, createdAt: Date.now() };
        return {
          facilities: s.facilities.map((f) =>
            f.id === facilityId ? { ...f, workshopBlueprints: [...bps, created] } : f,
          ),
        } as Partial<StoreState>;
      });
      return newId;
    },

    /**
     * Patch a blueprint's name and/or default quantity.
     * Ingredients (baseMaterial / monsterMaterial / templateId) are intentionally
     * immutable — match spec §5: blueprint identity = its recipe.
     */
    updateBlueprint(facilityId, blueprintId, patch) {
      let success = false;
      set((s) => {
        const facility = s.facilities.find((f) => f.id === facilityId);
        if (!facility) return s;
        const bps = facility.workshopBlueprints ?? [];
        const idx = bps.findIndex((b) => b.id === blueprintId);
        if (idx < 0) return s;
        const cur = bps[idx];
        const nextName = patch.name !== undefined ? patch.name.trim().slice(0, 24) : cur.name;
        const nextQty = patch.quantity !== undefined
          ? Math.max(1, Math.min(99, Math.floor(patch.quantity)))
          : cur.quantity;
        if (!nextName) return s;
        if (nextName === cur.name && nextQty === cur.quantity) return s;
        const updated: WorkshopBlueprint = { ...cur, name: nextName, quantity: nextQty };
        const nextBps = bps.slice();
        nextBps[idx] = updated;
        success = true;
        return {
          facilities: s.facilities.map((f) =>
            f.id === facilityId ? { ...f, workshopBlueprints: nextBps } : f,
          ),
        } as Partial<StoreState>;
      });
      return success;
    },

    deleteBlueprint(facilityId, blueprintId) {
      let success = false;
      set((s) => {
        const facility = s.facilities.find((f) => f.id === facilityId);
        if (!facility) return s;
        const bps = facility.workshopBlueprints ?? [];
        if (!bps.some((b) => b.id === blueprintId)) return s;
        success = true;
        return {
          facilities: s.facilities.map((f) =>
            f.id === facilityId ? { ...f, workshopBlueprints: bps.filter((b) => b.id !== blueprintId) } : f,
          ),
        } as Partial<StoreState>;
      });
      return success;
    },

    enqueueBlueprint(facilityId, blueprintId, qty) {
      let count = 0;
      set((s) => {
        const facility = s.facilities.find((f) => f.id === facilityId);
        if (!isActiveWorkshop(facility)) return s;
        const bp = (facility.workshopBlueprints ?? []).find((b) => b.id === blueprintId);
        if (!bp) return s;
        // Cap qty to prevent UI freeze if a caller passes an absurd number.
        const target = Math.max(1, Math.min(99, Math.floor(qty)));
        const eqInv = s.inventory.equipmentInventory ?? [];
        const newTasks: WorkshopTask[] = [];
        for (let i = 0; i < target; i++) {
          const payload: CraftPayload = {
            kind: 'CRAFT',
            baseMaterial: bp.baseMaterial,
            ...(bp.monsterMaterial ? { monsterMaterial: bp.monsterMaterial } : {}),
            templateId: bp.templateId,
          };
          const totalSeconds = calcTaskSeconds(payload, eqInv);
          newTasks.push({
            id: crypto.randomUUID(),
            type: 'CRAFT',
            payload,
            remainingSeconds: totalSeconds,
            totalSeconds,
            startedAt: null,
            blueprintId: bp.id,
          });
        }
        count = newTasks.length;
        return {
          facilities: s.facilities.map((f) =>
            f.id === facilityId ? { ...f, workshopQueue: [...(f.workshopQueue ?? []), ...newTasks] } : f,
          ),
        } as Partial<StoreState>;
      });
      return count;
    },

    /**
     * Instant action: dismantles an equipment instance from `equipmentInventory`
     * only — equipped items must be unequipped first. Recovered materials are
     * added to the inventory atomically.
     */
    dismantleEquipment(equipmentInstanceId) {
      let success = false;
      set((s) => {
        const eqInv = s.inventory.equipmentInventory ?? [];
        const idx = eqInv.findIndex((e) => e.id === equipmentInstanceId);
        if (idx < 0) return s;
        const result = processDismantle(eqInv[idx]);
        const newItems = { ...s.inventory.items };
        for (const [id, qty] of Object.entries(result.recoveredItems)) {
          if (qty && qty > 0) {
            newItems[id as ItemID] = (newItems[id as ItemID] ?? 0) + qty;
          }
        }
        success = true;
        return {
          inventory: {
            ...s.inventory,
            items: newItems,
            equipmentInventory: eqInv.filter((_, i) => i !== idx),
          },
        } as Partial<StoreState>;
      });
      return success;
    },

    tickWorkshopQueues() {
      set((s) => {
        // Fast bail inside the same set() snapshot we'd mutate, so a concurrent
        // addWorkshopTask cannot slip in between the read and the write.
        const anyWork = s.facilities.some(
          (f) => f.type === 'workshop' && f.level > 0 && (f.workshopQueue?.length ?? 0) > 0,
        );
        if (!anyWork) return s;

        const itemsDelta: Partial<Record<ItemID, number>> = {};
        const acc: CompletionAcc = {
          newEquipmentToInventory: [],
          equipmentReplacements: new Map(),
        };
        let mutated = false;

        const inventoryView = (id: ItemID): number =>
          (s.inventory.items[id] ?? 0) + (itemsDelta[id] ?? 0);

        const newFacilities = s.facilities.map((facility) => {
          if (!isActiveWorkshop(facility)) return facility;
          const queue = facility.workshopQueue ?? [];
          if (queue.length === 0) return facility;
          const workerCount = facility.assignedMemberIds.length;

          // Skip activation if no workers, but still tick already-active tasks.
          let working: WorkshopTask[] = queue.map((t) => ({ ...t }));

          if (workerCount > 0) {
            // Active tasks finish even if workerCount drops mid-craft (workers
            // don't abandon in-progress work). Down-shift only blocks NEW starts.
            let active = working.filter((t) => t.startedAt !== null).length;
            const tried = new Set<string>();
            while (active < workerCount) {
              const idx = working.findIndex((t) => t.startedAt === null && !tried.has(t.id));
              if (idx < 0) break;
              const pending = working[idx];
              tried.add(pending.id);
              const v = validateTaskStart(pending, inventoryView);
              if (!v.ok) {
                working = [...working.slice(0, idx), ...working.slice(idx + 1), pending];
                continue;
              }
              for (const [id, qty] of Object.entries(v.consumed) as [ItemID, number][]) {
                if (qty > 0) itemsDelta[id] = (itemsDelta[id] ?? 0) - qty;
              }
              working[idx] = { ...pending, startedAt: s.gameTime };
              active++;
              mutated = true;
            }
          }

          const next: WorkshopTask[] = [];
          for (const t of working) {
            if (t.startedAt === null) {
              next.push(t);
              continue;
            }
            const remain = t.remainingSeconds - 1;
            if (remain > 0) {
              next.push({ ...t, remainingSeconds: remain });
              mutated = true;
              continue;
            }
            completeTask(t, s, acc);
            mutated = true;
          }

          return { ...facility, workshopQueue: next };
        });

        if (!mutated) return s;

        // Apply itemsDelta + equipment changes
        const newItems = { ...s.inventory.items };
        for (const [id, qty] of Object.entries(itemsDelta) as [ItemID, number][]) {
          if (!qty) continue;
          const total = (newItems[id] ?? 0) + qty;
          if (total > 0) newItems[id] = total;
          else delete newItems[id];
        }

        let newEqInv = s.inventory.equipmentInventory ?? [];
        if (acc.equipmentReplacements.size > 0) {
          newEqInv = newEqInv.map((e) => acc.equipmentReplacements.get(e.id) ?? e);
        }
        if (acc.newEquipmentToInventory.length > 0) {
          newEqInv = [...newEqInv, ...acc.newEquipmentToInventory];
        }

        const replaceOnMember = (m: Member): Member => {
          if (!m.equipment || acc.equipmentReplacements.size === 0) return m;
          let changed = false;
          const newEq: MemberEquipment = { ...m.equipment };
          for (const slot of ['weapon', 'armor'] as const) {
            const cur = newEq[slot];
            if (cur) {
              const repl = acc.equipmentReplacements.get(cur.id);
              if (repl) {
                newEq[slot] = repl;
                changed = true;
              }
            }
          }
          return changed ? { ...m, equipment: newEq } : m;
        };

        return {
          facilities: newFacilities,
          inventory: { ...s.inventory, items: newItems, equipmentInventory: newEqInv },
          ...(s.founder ? { founder: replaceOnMember(s.founder) } : {}),
          roster: s.roster.map(replaceOnMember),
        } as Partial<StoreState>;
      });
    },
  };
}
