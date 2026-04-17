/**
 * Pure functions for calculating guild facility production per game-day.
 * Caller is responsible for applying results to the store.
 */

import type { GuildFacility, Member } from '@/game/state/game-state';
import type { ItemID } from '@/game/data/items';
import { FACILITY_DEFINITIONS, LOGGING_SITE_CONFIG, STONE_QUARRY_CONFIG } from '@/game/data/facility-definitions';
import { calcDerivedGuildStats } from './derived-guild-stats';
import { calcMcLevel } from './stone-quarry-production-system';

// --- Logging Site per-tick production types ---

export interface WcXpGain {
  memberId: string;
  xpGained: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
}

export interface ReserveUpdate {
  facilityType: 'logging-site';
  newReserve: number;
  depleted: boolean;
}

export interface LoggingTickResult {
  wcXpGains: WcXpGain[];
  reserveUpdates: ReserveUpdate[];
  woodProduced: number;
}

/** Map total XP accumulated → WC skill level 0–10 */
export function calcWcLevel(xp: number): number {
  const thresholds = LOGGING_SITE_CONFIG.wcSkillThresholds;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) return i;
  }
  return 0;
}

/**
 * Per-tick logging site production (called every 1s game tick).
 * Pure function — returns result to be applied by applyLoggingProduction action.
 */
export function processLoggingSiteTick(
  facilities: GuildFacility[],
  allMembers: Member[],
): LoggingTickResult {
  const result: LoggingTickResult = { wcXpGains: [], reserveUpdates: [], woodProduced: 0 };

  for (const facility of facilities) {
    if (facility.type !== 'logging-site' || facility.level === 0) continue;
    const reserve = facility.woodReserve;
    if (reserve === null || reserve === undefined || reserve <= 0) continue;
    if (facility.assignedMemberIds.length === 0) continue;

    const assignedMembers = allMembers.filter((m) => facility.assignedMemberIds.includes(m.id));
    if (assignedMembers.length === 0) continue;

    let totalWoodThisTick = 0;

    for (const member of assignedMembers) {
      const { STR, END, DEX } = member.stats;
      const baseScore = STR * 0.5 + END * 0.3 + DEX * 0.2;
      const wcLevel = member.craftSkills?.woodcutting.level ?? 0;
      const skillMult = 1 + LOGGING_SITE_CONFIG.wcSkillBonusPct[wcLevel] / 100;
      const woodPerTick = LOGGING_SITE_CONFIG.baseRate * (baseScore / 100) * skillMult;

      const remainingReserve = reserve - totalWoodThisTick;
      const actualWood = Math.min(woodPerTick, remainingReserve);
      if (actualWood <= 0) break;

      totalWoodThisTick += actualWood;

      const currentXp = member.craftSkills?.woodcutting.xpAccumulated ?? 0;
      const newXp = currentXp + actualWood;
      const newLevel = calcWcLevel(newXp);
      result.wcXpGains.push({
        memberId: member.id,
        xpGained: actualWood,
        newXp,
        newLevel,
        leveledUp: newLevel > wcLevel,
      });
    }

    const newReserve = Math.max(0, reserve - totalWoodThisTick);
    result.woodProduced += totalWoodThisTick;
    result.reserveUpdates.push({ facilityType: 'logging-site', newReserve, depleted: newReserve === 0 });
  }

  return result;
}

export interface FacilityProductionResult {
  facilityType: string;
  facilityName: string;
  /** EXP gains keyed by memberId — Training Yard */
  expGains: Record<string, number>;
  /** Item gains — Workshop */
  itemGains: Partial<Record<ItemID, number>>;
  /** Gold saved from upkeep reduction — Tavern CHA bonus */
  upkeepSaved: number;
  /** Whether infirmary recovery multiplier was applied */
  recoveryApplied: boolean;
}

// --- Logging Site + Stone Quarry ---

const LOGGING_BASE: number[] = [5, 9, 15];
const QUARRY_BASE: number[] = [4, 7, 12];

function calcExtractionOutput(member: Member, level: number, baseTable: number[]): number {
  const { gatherSpeed } = calcDerivedGuildStats(member.stats, member.level);
  return Math.floor(baseTable[level - 1] * (1 + gatherSpeed));
}

// --- Training Yard ---

function calcTrainingYardExpPerDay(member: Member, level: number): number {
  const base = [12, 22, 40][level - 1];
  const { trainingEff } = calcDerivedGuildStats(member.stats, member.level);
  return Math.floor(base * (1 + trainingEff));
}

// --- Workshop ---

const WORKSHOP_BASE_OUTPUT: Partial<Record<ItemID, number>>[] = [
  { WOOD: 3, STONE: 2 },
  { WOOD: 5, STONE: 3, IRON_ORE: 1 },
  { WOOD: 8, STONE: 5, IRON_ORE: 3 },
];

function calcWorkshopOutputPerDay(member: Member, level: number): Partial<Record<ItemID, number>> {
  const base = WORKSHOP_BASE_OUTPUT[level - 1];
  const { gatherSpeed, craftSkill } = calcDerivedGuildStats(member.stats, member.level);
  const speedMult = 1 + gatherSpeed;
  // craftSkill quality: chance to double iron ore at lv2+ (higher craftSkill → higher chance)
  const qualityRoll = level >= 2 && Math.random() < craftSkill * 0.001;
  const result: Partial<Record<ItemID, number>> = {};
  for (const [k, v] of Object.entries(base)) {
    result[k as ItemID] = Math.floor((v ?? 0) * speedMult);
  }
  if (qualityRoll && result.IRON_ORE) result.IRON_ORE = (result.IRON_ORE ?? 0) * 2;
  return result;
}

// --- Tavern ---

function calcTavernUpkeepSavedPerDay(
  assignedMembers: Member[],
  level: number,
  dailyUpkeep: number,
): number {
  const totalNegotiation = assignedMembers.reduce(
    (s, m) => s + calcDerivedGuildStats(m.stats, m.level).negotiation,
    0,
  );
  const pct = Math.min(0.10, totalNegotiation * 0.0001 * level);
  return Math.floor(dailyUpkeep * pct);
}

// --- Infirmary ---

/** Recovery time multiplier — lower is faster. Applied by injury-recovery logic. */
export function calcInfirmaryRecoveryMult(assignedMembers: Member[], level: number): number {
  if (assignedMembers.length === 0) return 1.0;
  const avgRecovery =
    assignedMembers.reduce((s, m) => s + calcDerivedGuildStats(m.stats, m.level).recovery, 0) /
    assignedMembers.length;
  const base = [0.75, 0.55, 0.40][level - 1];
  return Math.max(0.2, base * avgRecovery);
}

// --- Main processor ---

/**
 * Process facility production for gameDays elapsed.
 * Returns per-facility results — caller applies EXP, items, and gold to store.
 */
export function processFacilityProduction(
  facilities: GuildFacility[],
  allMembers: Member[],
  gameDays: number,
  dailyUpkeep: number,
): FacilityProductionResult[] {
  if (gameDays <= 0) return [];

  const results: FacilityProductionResult[] = [];

  for (const facility of facilities) {
    if (facility.level === 0 || facility.assignedMemberIds.length === 0) continue;

    const def = FACILITY_DEFINITIONS[facility.type as keyof typeof FACILITY_DEFINITIONS];
    const assignedMembers = allMembers.filter((m) => facility.assignedMemberIds.includes(m.id));
    if (assignedMembers.length === 0) continue;

    const result: FacilityProductionResult = {
      facilityType: facility.type,
      facilityName: def.name,
      expGains: {},
      itemGains: {},
      upkeepSaved: 0,
      recoveryApplied: false,
    };

    switch (facility.type) {
      case 'training-yard':
        for (const member of assignedMembers) {
          const expPerDay = calcTrainingYardExpPerDay(member, facility.level);
          result.expGains[member.id] = expPerDay * gameDays;
        }
        break;

      case 'workshop': {
        const combined: Partial<Record<ItemID, number>> = {};
        for (const member of assignedMembers) {
          const daily = calcWorkshopOutputPerDay(member, facility.level);
          for (const [k, v] of Object.entries(daily)) {
            combined[k as ItemID] = ((combined[k as ItemID] ?? 0) + (v ?? 0)) * gameDays;
          }
        }
        result.itemGains = combined;
        break;
      }

      case 'tavern':
        result.upkeepSaved = calcTavernUpkeepSavedPerDay(assignedMembers, facility.level, dailyUpkeep) * gameDays;
        break;

      case 'infirmary':
        result.recoveryApplied = true;
        break;

      case 'logging-site': {
        const combined: Partial<Record<ItemID, number>> = {};
        for (const member of assignedMembers) {
          const daily = calcExtractionOutput(member, facility.level, LOGGING_BASE);
          combined.WOOD = ((combined.WOOD ?? 0) + daily) * gameDays;
        }
        result.itemGains = combined;
        break;
      }

      case 'stone-quarry': {
        // Accumulate daily stone across all members first, then multiply by gameDays
        let totalDailyStone = 0;
        for (const member of assignedMembers) {
          const mcXp = member.craftSkills?.mining?.xpAccumulated ?? 0;
          const mcLevel = calcMcLevel(mcXp);
          const mcBonus = 1 + STONE_QUARRY_CONFIG.mcSkillYieldPct[mcLevel] / 100;
          const daily = calcExtractionOutput(member, facility.level, QUARRY_BASE);
          totalDailyStone += Math.floor(daily * mcBonus);
        }
        result.itemGains = { STONE: totalDailyStone * gameDays };
        break;
      }
    }

    results.push(result);
  }

  return results;
}
