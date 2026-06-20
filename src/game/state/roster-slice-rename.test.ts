/**
 * roster-slice renameMember — validation + rank/founder gating.
 * Members are renameable; mercenaries are not; the founder lives outside the
 * roster (separate `founder` entity) so it is structurally never renamed here.
 */

import { describe, it, expect } from 'vitest';
import { createRosterSlice, type RosterSlice } from './roster-slice';
import type { Member, Stats } from './game-state';

const zeroStats = (): Stats => ({ STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 });

function makeMember(id: string, name: string, isMercenary = false): Member {
  return {
    id, name, grade: 'F', isMercenary, stats: zeroStats(), unallocatedPoints: 0,
    skill: null, status: 'idle', injuredUntil: null, civilization: 'LinhSon',
    isFounder: false, missionsCompleted: 0,
  };
}

/** Minimal zustand harness around the roster slice. */
function makeStore(initialRoster: Member[]) {
  let state: RosterSlice = {} as RosterSlice;
  const set = (partial: unknown) => {
    const next = typeof partial === 'function'
      ? (partial as (s: RosterSlice) => Partial<RosterSlice>)(state)
      : partial;
    state = { ...state, ...(next as Partial<RosterSlice>) };
  };
  const get = () => state;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state = createRosterSlice(set as any, get as any, {} as any);
  state.roster = initialRoster;
  return { get };
}

describe('renameMember', () => {
  it('renames a MEMBER and trims surrounding whitespace', () => {
    const store = makeStore([makeMember('m1', 'Old')]);
    store.get().renameMember('m1', '  Trần Minh  ');
    expect(store.get().roster.find((m) => m.id === 'm1')?.name).toBe('Trần Minh');
  });

  it('clamps to 24 characters', () => {
    const store = makeStore([makeMember('m1', 'Old')]);
    store.get().renameMember('m1', 'x'.repeat(40));
    expect(store.get().roster.find((m) => m.id === 'm1')?.name).toBe('x'.repeat(24));
  });

  it('rejects empty / whitespace-only names (keeps old)', () => {
    const store = makeStore([makeMember('m1', 'Keep')]);
    store.get().renameMember('m1', '   ');
    expect(store.get().roster.find((m) => m.id === 'm1')?.name).toBe('Keep');
  });

  it('is a no-op for mercenaries', () => {
    const store = makeStore([makeMember('merc1', 'Hired Blade', true)]);
    store.get().renameMember('merc1', 'New Name');
    expect(store.get().roster.find((m) => m.id === 'merc1')?.name).toBe('Hired Blade');
  });

  it('is a no-op for an unknown id', () => {
    const store = makeStore([makeMember('m1', 'Stable')]);
    store.get().renameMember('does-not-exist', 'X');
    expect(store.get().roster.find((m) => m.id === 'm1')?.name).toBe('Stable');
  });
});
