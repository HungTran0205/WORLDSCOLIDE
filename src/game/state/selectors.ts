import type { GameStore } from './store';
import type { Member, QuestTier } from './game-state';

/** Members not on mission, not injured */
export const selectAvailableMembers = (s: GameStore): Member[] => {
  const all = s.founder ? [s.founder, ...s.roster] : s.roster;
  return all.filter((m) => m.status === 'idle');
};

/** All members including founder */
export const selectAllMembers = (s: GameStore): Member[] => {
  return s.founder ? [s.founder, ...s.roster] : s.roster;
};

/** Total daily upkeep cost: 10 gold per member per game-day */
const UPKEEP_PER_MEMBER = 10;
export const selectTotalUpkeep = (s: GameStore): number => {
  const count = s.roster.length + (s.founder ? 1 : 0);
  return count * UPKEEP_PER_MEMBER;
};

/** Whether guild can afford next upkeep */
export const selectCanAffordUpkeep = (s: GameStore): boolean => {
  return s.gold >= selectTotalUpkeep(s);
};

/** Quest tiers unlocked based on guild level */
const TIER_UNLOCK: Record<number, QuestTier[]> = {
  1: ['F', 'E'],
  2: ['F', 'E', 'D'],
  3: ['F', 'E', 'D', 'C'],
  4: ['F', 'E', 'D', 'C', 'B'],
  5: ['F', 'E', 'D', 'C', 'B', 'A'],
  6: ['F', 'E', 'D', 'C', 'B', 'A', 'S'],
};

export const selectUnlockedTiers = (s: GameStore): QuestTier[] => {
  return TIER_UNLOCK[Math.min(s.guildLevel, 6)] ?? ['F'];
};
