/** Static rank definitions — perks, promotion requirements, display metadata */

import type { GuildRank, MemberRank } from '@/game/state/game-state';

export interface RankPerks {
  upkeepModifier: number;   // multiplier on upkeep cost (1.0 = normal, 0.85 = 15% discount)
  expBonusPct: number;      // % bonus EXP from missions (0 = none, 10 = +10%)
}

export interface PromotionRequirements {
  minLevel: number;
  minMissionsCompleted: number;
  goldCost: number;
}

export interface RankDefinition {
  rank: GuildRank;
  label: string;
  color: string;
  order: number;             // 0=RECRUIT, 4=COMMANDER — for sorting & comparison
  perks: RankPerks;
  promotion: PromotionRequirements | null; // null = max rank (COMMANDER)
}

export const GUILD_RANKS: Record<GuildRank, RankDefinition> = {
  RECRUIT: {
    rank: 'RECRUIT',
    label: 'Recruit',
    color: '#95a5a6',
    order: 0,
    perks: { upkeepModifier: 0.8, expBonusPct: 0 },
    promotion: { minLevel: 3, minMissionsCompleted: 5, goldCost: 200 },
  },
  MEMBER: {
    rank: 'MEMBER',
    label: 'Member',
    color: '#3498db',
    order: 1,
    perks: { upkeepModifier: 1.0, expBonusPct: 5 },
    promotion: { minLevel: 8, minMissionsCompleted: 20, goldCost: 800 },
  },
  VETERAN: {
    rank: 'VETERAN',
    label: 'Veteran',
    color: '#2ecc71',
    order: 2,
    perks: { upkeepModifier: 1.0, expBonusPct: 10 },
    promotion: { minLevel: 15, minMissionsCompleted: 50, goldCost: 2500 },
  },
  OFFICER: {
    rank: 'OFFICER',
    label: 'Officer',
    color: '#9b59b6',
    order: 3,
    perks: { upkeepModifier: 1.15, expBonusPct: 15 },
    promotion: { minLevel: 25, minMissionsCompleted: 100, goldCost: 8000 },
  },
  COMMANDER: {
    rank: 'COMMANDER',
    label: 'Commander',
    color: '#ffd700',
    order: 4,
    perks: { upkeepModifier: 1.3, expBonusPct: 20 },
    promotion: null,
  },
};

/** Ordered list for iteration */
export const RANK_ORDER: GuildRank[] = ['RECRUIT', 'MEMBER', 'VETERAN', 'OFFICER', 'COMMANDER'];

/** Get next rank in hierarchy, or null if max */
export function getNextRank(current: GuildRank): GuildRank | null {
  const idx = RANK_ORDER.indexOf(current);
  return idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : null;
}

/** Check if member meets NON-GOLD promotion requirements (level + missions) */
export function meetsPromotionRequirements(
  member: { rank: MemberRank; level: number; missionsCompleted: number },
): boolean {
  if (member.rank === 'MERCENARY') return false;
  const def = GUILD_RANKS[member.rank as GuildRank];
  if (!def?.promotion) return false;
  const req = def.promotion;
  return member.level >= req.minLevel && member.missionsCompleted >= req.minMissionsCompleted;
}

/** Full eligibility check including gold. Use this for UI disabled state. */
export function canPromote(
  member: { rank: MemberRank; level: number; missionsCompleted: number },
  gold: number,
): boolean {
  if (!meetsPromotionRequirements(member)) return false;
  const def = GUILD_RANKS[member.rank as GuildRank];
  return gold >= def!.promotion!.goldCost;
}
