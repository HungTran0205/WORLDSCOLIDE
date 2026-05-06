/**
 * Workshop Room v2 — runtime config: tier→time, recovery rates, generic stat pool.
 * Spec: workshop-room-v2.md §3, §4.3, §4.6, §6, §7.
 */

import type { ItemID } from './items';
import type { EquipmentTemplateId } from './equipment-templates';
import { EQUIPMENT_DATABASE } from './equipment-templates';
import type { StatCategory, SlotStatKey } from './workshop-types';

export type Tier = 1 | 2 | 3 | 4 | 5;

interface GenericStatPoolEntry {
  statKey: SlotStatKey;
  range: [number, number];
  category: StatCategory;
}

export const WORKSHOP_CONFIG = {
  /** Base crafting time in seconds (Workshop Lv1 = 1.0x; level scaling deferred to future phase) */
  craftTimeByTier: { 1: 30, 2: 75, 3: 180, 4: 480, 5: 1200 } as Record<Tier, number>,

  /** Path A "lucky drop" generic slot probability at Workshop Lv1 (Skill axis disabled in MVP) */
  pathASlotChance: 0.20,

  /** Generic stat pool for Path A (no monster material). MVP: HP-only. */
  genericStatPool: [
    { statKey: 'HP', range: [40, 150], category: 'GENERIC' },
  ] as GenericStatPoolEntry[],

  /** Recovery percentage range for dismantle */
  dismantleRecoveryRate: {
    plain:   [0.7, 0.8] as [number, number],
    crafted: [0.5, 0.6] as [number, number],
  },

  /** Probability of recovering 1 monster material when dismantling a crafted item */
  dismantleMaterialRecoveryChance: 0.30,

  /** Blueprint slot capacity by Workshop level (index 0 = Lv1) */
  blueprintSlotsByLevel: [3, 5, 8, 12, 15] as const,

  /** Equipment max stat slots (spec §1.1.3.4 — up to 4 affix slots) */
  equipmentMaxSlots: 4,
} as const;

/** Repair time scales with damage% — 60s at 0% damage, +120s linearly to 180s at 100% */
export function getRepairTime(damagePct: number): number {
  const clamped = Math.max(0, Math.min(1, damagePct));
  return 60 + Math.floor(clamped * 120);
}

export function getCraftingTime(tier: Tier): number {
  return WORKSHOP_CONFIG.craftTimeByTier[tier];
}

/** Map a base material item to its weapon/armor tier. */
export function getTierForMaterial(itemId: ItemID): Tier {
  switch (itemId) {
    case 'WOOD':
    case 'STONE':
      return 1;
    case 'IRON_ORE':
      return 2;
    default:
      return 1;
  }
}

/** Infer tier of an equipment template via its craftMaterial. */
export function getTierForTemplate(templateId: EquipmentTemplateId): Tier {
  const tpl = EQUIPMENT_DATABASE[templateId];
  if (!tpl?.craftMaterial) return 1;
  return getTierForMaterial(tpl.craftMaterial);
}
