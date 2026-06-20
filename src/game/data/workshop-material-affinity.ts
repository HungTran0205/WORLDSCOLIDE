/**
 * Material → stat-category affinity table.
 * Enabled materials roll their statKey in craft/enhance flows.
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
  /** Disabled materials cannot be used by craft/enhance flows */
  enabled: boolean;
}

export const MATERIAL_AFFINITY: Partial<Record<ItemID, MaterialAffinity>> = {
  // Active
  SLIME_GEL:    { category: 'TANKY',        statKey: 'HP',           range: [50, 200],   tier: 1, equipmentType: 'armor',  enabled: true  },
  BAT_WING:     { category: 'DODGE',        statKey: 'DODGE',        range: [0.03, 0.08], tier: 1, equipmentType: 'armor',  enabled: true  },
  SPIDER_LEGS:  { category: 'ATTACK_SPEED', statKey: 'ATTACK_SPEED', range: [0.05, 0.12], tier: 1, equipmentType: 'weapon', enabled: true  },
  METAL_PLATE:  { category: 'BLOCK',        statKey: 'BLOCK',        range: [0.03, 0.08], tier: 2, equipmentType: 'armor',  enabled: true  },
  DRONE_SENSOR: { category: 'ACCURACY',     statKey: 'ACCURACY',     range: [0.05, 0.15], tier: 2, equipmentType: 'weapon', enabled: true  },

  SLIME_KING_CORE: { category: 'SHIELD', statKey: 'SHIELD', range: [1, 2], tier: 3, equipmentType: 'armor', enabled: true },
};

export function getAffinity(id: ItemID): MaterialAffinity | undefined {
  return MATERIAL_AFFINITY[id];
}

export function isMaterialEnabled(id: ItemID): boolean {
  return MATERIAL_AFFINITY[id]?.enabled === true;
}
