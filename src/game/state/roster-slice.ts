import type { StateCreator } from 'zustand';
import type { Member, MemberStatus, StatKey, Stats } from './game-state';
import { expToNextLevel, LEVEL_UP_BONUS_POINTS } from '@/game/systems/leveling-system';

const ALL_STATS: StatKey[] = ['STR', 'END', 'INT', 'DEX', 'CHA', 'LCK', 'AGI'];

/** Randomly distribute stat points across all stats (for mercenary level-ups) */
function autoDistributeStats(stats: Stats, points: number): Stats {
  const result = { ...stats };
  for (let i = 0; i < points; i++) {
    const key = ALL_STATS[Math.floor(Math.random() * ALL_STATS.length)];
    result[key] += 1;
  }
  return result;
}

export interface RosterSlice {
  founder: Member | null;
  roster: Member[];
  setFounder: (member: Member) => void;
  addMember: (member: Member) => void;
  removeMember: (id: string) => void;
  updateMemberStatus: (id: string, status: MemberStatus) => void;
  setMemberInjuredUntil: (id: string, until: number | null) => void;
  toggleAutoCast: (memberId: string) => void;
  allocateStat: (memberId: string, stat: StatKey) => void;
  addMemberExp: (memberId: string, exp: number) => void;
}

function applyExpGain(member: Member, exp: number): Member {
  let newExp = member.exp + exp;
  let newLevel = member.level;
  let newPoints = member.unallocatedPoints;
  let newStats = member.stats;

  while (newExp >= expToNextLevel(newLevel)) {
    newExp -= expToNextLevel(newLevel);
    newLevel++;
    if (member.rank === 'MERCENARY') {
      // Mercenaries auto-distribute stat points — no manual allocation
      newStats = autoDistributeStats(newStats, LEVEL_UP_BONUS_POINTS);
    } else {
      newPoints += LEVEL_UP_BONUS_POINTS;
    }
  }

  return { ...member, exp: newExp, level: newLevel, unallocatedPoints: newPoints, stats: newStats };
}

function updateMember(members: Member[], id: string, updater: (m: Member) => Member): Member[] {
  return members.map((m) => (m.id === id ? updater(m) : m));
}

export const createRosterSlice: StateCreator<RosterSlice> = (set) => ({
  founder: null,
  roster: [],

  setFounder: (member) => set({ founder: { ...member, isFounder: true } }),

  addMember: (member) => set((s) => ({ roster: [...s.roster, member] })),

  removeMember: (id) => set((s) => ({ roster: s.roster.filter((m) => m.id !== id) })),

  updateMemberStatus: (id, status) =>
    set((s) => {
      if (s.founder?.id === id) {
        return { founder: { ...s.founder, status } };
      }
      return { roster: updateMember(s.roster, id, (m) => ({ ...m, status })) };
    }),

  setMemberInjuredUntil: (id, until) =>
    set((s) => {
      if (s.founder?.id === id) {
        return { founder: { ...s.founder, injuredUntil: until, status: until ? 'injured' : 'idle' } };
      }
      return {
        roster: updateMember(s.roster, id, (m) => ({
          ...m,
          injuredUntil: until,
          status: until ? 'injured' : 'idle',
        })),
      };
    }),

  toggleAutoCast: (memberId) =>
    set((s) => {
      const toggler = (m: Member): Member => {
        if (!m.skill) return m;
        return { ...m, skill: { ...m.skill, autoEnabled: !m.skill.autoEnabled } };
      };
      if (s.founder?.id === memberId) {
        return { founder: toggler(s.founder) };
      }
      return { roster: updateMember(s.roster, memberId, toggler) };
    }),

  allocateStat: (memberId, stat) =>
    set((s) => {
      const updater = (m: Member): Member => {
        if (m.unallocatedPoints <= 0) return m;
        return {
          ...m,
          stats: { ...m.stats, [stat]: m.stats[stat] + 1 },
          unallocatedPoints: m.unallocatedPoints - 1,
        };
      };
      if (s.founder?.id === memberId) {
        return { founder: updater(s.founder) };
      }
      return { roster: updateMember(s.roster, memberId, updater) };
    }),

  addMemberExp: (memberId, exp) =>
    set((s) => {
      if (s.founder?.id === memberId) {
        return { founder: applyExpGain(s.founder, exp) };
      }
      return { roster: updateMember(s.roster, memberId, (m) => applyExpGain(m, exp)) };
    }),
});
