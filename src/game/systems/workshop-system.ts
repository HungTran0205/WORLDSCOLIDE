/**
 * Workshop Room v2 — pure-function logic module.
 * No store access, no side effects. Caller (slice) wraps results into state.
 * Spec: docs/feature/Room/workshop-room-v2.md §4 Crafting, §6 Repair, §7 Dismantle.
 *
 * RNG injection (`rng: () => number`) keeps every roll deterministic in tests.
 * Defaults to `Math.random` for production callers.
 */

import type { EquipmentItem, InventoryState } from '@/game/state/game-state';
import type { ItemID } from '@/game/data/items';
import type {
  CraftPayload,
  EquipmentSlotData,
} from '@/game/data/workshop-types';
import { getEquipmentTemplate } from '@/game/data/equipment-templates';
import { getAffinity } from '@/game/data/workshop-material-affinity';
import {
  WORKSHOP_CONFIG,
  getTierForTemplate,
} from '@/game/data/workshop-config';

type Rng = () => number;

// ─── Roll engine ───────────────────────────────────────────────────────────

/**
 * Linear-interpolate within [min, max].
 * Integer ranges (HP) round to nearest integer.
 * Fractional ranges (DODGE/BLOCK/ACCURACY/ATTACK_SPEED) round to 4 decimal places.
 */
export function rollSlotValue([min, max]: readonly [number, number], rng: Rng): number {
  const raw = min + rng() * (max - min);
  return max >= 1 ? Math.round(raw) : Math.round(raw * 10000) / 10000;
}

// ─── Result types ──────────────────────────────────────────────────────────

export type WorkshopErrorCode =
  | 'NO_FREE_SLOT'
  | 'TIER_MISMATCH'
  | 'CATEGORY_MISMATCH'
  | 'MATERIAL_DISABLED'
  | 'INVALID_SLOT'
  | 'EQUIP_TYPE_MISMATCH';

export interface CraftSuccess { equipment: EquipmentItem; }
export interface EnhanceAddSuccess { equipment: EquipmentItem; }
export interface EnhanceRerollSuccess { equipment: EquipmentItem; oldValue: number; newValue: number; }
export interface RepairSuccess { equipment: EquipmentItem; }
export interface DismantleSuccess { recoveredItems: Partial<Record<ItemID, number>>; }
export interface WorkshopError { error: WorkshopErrorCode; }

export type EnhanceAddResult = EnhanceAddSuccess | WorkshopError;
export type EnhanceRerollResult = EnhanceRerollSuccess | WorkshopError;

export interface ValidateOk { ok: true; }
export interface ValidateFail { ok: false; reason: 'MISSING_MAT'; }
export type ValidateCraftResult = ValidateOk | ValidateFail;

// ─── Craft (Path A vs Path B) ──────────────────────────────────────────────

/**
 * No-fail craft. Path A (no monsterMaterial): 20% chance of generic slot.
 * Path B (with enabled monsterMaterial): guaranteed slot from affinity.
 */
export function processCraft(payload: CraftPayload, rng: Rng = Math.random): CraftSuccess {
  const tpl = getEquipmentTemplate(payload.templateId);
  const slots: EquipmentSlotData[] = [];

  if (payload.monsterMaterial) {
    // Path B: guaranteed slot rolled from material affinity (if enabled + type matches)
    const aff = getAffinity(payload.monsterMaterial);
    if (aff?.enabled && aff.equipmentType === tpl.slot) {
      slots.push({
        category: aff.category,
        statKey: aff.statKey,
        value: rollSlotValue(aff.range, rng),
      });
    }
  } else {
    // Path A: 20% chance of generic slot
    if (rng() < WORKSHOP_CONFIG.pathASlotChance) {
      const pool = WORKSHOP_CONFIG.genericStatPool[0];
      slots.push({
        category: pool.category,
        statKey: pool.statKey,
        value: rollSlotValue(pool.range, rng),
      });
    }
  }

  return {
    equipment: {
      id: crypto.randomUUID(),
      templateId: payload.templateId,
      durability: tpl.maxDurability,
      slots,
      maxSlots: WORKSHOP_CONFIG.equipmentMaxSlots,
    },
  };
}

// ─── Enhance: add slot ─────────────────────────────────────────────────────

/**
 * Adds a new affix slot rolled from monsterMaterial's affinity.
 * Errors: MATERIAL_DISABLED, TIER_MISMATCH (mat tier < equipment tier), NO_FREE_SLOT.
 */
export function processEnhanceAdd(
  eq: EquipmentItem,
  monsterMaterial: ItemID,
  rng: Rng = Math.random,
): EnhanceAddResult {
  const aff = getAffinity(monsterMaterial);
  if (!aff?.enabled) return { error: 'MATERIAL_DISABLED' };

  const tpl = getEquipmentTemplate(eq.templateId);
  if (aff.equipmentType !== tpl.slot) return { error: 'EQUIP_TYPE_MISMATCH' };

  const tplTier = getTierForTemplate(eq.templateId);
  if (aff.tier < tplTier) return { error: 'TIER_MISMATCH' };

  const slots = eq.slots ?? [];
  const max = eq.maxSlots ?? WORKSHOP_CONFIG.equipmentMaxSlots;
  if (slots.length >= max) return { error: 'NO_FREE_SLOT' };

  const newSlot: EquipmentSlotData = {
    category: aff.category,
    statKey: aff.statKey,
    value: rollSlotValue(aff.range, rng),
  };
  return { equipment: { ...eq, slots: [...slots, newSlot] } };
}

// ─── Enhance: reroll slot value ────────────────────────────────────────────

/**
 * Rerolls one existing slot's value. Material must match slot category.
 * Returns oldValue + newValue so UI can show a diff/toast.
 * Errors: INVALID_SLOT, MATERIAL_DISABLED, CATEGORY_MISMATCH.
 */
export function processEnhanceReroll(
  eq: EquipmentItem,
  slotIndex: number,
  monsterMaterial: ItemID,
  rng: Rng = Math.random,
): EnhanceRerollResult {
  const slots = eq.slots ?? [];
  const slot = slots[slotIndex];
  if (!slot) return { error: 'INVALID_SLOT' };

  const aff = getAffinity(monsterMaterial);
  if (!aff?.enabled) return { error: 'MATERIAL_DISABLED' };
  if (aff.category !== slot.category) return { error: 'CATEGORY_MISMATCH' };

  const oldValue = slot.value;
  const newValue = rollSlotValue(aff.range, rng);
  const newSlots = [...slots];
  newSlots[slotIndex] = { ...slot, value: newValue };

  return { equipment: { ...eq, slots: newSlots }, oldValue, newValue };
}

// ─── Repair (no-fail) ──────────────────────────────────────────────────────

/** Sets durability to template max. */
export function processRepair(eq: EquipmentItem): RepairSuccess {
  const tpl = getEquipmentTemplate(eq.templateId);
  return { equipment: { ...eq, durability: tpl.maxDurability } };
}

// ─── Dismantle ─────────────────────────────────────────────────────────────

/**
 * Recovers a fraction of base craft material. Crafted items (slots > 0) use
 * a lower band (50-60%) and have a 30% chance of returning a Slime Gel.
 * Plain items recover 70-80%.
 */
export function processDismantle(eq: EquipmentItem, rng: Rng = Math.random): DismantleSuccess {
  const tpl = getEquipmentTemplate(eq.templateId);
  const slots = eq.slots ?? [];
  const isCrafted = slots.length > 0;

  const range = isCrafted
    ? WORKSHOP_CONFIG.dismantleRecoveryRate.crafted
    : WORKSHOP_CONFIG.dismantleRecoveryRate.plain;

  const out: Partial<Record<ItemID, number>> = {};

  const baseRecovery = tpl.craftCost ?? 10;
  const pct = range[0] + rng() * (range[1] - range[0]);
  const matAmount = Math.max(1, Math.floor(baseRecovery * pct));

  if (tpl.craftMaterial) {
    out[tpl.craftMaterial] = matAmount;
  }

  // 30% chance to recover 1 monster material on crafted items (MVP: Slime Gel only).
  if (isCrafted && rng() < WORKSHOP_CONFIG.dismantleMaterialRecoveryChance) {
    out.SLIME_GEL = (out.SLIME_GEL ?? 0) + 1;
  }

  return { recoveredItems: out };
}

// ─── Validation ────────────────────────────────────────────────────────────

/**
 * Verifies the inventory has enough of each material the craft would consume:
 * `craftMaterial × craftCost` + each `extraMaterials` entry + 1 × monsterMaterial when present.
 */
export function validateCraftInput(
  payload: CraftPayload,
  inventory: InventoryState,
): ValidateCraftResult {
  const tpl = getEquipmentTemplate(payload.templateId);
  const need: Partial<Record<ItemID, number>> = {};

  if (tpl.craftMaterial && tpl.craftCost) {
    need[tpl.craftMaterial] = tpl.craftCost;
  }
  if (tpl.extraMaterials) {
    for (const [id, qty] of Object.entries(tpl.extraMaterials) as [ItemID, number][]) {
      need[id] = (need[id] ?? 0) + qty;
    }
  }
  if (payload.monsterMaterial) {
    need[payload.monsterMaterial] = (need[payload.monsterMaterial] ?? 0) + 1;
  }

  for (const id of Object.keys(need) as ItemID[]) {
    const required = need[id] ?? 0;
    const have = inventory.items[id] ?? 0;
    if (have < required) return { ok: false, reason: 'MISSING_MAT' };
  }
  return { ok: true };
}
