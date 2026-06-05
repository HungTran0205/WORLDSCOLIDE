/**
 * Per-tick Stone Quarry production — Mining Skill (MC) + Vein Strike system.
 * Infinite reserve (no depletion). Pure functions — no store access, no side effects.
 */

import type { GuildFacility, Member } from '@/game/state/game-state';
import type { ItemID } from '@/game/data/items';
import { STONE_QUARRY_CONFIG } from '@/game/data/facility-definitions';
import { calcDerivedGuildStats } from './derived-guild-stats';
import { gradeIndex } from '@/game/data/grades';

export interface MiningXpGain {
  memberId: string;
  xpGained: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
}

export interface StoneQuarryTickResult {
  mcXpGains: MiningXpGain[];
  /** Total stone produced this tick (normal + rich stone vein bonus) */
  stoneProduced: number;
  /** Bonus items from vein strikes: IRON_ORE and/or GEM */
  bonusItemGains: Partial<Record<ItemID, number>>;
}

/** Map total XP accumulated → MC skill level 0–10 */
export function calcMcLevel(xp: number): number {
  const thresholds = STONE_QUARRY_CONFIG.mcSkillThresholds;
  // Scan from highest level down; thresholds[0]=0 guarantees a match
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) return i;
  }
  /* istanbul ignore next */
  return 0; // unreachable: thresholds[0]=0 always matches xp>=0
}

/**
 * Per-tick Stone Quarry production (called every 1s game tick).
 * Pure function — returns result to be applied by applyStoneQuarryProduction action.
 */
export function processStoneQuarryTick(
  facilities: GuildFacility[],
  allMembers: Member[],
): StoneQuarryTickResult {
  const result: StoneQuarryTickResult = {
    mcXpGains: [],
    stoneProduced: 0,
    bonusItemGains: {},
  };

  for (const facility of facilities) {
    if (facility.type !== 'stone-quarry' || facility.level === 0) continue;
    if (facility.assignedMemberIds.length === 0) continue;

    const level = facility.level;
    const levelMult = STONE_QUARRY_CONFIG.levelMult[level - 1];
    const levelStrikeBonus = STONE_QUARRY_CONFIG.levelStrikeBonus[level - 1];

    const assignedMembers = allMembers.filter((m) => facility.assignedMemberIds.includes(m.id));
    if (assignedMembers.length === 0) continue;

    for (const member of assignedMembers) {
      const { STR } = member.stats;
      const baseScore = STR * 0.5;

      const mcXp = member.craftSkills?.mining?.xpAccumulated ?? 0;
      const mcLevel = calcMcLevel(mcXp);
      const yieldMult = 1 + STONE_QUARRY_CONFIG.mcSkillYieldPct[mcLevel] / 100;

      // Stone produced this tick
      const stoneThisTick = STONE_QUARRY_CONFIG.baseRate * (baseScore / 100) * levelMult * yieldMult;
      let stoneForMember = stoneThisTick;

      // Vein strike probability (convert daily chance to per-tick)
      const { fortune } = calcDerivedGuildStats(member.stats, gradeIndex(member.grade));
      const dailyStrikeChance =
        STONE_QUARRY_CONFIG.baseStrikeChancePerDay +
        STONE_QUARRY_CONFIG.mcSkillStrikePct[mcLevel] +
        fortune * STONE_QUARRY_CONFIG.fortuneStrikeScale +
        levelStrikeBonus;
      const perTickStrikeChance = dailyStrikeChance / STONE_QUARRY_CONFIG.ticksPerDay;

      if (Math.random() < perTickStrikeChance) {
        const roll = Math.random();
        if (roll < STONE_QUARRY_CONFIG.veinWeights[0]) {
          // Iron Vein
          const [min, max] = STONE_QUARRY_CONFIG.ironOreRange;
          const qty = Math.floor(Math.random() * (max - min + 1)) + min;
          result.bonusItemGains.IRON_ORE = (result.bonusItemGains.IRON_ORE ?? 0) + qty;
        } else if (roll < STONE_QUARRY_CONFIG.veinWeights[1]) {
          // Rich Stone Pocket
          const [min, max] = STONE_QUARRY_CONFIG.richStoneBonusRange;
          const bonus = Math.floor(Math.random() * (max - min + 1)) + min;
          stoneForMember += bonus;
        } else {
          // Gem Vein
          result.bonusItemGains.GEM = (result.bonusItemGains.GEM ?? 0) + 1;
        }
      }

      result.stoneProduced += stoneForMember;

      // MC skill XP = stone produced (base tick only, not vein bonus — vein is event loot)
      const newXp = mcXp + stoneThisTick;
      const newLevel = calcMcLevel(newXp);
      result.mcXpGains.push({
        memberId: member.id,
        xpGained: stoneThisTick,
        newXp,
        newLevel,
        leveledUp: newLevel > mcLevel,
      });
    }
  }

  return result;
}
