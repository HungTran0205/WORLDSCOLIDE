import type { StateCreator } from 'zustand';
import type { Member, MemberStatus, StatKey } from './game-state';
import { expToNextLevel, LEVEL_UP_BONUS_POINTS } from '@/game/systems/leveling-system';

export interface RosterSlice {
  founder: Member | null;
  roster: Member[];
  setFounder: (member: Member) => void;
  addMember: (member: Member) => void;
  removeMember: (id: string) => void;
  updateMemberStatus: (id: string, status: MemberStatus) => void;
  setMemberInjuredUntil: (id: string, until: number | null) => void;
  allocateStat: (memberId: string, stat: StatKey) => void;
  addMemberExp: (memberId: string, exp: number) => void;
}

function applyExpGain(member: Member, exp: number): Member {
  let newExp = member.exp + exp;
  let newLevel = member.level;
  let newPoints = member.unallocatedPoints;

  while (newExp >= expToNextLevel(newLevel)) {
    newExp -= expToNextLevel(newLevel);
    newLevel++;
    newPoints += LEVEL_UP_BONUS_POINTS;
  }

  return { ...member, exp: newExp, level: newLevel, unallocatedPoints: newPoints };
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
