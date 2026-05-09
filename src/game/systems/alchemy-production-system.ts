/**
 * Pure functions for Alchemy Lab — AC skill helpers + offline queue advancement.
 * The lab is queue-based: jobs added via addAlchemyCraftJob, ticked online via
 * tickAlchemyQueues. This module advances the same queues over an offline window.
 */

import type { AlchemyCraftJob, GuildFacility, Member } from '@/game/state/game-state';
import type { ItemID } from '@/game/data/items';
import { ALCHEMY_CONFIG } from '@/game/data/facility-definitions';

export interface AcXpGain {
  memberId: string;
  xpGained: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
}

export interface AlchemyOfflineResult {
  /** Updated facility list — alchemy labs have advanced queues; others untouched. */
  facilities: GuildFacility[];
  /** Items produced this offline window (sum across all completed jobs). */
  itemGains: Partial<Record<ItemID, number>>;
  /** AC skill XP gains per member assigned to alchemy labs. */
  acXpGains: AcXpGain[];
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
 * Advance alchemy lab craft queues over an offline window.
 * Each job's `remainingSeconds` decrements by elapsedSecs; completed jobs
 * yield their output and award AC XP (split evenly across the lab's
 * assigned members) for HEALING_SYRINGE outputs.
 */
export function advanceAlchemyQueues(
  facilities: GuildFacility[],
  allMembers: Member[],
  elapsedSecs: number,
): AlchemyOfflineResult {
  const itemGains: Partial<Record<ItemID, number>> = {};
  // memberId → total syringes credited (used as XP)
  const xpAccum = new Map<string, number>();

  const updatedFacilities = facilities.map((facility) => {
    if (facility.type !== 'alchemy-lab' || !facility.craftQueue?.length) return facility;
    if (elapsedSecs <= 0) return facility;

    const assigned = allMembers.filter((m) => facility.assignedMemberIds.includes(m.id));

    let timeLeft = elapsedSecs;
    const newQueue: AlchemyCraftJob[] = [];
    for (const job of facility.craftQueue) {
      if (timeLeft <= 0) {
        newQueue.push(job);
        continue;
      }
      if (job.remainingSeconds <= timeLeft) {
        // Job completes
        timeLeft -= job.remainingSeconds;
        const out = job.outputItemId as ItemID;
        itemGains[out] = (itemGains[out] ?? 0) + job.outputQuantity;

        // AC XP for healing-syringe jobs — split equally among assigned alchemists
        if (out === 'HEALING_SYRINGE' && assigned.length > 0) {
          const xpPerMember = job.outputQuantity / assigned.length;
          for (const m of assigned) {
            xpAccum.set(m.id, (xpAccum.get(m.id) ?? 0) + xpPerMember);
          }
        }
      } else {
        newQueue.push({ ...job, remainingSeconds: job.remainingSeconds - timeLeft });
        timeLeft = 0;
      }
    }
    return { ...facility, craftQueue: newQueue };
  });

  const acXpGains: AcXpGain[] = [];
  for (const [memberId, xp] of xpAccum) {
    const member = allMembers.find((m) => m.id === memberId);
    if (!member) continue;
    const currentXp = member.craftSkills?.alchemy?.xpAccumulated ?? 0;
    const currentLevel = calcAcLevel(currentXp);
    const newXp = currentXp + xp;
    const newLevel = calcAcLevel(newXp);
    acXpGains.push({
      memberId,
      xpGained: xp,
      newXp,
      newLevel,
      leveledUp: newLevel > currentLevel,
    });
  }

  return { facilities: updatedFacilities, itemGains, acXpGains };
}
