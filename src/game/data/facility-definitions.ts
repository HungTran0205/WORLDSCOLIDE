/** Static config for each guild facility — costs, slot limits, stat descriptions. */

import type { FacilityType } from '@/game/state/game-state';

export interface FacilityDef {
  type: FacilityType;
  name: string;
  description: string;
  /** Gold to unlock from level 0 → 1 (guildLevel >= 2 required) */
  buildCost: number;
  /** Gold costs for lv1→2 and lv2→3 upgrades */
  upgradeCosts: [number, number];
  /** Max assigned member slots per level [lv1, lv2, lv3] */
  maxSlots: [number, number, number];
  /** Primary stats label for UI tooltip */
  primaryStats: string;
  /** World-space anchor position [x, y, z] — center of zone in guild hall */
  zonePosition: [number, number, number];
  /** Zone size in tiles [width, depth] */
  tileFootprint: [number, number];
  /** World-space center of this facility's dedicated 7×7 room (behind guild hall) */
  roomCenter: [number, number, number];
}

export const FACILITY_DEFINITIONS: Record<FacilityType, FacilityDef> = {
  tavern: {
    type: 'tavern',
    name: 'Tavern',
    description: 'High CHA members attract better mercenaries and reduce upkeep.',
    buildCost: 0, // starts at lv1 by default
    upgradeCosts: [200, 400],
    maxSlots: [1, 2, 2],
    primaryStats: 'CHA',
    zonePosition: [8, 0, 5],
    tileFootprint: [3, 3],
    roomCenter: [13.5, 0, -8.5],
  },
  'training-yard': {
    type: 'training-yard',
    name: 'Training Yard',
    description: 'Members gain passive EXP daily. DEX + AGI increase gain rate.',
    buildCost: 250,
    upgradeCosts: [300, 500],
    maxSlots: [2, 3, 4],
    primaryStats: 'DEX + AGI',
    zonePosition: [2, 0, 2.5],
    tileFootprint: [3, 3],
    roomCenter: [3.5, 0, -20.5],
  },
  infirmary: {
    type: 'infirmary',
    name: 'Infirmary',
    description: 'Speeds up injury recovery. END + INT improve treatment quality.',
    buildCost: 300,
    upgradeCosts: [350, 600],
    maxSlots: [1, 2, 3],
    primaryStats: 'END + INT',
    zonePosition: [2, 0, 5],
    tileFootprint: [3, 3],
    roomCenter: [3.5, 0, -8.5],
  },
  workshop: {
    type: 'workshop',
    name: 'Workshop',
    description: 'Produces materials daily. STR increases speed, DEX increases quality.',
    buildCost: 350,
    upgradeCosts: [400, 700],
    maxSlots: [1, 2, 3],
    primaryStats: 'STR + DEX',
    zonePosition: [8, 0, 2.5],
    tileFootprint: [3, 3],
    roomCenter: [13.5, 0, -20.5],
  },
};
