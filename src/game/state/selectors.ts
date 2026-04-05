import type { GameStore } from './store';
import type { Member, QuestTier } from './game-state';
import { calcTotalUpkeep } from '@/game/systems/upkeep-system';
import { calcMemberDerivedStats, type MemberDerivedStats } from '@/game/systems/member-derived-stats';
import type { DerivedCombatStats } from '@/game/systems/derived-combat-stats';
import type { DerivedGuildStats } from '@/game/systems/derived-guild-stats';

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

/** Full derived stats for a single member — combat + guild read-model. */
export const selectMemberDerivedStats = (member: Member): MemberDerivedStats =>
  calcMemberDerivedStats(member);

/** Combat stat section for a single member — view-model for member book combat panel. */
export const selectMemberCombatStats = (member: Member): DerivedCombatStats =>
  calcMemberDerivedStats(member).combat;

/** Guild stat section for a single member — cheap convenience selector for UI. */
export const selectMemberGuildStats = (member: Member): DerivedGuildStats =>
  calcMemberDerivedStats(member).guild;

/** All members with their derived guild stats, sorted by influence descending. */
export const selectRosterGuildStats = (s: GameStore): Array<{ member: Member; guild: DerivedGuildStats }> => {
  const all = s.founder ? [s.founder, ...s.roster] : s.roster;
  return all
    .map((m) => ({ member: m, guild: calcMemberDerivedStats(m).guild }))
    .sort((a, b) => b.guild.influence - a.guild.influence);
};
