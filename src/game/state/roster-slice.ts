import type { StateCreator } from 'zustand';
import type { Member, MemberStatus, StatKey } from './game-state';

export interface RosterSlice {
  founder: Member | null;
  roster: Member[];
  setFounder: (member: Member) => void;
  addMember: (member: Member) => void;
  removeMember: (id: string) => void;
  /** Rename a roster member. No-op for the founder (not in roster) and mercenaries. Trims, rejects empty, clamps to 24 chars. */
  renameMember: (id: string, name: string) => void;
  updateMemberStatus: (id: string, status: MemberStatus) => void;
  setMemberInjuredUntil: (id: string, until: number | null) => void;
  /** Mark a member injured under the recovery engine: status='injured', progress reset to 0,
   *  `baseRecoveryMs` + `injuredAt` recorded, legacy `injuredUntil` nulled (progress is the driver). */
  injureMember: (memberId: string, baseRecoveryMs: number, injuredAt: number) => void;
  toggleAutoCast: (memberId: string) => void;
  allocateStat: (memberId: string, stat: StatKey, amount?: number) => void;
  /** Increment missionsCompleted counter for given member IDs */
  incrementMissionsCompleted: (memberIds: string[]) => void;
  /** Apply one recovery tick: set progress on still-injured members,
   *  clear (→ idle, fields nulled) members who reached 100%. Single set(). */
  applyInjuryRecovery: (
    progressUpdates: { id: string; progress: number }[],
    recoveredIds: string[],
  ) => void;
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

  renameMember: (id, name) =>
    set((s) => {
      const trimmed = name.trim().slice(0, 24);
      if (!trimmed) return s;
      return {
        roster: s.roster.map((m) =>
          m.id === id && !m.isMercenary ? { ...m, name: trimmed } : m,
        ),
      };
    }),

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

  injureMember: (memberId, baseRecoveryMs, injuredAt) =>
    set((s) => {
      const injure = (m: Member): Member => ({
        ...m,
        status: 'injured',
        injuredAt,
        baseRecoveryMs,
        recoveryProgress: 0,
        injuredUntil: null,
      });
      if (s.founder?.id === memberId) {
        return { founder: injure(s.founder) };
      }
      return { roster: updateMember(s.roster, memberId, injure) };
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

  allocateStat: (memberId, stat, amount = 1) =>
    set((s) => {
      const updater = (m: Member): Member => {
        const pts = Math.min(amount, m.unallocatedPoints);
        if (pts <= 0) return m;
        return {
          ...m,
          stats: { ...m.stats, [stat]: m.stats[stat] + pts },
          unallocatedPoints: m.unallocatedPoints - pts,
        };
      };
      if (s.founder?.id === memberId) {
        return { founder: updater(s.founder) };
      }
      return { roster: updateMember(s.roster, memberId, updater) };
    }),

  incrementMissionsCompleted: (memberIds) =>
    set((s) => {
      const idSet = new Set(memberIds);
      const updatedFounder = s.founder && idSet.has(s.founder.id)
        ? { ...s.founder, missionsCompleted: s.founder.missionsCompleted + 1 }
        : s.founder;
      return {
        founder: updatedFounder,
        roster: s.roster.map((m) =>
          idSet.has(m.id) ? { ...m, missionsCompleted: m.missionsCompleted + 1 } : m
        ),
      };
    }),

  applyInjuryRecovery: (progressUpdates, recoveredIds) =>
    set((s) => {
      if (progressUpdates.length === 0 && recoveredIds.length === 0) return s;
      const progressById = new Map(progressUpdates.map((u) => [u.id, u.progress]));
      const recoveredSet = new Set(recoveredIds);
      const apply = (m: Member): Member => {
        if (recoveredSet.has(m.id)) {
          // Fully healed → back to idle, injury fields cleared.
          return {
            ...m,
            status: 'idle',
            injuredAt: null,
            baseRecoveryMs: null,
            injuredUntil: null,
            recoveryProgress: 0,
          };
        }
        const next = progressById.get(m.id);
        return next === undefined ? m : { ...m, recoveryProgress: next };
      };
      return {
        founder: s.founder ? apply(s.founder) : s.founder,
        roster: s.roster.map(apply),
      };
    }),
});
