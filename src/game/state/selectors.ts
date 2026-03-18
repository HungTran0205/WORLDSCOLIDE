import type { GameStore } from './store';
import type { Member, QuestTier } from './game-state';
import { calcTotalUpkeep } from '@/game/systems/upkeep-system';

/** Members not on mission, not injured */
export const selectAvailableMembers = (s: GameStore): Member[] => {
  const all = s.founder ? [s.founder, ...s.roster] : s.roster;
  return all.filter((m) => m.status === 'idle');
};

/** All members including founder */
export const selectAllMembers = (s: GameStore): Member[] => {
  return s.founder ? [s.founder, ...s.roster] : s.roster;
};

/** Total daily upkeep cost — rank-aware, mercenaries excluded */
export const selectTotalUpkeep = (s: GameStore): number => {
  const all = s.founder ? [s.founder, ...s.roster] : s.roster;
  return calcTotalUpkeep(all);
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
