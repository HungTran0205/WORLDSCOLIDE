/** Static config for each guild facility — costs, slot limits, stat descriptions. */

import type { FacilityType } from '@/game/state/game-state';

export interface FacilityDef {
  type: FacilityType;
  name: string;
  description: string;
  /** Gold to unlock from level 0 → 1. 0 = free (tavern). guildLevel >= 2 required for cost > 0. */
  buildCost: number;
  /** Gold costs for lv1→2 and lv2→3 upgrades. Absent = no upgrade path (e.g. logging-site). */
  upgradeCosts?: [number, number];
  /** Max assigned member slots per level [lv1, lv2, lv3] */
  maxSlots: [number, number, number];
  /** Primary stats label for UI tooltip */
  primaryStats: string;
  /** World-space anchor position [x, y, z] — center of interactive zone inside guild hall */
  zonePosition: [number, number, number];
  /** Zone size in tiles [width, depth] */
  tileFootprint: [number, number];
}

export const FACILITY_DEFINITIONS: Record<FacilityType, FacilityDef> = {
  tavern: {
    type: 'tavern',
    name: 'Tavern',
    description: 'High CHA members attract better mercenaries and reduce upkeep.',
    buildCost: 0,
    upgradeCosts: [200, 400],
    maxSlots: [1, 2, 2],
    primaryStats: 'CHA',
    zonePosition: [8, 0, 5],
    tileFootprint: [3, 3],
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
  },
  'logging-site': {
    type: 'logging-site',
    name: 'Logging Site',
    description: 'Consume a Logging Permit to establish a site. Wood reserve depletes over time; STR + WC skill increase yield.',
    buildCost: 0, // permit-only: no gold cost
    // no upgradeCosts — stays at level 1 forever
    maxSlots: [1, 2, 3],
    primaryStats: 'STR + WC Skill',
    zonePosition: [5, 0, 1],
    tileFootprint: [3, 3],
  },
  'stone-quarry': {
    type: 'stone-quarry',
    name: 'Stone Quarry',
    description: 'Assign members to mine stone from the quarry. STR increases yield.',
    buildCost: 250,
    upgradeCosts: [300, 500],
    maxSlots: [1, 2, 3],
    primaryStats: 'STR',
    zonePosition: [7, 0, 1],
    tileFootprint: [3, 3],
  },
};

/** Finite-harvest config for the Logging Site facility */
export const LOGGING_SITE_CONFIG = {
  /** Starting wood reserve per site */
  woodReserve: 1000,
  /** wood/tick per 1 baseScore point — calibrated: STR20/END15/DEX0/WC0 depletes 1000 wood in ~7 days (604 800 ticks) */
  baseRate: 0.0114,
  /** XP thresholds for WC levels 0–10 */
  wcSkillThresholds: [0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 7500, 11000] as const,
  /** Bonus harvest % per WC level */
  wcSkillBonusPct:   [0, 10,  22,  38,  58,   80,  105,  133,  165,  200,   240] as const,
  wcSkillMaxLevel: 10,
  /** Reserve fraction below which yellow warning shows */
  warningLowPct: 0.25,
  /** Reserve fraction below which red critical badge shows */
  warningCriticalPct: 0.10,
} as const;
