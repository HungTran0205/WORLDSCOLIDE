/**
 * Ancestral Blessings (Linh Sơn) — buff trigger plumbing tests.
 *
 * Covers the non-tick pieces of Phase 3 (the per-tick latch itself lives in
 * combat-simulator.test.ts → "LinhSon passive — Ancestral Blessings"):
 *  - combat-entity-factory: blessedReady gate (full bar AND civ 'LinhSon')
 *  - collectBlessedConsumed: which ally ids drain their bar post-combat
 *  - roster-slice consumeBlessed: drains blessedPct → 0 for fired members only
 */

import { describe, it, expect } from 'vitest';
import { memberToArenaEntity } from '@/game/systems/combat-entity-factory';
import { collectBlessedConsumed } from '@/game/systems/combat-passives';
import { createRosterSlice, type RosterSlice } from '@/game/state/roster-slice';
import type { Member, Stats } from '@/game/state/game-state';
import type { CombatEntity } from '@/game/systems/combat-types';

const stats = (): Stats => ({ STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 10 });

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'm1', name: 'Templar', grade: 'C', isMercenary: false, stats: stats(),
    unallocatedPoints: 0, skill: null, status: 'idle', injuredUntil: null,
    civilization: 'LinhSon', archetype: 'sword', gender: 'M', isFounder: false,
    missionsCompleted: 0, equipment: null, blessedPct: 1, ...overrides,
  };
}

const pos = { x: 0, y: 0, z: 0 };

// ── blessedReady POC gate (combat-entity-factory) ────────────────────────────

describe('memberToArenaEntity — blessedReady gate', () => {
  it('arms blessedReady for any LinhSon archetype with a full bar', () => {
    for (const archetype of ['sword', 'scout', 'warrior'] as const) {
      const e = memberToArenaEntity(makeMember({ archetype, blessedPct: 1 }), pos);
      expect(e.blessedReady).toBe(true);
    }
  });

  it('does NOT arm when the bar is not full', () => {
    const e = memberToArenaEntity(makeMember({ archetype: 'sword', blessedPct: 0.9 }), pos);
    expect(e.blessedReady).toBe(false);
  });

  it('does NOT arm a non-LinhSon member, even at a full bar', () => {
    const e = memberToArenaEntity(makeMember({ civilization: 'DeQuoc', blessedPct: 1 }), pos);
    expect(e.blessedReady).toBe(false);
  });

  it('treats a missing blessedPct as full (getBlessedPct default)', () => {
    const e = memberToArenaEntity(makeMember({ archetype: 'sword', blessedPct: undefined }), pos);
    expect(e.blessedReady).toBe(true);
  });
});

// ── collectBlessedConsumed ───────────────────────────────────────────────────

describe('collectBlessedConsumed', () => {
  const ent = (id: string, isAlly: boolean, ancestralFired?: boolean): Pick<CombatEntity, 'id' | 'isAlly' | 'ancestralFired'> =>
    ({ id, isAlly, ancestralFired });

  it('returns only ally ids that fired', () => {
    const ids = collectBlessedConsumed([
      ent('a', true, true),
      ent('b', true, false),
      ent('c', true, undefined),
      ent('enemy', false, true), // enemy that somehow fired is excluded
    ]);
    expect(ids).toEqual(['a']);
  });

  it('returns [] when nobody fired', () => {
    expect(collectBlessedConsumed([ent('a', true, false), ent('b', true)])).toEqual([]);
  });
});

// ── roster-slice consumeBlessed ──────────────────────────────────────────────

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

describe('roster-slice consumeBlessed', () => {
  it('drains blessedPct → 0 for fired members only', () => {
    const store = makeStore([
      makeMember({ id: 'fired', blessedPct: 1 }),
      makeMember({ id: 'untouched', blessedPct: 1 }),
    ]);
    store.get().consumeBlessed(['fired']);
    const roster = store.get().roster;
    expect(roster.find((m) => m.id === 'fired')?.blessedPct).toBe(0);
    expect(roster.find((m) => m.id === 'untouched')?.blessedPct).toBe(1);
  });

  it('is a no-op for an empty list and ignores unknown / merc ids', () => {
    const store = makeStore([makeMember({ id: 'm1', blessedPct: 1 })]);
    store.get().consumeBlessed([]);
    store.get().consumeBlessed(['merc-not-in-roster']);
    expect(store.get().roster.find((m) => m.id === 'm1')?.blessedPct).toBe(1);
  });
});
