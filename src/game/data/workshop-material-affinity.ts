/**
 * Material → stat-category affinity table.
 * MVP: only SLIME_GEL enabled. Other monster materials are stubs (enabled:false)
 * to lock in API shape for future phases without affecting current gameplay.
 * Spec: workshop-room-v2.md §4.4.
 */

import type { ItemID } from './items';
import type { StatCategory, SlotStatKey } from './workshop-types';

export interface MaterialAffinity {
  category: StatCategory;
  statKey: SlotStatKey;
  /** Inclusive [min, max] roll range */
  range: [number, number];
  tier: 1 | 2 | 3 | 4 | 5;
  equipmentType: 'weapon' | 'armor';
  /** MVP gate — disabled materials cannot be used by craft/enhance flows */
  enabled: boolean;
}

export const MATERIAL_AFFINITY: Partial<Record<ItemID, MaterialAffinity>> = {
  // Active in MVP
  SLIME_GEL: { category: 'TANKY', statKey: 'HP', range: [50, 200], tier: 1, equipmentType: 'armor', enabled: true },

  // Future-phase stubs (locked off; will enable when stat keys + combat support land)
  BAT_WING:        { category: 'DODGE',        statKey: 'HP', range: [1, 5],   tier: 1, equipmentType: 'weapon', enabled: false },
  SPIDER_LEGS:     { category: 'ACCURACY',     statKey: 'HP', range: [1, 10],  tier: 1, equipmentType: 'weapon', enabled: false },
  METAL_PLATE:     { category: 'BLOCK',        statKey: 'HP', range: [1, 5],   tier: 2, equipmentType: 'armor',  enabled: false },
  DRONE_SENSOR:    { category: 'ATTACK_SPEED', statKey: 'HP', range: [5, 10],  tier: 2, equipmentType: 'weapon', enabled: false },
  SLIME_KING_CORE: { category: 'SHIELD',       statKey: 'HP', range: [50, 500], tier: 3, equipmentType: 'armor', enabled: false },
};

export function getAffinity(id: ItemID): MaterialAffinity | undefined {
  return MATERIAL_AFFINITY[id];
}

export function isMaterialEnabled(id: ItemID): boolean {
  return MATERIAL_AFFINITY[id]?.enabled === true;
}
