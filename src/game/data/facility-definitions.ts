/** Static config for each guild facility — costs, slot limits, stat descriptions. */

import type { FacilityType } from '@/game/state/game-state';
import type { ItemID } from '@/game/data/items';

export interface FacilityDef {
  type: FacilityType;
  name: string;
  description: string;
  /** Gold to unlock from level 0 → 1. 0 = free (tavern). guildLevel >= 2 required for cost > 0. */
  buildCost: number;
  /** Optional material cost to build (consumed atomically with buildCost gold). e.g. tavern → 200 WOOD. */
  buildMaterialCost?: Partial<Record<ItemID, number>>;
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
  /** Quest ID that must be completed before this facility can be built. Absent = no narrative gate. */
  unlockQuestId?: string;
  /** Min guild level required before this facility appears in the build picker. Absent = available from Lv.1. */
  requiredGuildLevel?: number;
}

export const FACILITY_DEFINITIONS: Record<FacilityType, FacilityDef> = {
  tavern: {
    type: 'tavern',
    name: 'Tavern',
    description: 'High CHA members attract better mercenaries and reduce upkeep.',
    buildCost: 0,
    buildMaterialCost: { WOOD: 200 }, // GDD §0.3: tavern costs 200 wood globally (gate for the tutorial first-haul loop)
    upgradeCosts: [200, 400],
    maxSlots: [1, 2, 2],
    primaryStats: 'CHA',
    zonePosition: [8, 0, 5],
    tileFootprint: [3, 3],
  },
  'training-yard': {
    type: 'training-yard',
    name: 'Training Yard',
    description: 'Trains a member to raise the rank of their carried combat skill. A trainee is benched from missions while training. Higher yard level = higher rank ceiling + faster training.',
    buildCost: 250,
    upgradeCosts: [300, 500],
    maxSlots: [2, 3, 4],
    primaryStats: '—',
    zonePosition: [2, 0, 2.5],
    tileFootprint: [3, 3],
    requiredGuildLevel: 3,
  },
  infirmary: {
    type: 'infirmary',
    name: 'Infirmary',
    description: 'Heals injured members on recovery beds. Higher levels add beds and heal faster. Recovery speed is independent of member stats.',
    buildCost: 500,
    buildMaterialCost: { STONE: 50, WOOD: 50 },
    upgradeCosts: [350, 600],
    maxSlots: [1, 2, 3], // recovery beds, not worker slots
    primaryStats: '—', // no member works here; recovery speed depends on infirmary level only
    zonePosition: [2, 0, 5],
    tileFootprint: [3, 3],
    requiredGuildLevel: 3,
  },
  workshop: {
    type: 'workshop',
    name: 'Workshop',
    description: 'Crafts equipment from materials. STR increases speed, DEX increases quality.',
    buildCost: 250,
    buildMaterialCost: { WOOD: 50 },
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
    buildCost: 500,
    buildMaterialCost: { WOOD: 20 },
    upgradeCosts: [300, 500],
    maxSlots: [1, 2, 3],
    primaryStats: 'STR + LCK',
    zonePosition: [7, 0, 1],
    tileFootprint: [3, 3],
    unlockQuestId: 'ft-ancient-threshold', // cave entrance reached — STONE scripted drop ties here
  },
  'alchemy-lab': {
    type: 'alchemy-lab',
    name: 'Alchemy Lab',
    description: 'Alchemists brew Healing Syringes from Slime Gel. Higher Alchemy skill → more gels per batch → more syringes produced.',
    buildCost: 350,
    buildMaterialCost: { STONE: 20, WOOD: 50 },
    upgradeCosts: [500, 800],
    maxSlots: [1, 2, 3],
    primaryStats: 'INT + DEX',
    zonePosition: [5, 0, 5],
    tileFootprint: [3, 3],
    unlockQuestId: 'ft-ruins-forgotten-age', // ruins cleared — ether + materials available
  },
};

/** Infinite-production config for the Stone Quarry facility */
export const STONE_QUARRY_CONFIG = {
  /** stone/tick per unit of (STR×0.5)/100 — baseScore is normalized by /100 to keep the rate small.
   *  Calibrated: Kael (STR 8) → baseScore=4 → baseScore/100=0.04 → 0.1389×0.04×1800 ≈ 10 stone/game-day at lv1, MC0
   *  (1 game-day = 1800 real ticks = 30 min @ 1Hz scheduler). */
  baseRate: 0.1389,
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
  /** Real ticks per game-day — used to convert daily strike probability to per-tick.
   *  1800 = 30 min × 60s, matching the online 1Hz scheduler (1 game-day = 30 real minutes). */
  ticksPerDay: 1800,
  mcSkillMaxLevel: 10,
  /** Vein type cumulative thresholds: roll < weights[0] → iron, < weights[1] → richStone, else gem */
  veinWeights: [0.65, 0.90] as const,
  /** Iron ore quantity range [min, max] inclusive */
  ironOreRange: [2, 4] as const,
  /** Rich stone pocket STONE bonus range [min, max] inclusive */
  richStoneBonusRange: [10, 20] as const,
} as const;

/** Alchemy Lab crafting config */
export const ALCHEMY_CONFIG = {
  /** Heal fraction restored per syringe use (30% max HP) */
  syringeHealPct: 0.30,
  /** Slime gels consumed per batch = alchemyLevel + 1. Syringes produced = same number. */
  ingredientCountFormula: (acLevel: number) => acLevel + 1,
  /** Batches per game-day per member: floor(INT×0.08 + DEX×0.04 + facilityLevel + 1) */
  batchesPerDay: (intStat: number, dexStat: number, facilityLevel: number) =>
    Math.max(1, Math.floor(intStat * 0.08 + dexStat * 0.04 + facilityLevel + 1)),
  /** AC skill XP thresholds (cumulative syringes crafted) */
  acSkillThresholds: [0, 10, 25, 50, 100, 200, 400, 700, 1100, 1700, 2500] as const,
  acSkillMaxLevel: 10,
} as const;

/** Finite-harvest config for the Logging Site facility */
export const LOGGING_SITE_CONFIG = {
  /** Starting wood reserve per site */
  woodReserve: 1000,
  /** wood/tick per 1 baseScore point — calibrated: Kael (STR 8, END 7) → ~25 WOOD/game-day @ 1800 ticks/day */
  baseRate: 0.2277,
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
