/**
 * Workshop Room v2 — type definitions only (no logic, no runtime data).
 * Spec: docs/feature/Room/workshop-room-v2.md §4 Crafting, §5 Blueprint.
 */

import type { ItemID } from './items';
import type { EquipmentTemplateId } from './equipment-templates';

/** Stat affix categories — material affinity maps to one of these. */
export type StatCategory =
  | 'TANKY'
  | 'DODGE'
  | 'ACCURACY'
  | 'BLOCK'
  | 'ATTACK_SPEED'
  | 'SHIELD'
  | 'GENERIC';

/** Stat keys that can roll on equipment slots. */
export type SlotStatKey = 'HP' | 'DODGE' | 'BLOCK' | 'ATTACK_SPEED' | 'ACCURACY' | 'SHIELD';

/** Single rolled affix slot on an EquipmentItem instance. */
export interface EquipmentSlotData {
  category: StatCategory;
  statKey: SlotStatKey;
  value: number;
}

export type WorkshopTaskType = 'CRAFT' | 'ENHANCE_ADD' | 'ENHANCE_REROLL' | 'REPAIR';

export interface CraftPayload {
  kind: 'CRAFT';
  baseMaterial: ItemID;
  monsterMaterial?: ItemID;
  templateId: EquipmentTemplateId;
}

export interface EnhanceAddPayload {
  kind: 'ENHANCE_ADD';
  equipmentInstanceId: string;
  monsterMaterial: ItemID;
}

export interface EnhanceRerollPayload {
  kind: 'ENHANCE_REROLL';
  equipmentInstanceId: string;
  slotIndex: number;
  monsterMaterial: ItemID;
}

export interface RepairPayload {
  kind: 'REPAIR';
  equipmentInstanceId: string;
}

export type WorkshopTaskPayload =
  | CraftPayload
  | EnhanceAddPayload
  | EnhanceRerollPayload
  | RepairPayload;

/** A queued workshop task. startedAt=null → pending; non-null → in progress. */
export interface WorkshopTask {
  id: string;
  type: WorkshopTaskType;
  /** Seconds remaining; counts down each tick once started */
  remainingSeconds: number;
  totalSeconds: number;
  /** Payload union — discriminated by `kind` */
  payload: WorkshopTaskPayload;
  /** Tick timestamp when task was activated; null until a worker picks it up */
  startedAt: number | null;
  /** If the task originated from a blueprint enqueue */
  blueprintId?: string;
}

/** Saved blueprint — combination preset for batch crafting. */
export interface WorkshopBlueprint {
  id: string;
  name: string;
  baseMaterial: ItemID;
  monsterMaterial?: ItemID;
  templateId: EquipmentTemplateId;
  /** Default quantity to enqueue when used */
  quantity: number;
  createdAt: number;
}
