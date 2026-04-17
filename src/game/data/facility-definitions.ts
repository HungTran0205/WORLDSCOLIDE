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
    description: 'Mine stone continuously. STR controls yield. LCK unlocks rare vein strikes (Iron Ore, Gems). MC skill amplifies both.',
    buildCost: 250,
    upgradeCosts: [300, 500],
    maxSlots: [1, 2, 3],
    primaryStats: 'STR + LCK',
    zonePosition: [7, 0, 1],
    tileFootprint: [3, 3],
  },
};

/** Infinite-production config for the Stone Quarry facility */
export const STONE_QUARRY_CONFIG = {
  /** stone/tick per unit of (STR×0.5)/100 — baseScore is normalized by /100 to keep the rate small.
   *  Calibrated: STR20 → baseScore=10 → baseScore/100=0.1 → 0.002315×0.1×86400 ≈ 20 stone/day at lv1, MC0. */
  baseRate: 0.002315,
  /** Level production multipliers [lv1, lv2, lv3] */
  levelMult: [1.0, 2.0, 3.5] as const,
  /** MC skill XP thresholds (cumulative stone mined) — 25% harder than WC */
  mcSkillThresholds: [0, 100, 250, 563, 1063, 1875, 3125, 5000, 7500, 11250, 16250] as const,
  /** Yield bonus % per MC level */
  mcSkillYieldPct: [0, 8, 18, 32, 50, 72, 98, 128, 162, 200, 245] as const,
  /** Additive daily vein strike chance per MC level (decimal, not %) */
  mcSkillStrikePct: [0, 0.003, 0.006, 0.01, 0.015, 0.02, 0.025, 0.03, 0.035, 0.04, 0.05] as const,
  /** Base vein strike chance per game-day */
  baseStrikeChancePerDay: 0.01,
  /** fortune stat bonus per point to daily strike chance (fortune = LCK×3 + CHA×0.5) */
  fortuneStrikeScale: 0.0002,
  /** Level bonus to daily vein strike chance [lv1, lv2, lv3] */
  levelStrikeBonus: [0, 0.015, 0.035] as const,
  /** Ticks per game-day — used to convert daily strike probability to per-tick */
  ticksPerDay: 86400,
  mcSkillMaxLevel: 10,
  /** Vein type cumulative thresholds: roll < weights[0] → iron, < weights[1] → richStone, else gem */
  veinWeights: [0.65, 0.90] as const,
  /** Iron ore quantity range [min, max] inclusive */
  ironOreRange: [2, 4] as const,
  /** Rich stone pocket STONE bonus range [min, max] inclusive */
  richStoneBonusRange: [10, 20] as const,
} as const;

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
