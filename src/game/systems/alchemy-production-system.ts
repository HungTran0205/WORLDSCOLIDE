/**
 * Pure functions for Alchemy Lab production per game-day.
 * Mechanic: AC LvN → uses (N+1) SLIME_GEL per batch → produces (N+1) HEALING_SYRINGE.
 * Caller is responsible for applying results to the store.
 */

import type { GuildFacility, Member } from '@/game/state/game-state';
import { ALCHEMY_CONFIG } from '@/game/data/facility-definitions';

export interface AcXpGain {
  memberId: string;
  xpGained: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
}

export interface AlchemyProductionResult {
  /** HEALING_SYRINGE produced this cycle */
  syringesProduced: number;
  /** SLIME_GEL consumed this cycle */
  gelConsumed: number;
  /** Alchemy XP gains per member */
  acXpGains: AcXpGain[];
  /** Members whose batches were skipped due to insufficient SLIME_GEL in inventory */
  blockedMemberIds: string[];
}

/** Map total XP accumulated → AC skill level 0–10 */
export function calcAcLevel(xp: number): number {
  const thresholds = ALCHEMY_CONFIG.acSkillThresholds;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) return i;
  }
  return 0;
}

/**
 * Process Alchemy Lab production for gameDays elapsed.
 * availableGel: current SLIME_GEL count in guild inventory — batches stop when gel runs out.
 */
export function processAlchemyProduction(
  facilities: GuildFacility[],
  allMembers: Member[],
  availableGel: number,
  gameDays: number,
): AlchemyProductionResult {
  const result: AlchemyProductionResult = {
    syringesProduced: 0,
    gelConsumed: 0,
    acXpGains: [],
    blockedMemberIds: [],
  };

  if (gameDays <= 0) return result;

  let remainingGel = availableGel;

  for (const facility of facilities) {
    if (facility.type !== 'alchemy-lab' || facility.level === 0) continue;
    if (facility.assignedMemberIds.length === 0) continue;

    const assignedMembers = allMembers.filter((m) => facility.assignedMemberIds.includes(m.id));
    if (assignedMembers.length === 0) continue;

    for (const member of assignedMembers) {
      const { INT, DEX } = member.stats;
      const acXp = member.craftSkills?.alchemy?.xpAccumulated ?? 0;
      const acLevel = calcAcLevel(acXp);
      const gelesPerBatch = ALCHEMY_CONFIG.ingredientCountFormula(acLevel);
      const batchesPerDay = ALCHEMY_CONFIG.batchesPerDay(INT, DEX, facility.level);
      const totalBatches = batchesPerDay * gameDays;

      // Cap batches by available gel
      const maxBatchesFromGel = Math.floor(remainingGel / gelesPerBatch);
      if (maxBatchesFromGel === 0) {
        result.blockedMemberIds.push(member.id);
        continue;
      }

      const batchesDone = Math.min(totalBatches, maxBatchesFromGel);
      const gelUsed = batchesDone * gelesPerBatch;
      const syringesMade = batchesDone * gelesPerBatch; // 1 syringe per gel consumed

      remainingGel -= gelUsed;
      result.gelConsumed += gelUsed;
      result.syringesProduced += syringesMade;

      const newXp = acXp + syringesMade;
      const newLevel = calcAcLevel(newXp);
      result.acXpGains.push({
        memberId: member.id,
        xpGained: syringesMade,
        newXp,
        newLevel,
        leveledUp: newLevel > acLevel,
      });
    }
  }

  return result;
}
