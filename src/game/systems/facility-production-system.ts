/**
 * Pure functions for calculating guild facility production per game-day.
 * Caller is responsible for applying results to the store.
 *
 * Workshop & Alchemy Lab are queue-based (see workshop-offline-system.ts /
 * advanceAlchemyQueues) — they are NOT auto-produced here.
 */

import type { GuildFacility, Member } from '@/game/state/game-state';
import type { ItemID } from '@/game/data/items';
import { FACILITY_DEFINITIONS, LOGGING_SITE_CONFIG, STONE_QUARRY_CONFIG } from '@/game/data/facility-definitions';
import { calcDerivedGuildStats } from './derived-guild-stats';
import { calcMcLevel, type MiningXpGain } from './stone-quarry-production-system';

// Real ticks per game-day. Online produces 1 cycle per real-second, and 1 game-day = 30 real minutes,
// so 1800 real ticks elapse per game-day. Offline catch-up must use the same scale to stay
// consistent with online production rate (otherwise offline yields differ).
export const TICKS_PER_DAY = 1800;

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
  /** Specific facility instance id — required so multiple facilities of same type don't collide. */
  facilityId: string;
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

/** Per-member daily wood output potential (no reserve cap) */
function calcLoggingDailyWood(member: Member): number {
  const { STR, END, DEX } = member.stats;
  const baseScore = STR * 0.5 + END * 0.3 + DEX * 0.2;
  const wcLevel = member.craftSkills?.woodcutting.level ?? 0;
  const skillMult = 1 + LOGGING_SITE_CONFIG.wcSkillBonusPct[wcLevel] / 100;
  return LOGGING_SITE_CONFIG.baseRate * (baseScore / 100) * skillMult * TICKS_PER_DAY;
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
    result.reserveUpdates.push({ facilityType: 'logging-site', facilityId: facility.id, newReserve, depleted: newReserve === 0 });
  }

  return result;
}

export interface FacilityProductionResult {
  facilityType: string;
  facilityName: string;
  /** EXP gains keyed by memberId — Training Yard */
  expGains: Record<string, number>;
  /** Item gains — Logging Site (WOOD), Stone Quarry (STONE) */
  itemGains: Partial<Record<ItemID, number>>;
  /** Whether infirmary recovery multiplier was applied */
  recoveryApplied: boolean;
  /** Logging site only — wood reserve depletion result */
  reserveUpdate?: ReserveUpdate;
  /** Logging site only — woodcutting XP per assigned member */
  wcXpGains?: WcXpGain[];
  /** Stone quarry only — mining XP per assigned member */
  mcXpGains?: MiningXpGain[];
}

// --- Training Yard ---

function calcTrainingYardExpPerDay(member: Member, level: number): number {
  const base = [12, 22, 40][level - 1];
  const { trainingEff } = calcDerivedGuildStats(member.stats, member.level);
  return Math.floor(base * (1 + trainingEff));
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
 * Returns per-facility results — caller applies EXP, items, gold, XP, and reserve to store.
 *
 * Workshop & Alchemy Lab are queue-based and processed by their own offline systems
 * (advanceWorkshopQueues / advanceAlchemyQueues) — skipped here.
 */
export function processFacilityProduction(
  facilities: GuildFacility[],
  allMembers: Member[],
  gameDays: number,
): FacilityProductionResult[] {
  if (gameDays <= 0) return [];

  const results: FacilityProductionResult[] = [];

  for (const facility of facilities) {
    if (facility.level === 0 || facility.assignedMemberIds.length === 0) continue;

    const def = FACILITY_DEFINITIONS[facility.type as keyof typeof FACILITY_DEFINITIONS];
    if (!def) continue;
    const assignedMembers = allMembers.filter((m) => facility.assignedMemberIds.includes(m.id));
    if (assignedMembers.length === 0) continue;

    const result: FacilityProductionResult = {
      facilityType: facility.type,
      facilityName: def.name,
      expGains: {},
      itemGains: {},
      recoveryApplied: false,
    };

    switch (facility.type) {
      case 'training-yard':
        for (const member of assignedMembers) {
          const expPerDay = calcTrainingYardExpPerDay(member, facility.level);
          result.expGains[member.id] = expPerDay * gameDays;
        }
        break;

      case 'infirmary':
        result.recoveryApplied = true;
        break;

      case 'logging-site': {
        let reserve = facility.woodReserve ?? 0;
        if (reserve <= 0) break;

        // Per-member daily potential (snapshot — WC level changes mid-window are ignored for simplicity)
        const memberDaily = assignedMembers.map((member) => ({
          member,
          wcLevel: member.craftSkills?.woodcutting.level ?? 0,
          dailyWood: calcLoggingDailyWood(member),
        }));

        const memberGained = new Map<string, number>();
        let totalWood = 0;

        // Day-by-day loop so we can cap on reserve depletion within the window
        for (let day = 0; day < gameDays && reserve > 0; day++) {
          for (const { member, dailyWood } of memberDaily) {
            if (reserve <= 0) break;
            const actual = Math.min(dailyWood, reserve);
            reserve -= actual;
            totalWood += actual;
            memberGained.set(member.id, (memberGained.get(member.id) ?? 0) + actual);
          }
        }

        if (totalWood > 0) {
          result.itemGains = { WOOD: Math.floor(totalWood) };
        }

        // Build WC XP gains (XP = wood produced, same as online tick)
        result.wcXpGains = memberDaily.map(({ member, wcLevel }) => {
          const gained = memberGained.get(member.id) ?? 0;
          const currentXp = member.craftSkills?.woodcutting.xpAccumulated ?? 0;
          const newXp = currentXp + gained;
          const newLevel = calcWcLevel(newXp);
          return {
            memberId: member.id,
            xpGained: gained,
            newXp,
            newLevel,
            leveledUp: newLevel > wcLevel,
          };
        });

        result.reserveUpdate = {
          facilityType: 'logging-site',
          facilityId: facility.id,
          newReserve: Math.max(0, reserve),
          depleted: reserve <= 0,
        };
        break;
      }

      case 'stone-quarry': {
        const levelMult = STONE_QUARRY_CONFIG.levelMult[facility.level - 1];
        let totalStone = 0;
        const mcXpGains: MiningXpGain[] = [];

        for (const member of assignedMembers) {
          const { STR } = member.stats;
          const baseScore = STR * 0.5;
          const currentXp = member.craftSkills?.mining?.xpAccumulated ?? 0;
          const currentLevel = calcMcLevel(currentXp);
          const yieldMult = 1 + STONE_QUARRY_CONFIG.mcSkillYieldPct[currentLevel] / 100;

          // Per-day stone (skip vein strikes offline — those are event loot).
          // TICKS_PER_DAY === STONE_QUARRY_CONFIG.ticksPerDay (1800) — the online tick path uses
          // the same constant for strike probability, so online/offline rates stay in lockstep.
          const dailyStone =
            STONE_QUARRY_CONFIG.baseRate *
            (baseScore / 100) *
            levelMult *
            yieldMult *
            TICKS_PER_DAY;
          const stoneForMember = dailyStone * gameDays;
          totalStone += stoneForMember;

          // MC XP = stone produced (matches online formula)
          const newXp = currentXp + stoneForMember;
          const newLevel = calcMcLevel(newXp);
          mcXpGains.push({
            memberId: member.id,
            xpGained: stoneForMember,
            newXp,
            newLevel,
            leveledUp: newLevel > currentLevel,
          });
        }

        if (totalStone > 0) {
          result.itemGains = { STONE: Math.floor(totalStone) };
        }
        result.mcXpGains = mcXpGains;
        break;
      }

      // workshop + alchemy-lab: queue-based — handled by their own offline systems
    }

    results.push(result);
  }

  return results;
}
