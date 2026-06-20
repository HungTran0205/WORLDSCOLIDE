/**
 * Guild / non-combat derived stats calculators — section 3 of derived-stats-design.md.
 * All functions are pure: no store access, no side effects.
 */

import type { Stats } from '@/game/state/game-state';

export interface DerivedGuildStats {
  /** CHA×2 + INT×1 + gradeIdx×1 — recruit quality, quest tier unlock */
  influence: number;
  /** END×3 + STR×1 — mission duration capacity, work hours */
  stamina: number;
  /** DEX×2 + INT×1 — workshop rare item chance and quality */
  craftSkill: number;
  /** Additive EXP gain fraction: (DEX+AGI)×0.2% */
  trainingEff: number;
  /** Additive production speed fraction: STR×0.4% */
  gatherSpeed: number;
  /** CHA×2 + LCK×1 — tavern upkeep reduction, shop prices */
  negotiation: number;
  /** Injury recovery time multiplier (lower = faster, floor 0.2) */
  recovery: number;
  /** AGI×2 + LCK×1 — travel time reduction, hidden quests */
  exploration: number;
  /** CHA×2 + INT×1 + STR×0.5 — party size bonus, team morale */
  leadership: number;
  /** LCK×3 + CHA×0.5 — loot rarity, recruit quality, event bonus */
  fortune: number;
}

/**
 * Compute all guild derived stats for a member.
 * @param stats     Member's base talent stats
 * @param gradeIdx  Grade index 0–6 (gradeIndex(member.grade)) — affects influence
 */
export function calcDerivedGuildStats(stats: Stats, gradeIdx: number): DerivedGuildStats {
  const { STR, END, INT, DEX, CHA, LCK, AGI } = stats;
  return {
    influence: Math.floor(CHA * 2 + INT * 1 + gradeIdx * 1),
    stamina: Math.floor(END * 3 + STR * 1),
    craftSkill: Math.floor(DEX * 2 + INT * 1),
    trainingEff: (DEX + AGI) * 0.002,
    gatherSpeed: STR * 0.004,
    negotiation: Math.floor(CHA * 2 + LCK * 1),
    recovery: Math.max(0.2, 1 - (END + INT) * 0.001),
    exploration: Math.floor(AGI * 2 + LCK * 1),
    leadership: Math.floor(CHA * 2 + INT * 1 + STR * 0.5),
    fortune: Math.floor(LCK * 3 + CHA * 0.5),
  };
}
