/**
 * Blessed regen engine tests.
 *
 * Covers processBlessedRegen:
 *  - accrual rate (dt / BLESSED_FULL_MS), cap at 1, already-full skip
 *  - frozen-while-dispatched (busy-set from active mission parties)
 *  - Linh Sơn-only gating, founder coverage, dt<=0 no-op
 *  - offline catch-up math via a full-window dt
 *
 * Deterministic — explicit `dtMs`, no fake timers. The rate is asserted relative
 * to the real BLESSED_FULL_MS const (no scaled-down magic numbers).
 */

import { describe, it, expect, vi } from 'vitest';
import { processBlessedRegen, BLESSED_FULL_MS } from '@/game/systems/blessed-regen-system';
import type { Member, ActiveMission } from '@/game/state/game-state';
import type { GameStore } from '@/game/state/store';

// ── Factories ────────────────────────────────────────────────────────────────

function makeMember(id: string, overrides: Partial<Member> = {}): Member {
  return {
    id,
    name: id,
    grade: 'D',
    isMercenary: false,
    stats: { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    unallocatedPoints: 0,
    skill: null,
    status: 'idle',
    injuredUntil: null,
    civilization: 'LinhSon',
    isFounder: false,
    missionsCompleted: 0,
    blessedPct: 0,
    ...overrides,
  };
}

function makeMission(memberIds: string[]): ActiveMission {
  return { memberIds } as ActiveMission;
}

/** Mirror the live store shape processBlessedRegen reads: founder = members[0]. */
function makeStore(members: Member[], activeMissions: ActiveMission[] = []) {
  const applyBlessedRegen = vi.fn();
  return {
    founder: members[0] ?? null,
    roster: members.slice(1),
    activeMissions,
    applyBlessedRegen,
  } as unknown as GameStore & { applyBlessedRegen: ReturnType<typeof vi.fn> };
}

// ── processBlessedRegen ──────────────────────────────────────────────────────

describe('processBlessedRegen', () => {
  it('accrues dt / BLESSED_FULL_MS for an idle Linh Sơn member', () => {
    const store = makeStore([makeMember('a', { blessedPct: 0 })]);
    processBlessedRegen(store, BLESSED_FULL_MS / 2);
    expect(store.applyBlessedRegen).toHaveBeenCalledWith([
      { id: 'a', pct: expect.closeTo(0.5) },
    ]);
  });

  it('fills 0→1 over a full BLESSED_FULL_MS window', () => {
    const store = makeStore([makeMember('a', { blessedPct: 0 })]);
    processBlessedRegen(store, BLESSED_FULL_MS);
    expect(store.applyBlessedRegen).toHaveBeenCalledWith([
      { id: 'a', pct: expect.closeTo(1) },
    ]);
  });

  it('caps at 1 — over-credit (e.g. offline overshoot) is harmless', () => {
    const store = makeStore([makeMember('a', { blessedPct: 0.9 })]);
    processBlessedRegen(store, BLESSED_FULL_MS); // would be 1.9 uncapped
    expect(store.applyBlessedRegen).toHaveBeenCalledWith([{ id: 'a', pct: 1 }]);
  });

  it('skips members already at full (no write for a no-op set)', () => {
    const store = makeStore([makeMember('a', { blessedPct: 1 })]);
    processBlessedRegen(store, BLESSED_FULL_MS);
    expect(store.applyBlessedRegen).not.toHaveBeenCalled();
  });

  it('treats a missing blessedPct as full (1) and skips it', () => {
    const store = makeStore([makeMember('a', { blessedPct: undefined })]);
    processBlessedRegen(store, BLESSED_FULL_MS);
    expect(store.applyBlessedRegen).not.toHaveBeenCalled();
  });

  it('does NOT regen a member dispatched on an active mission', () => {
    // One dispatched (busy), one idle — only the idle member accrues.
    const dispatched = makeMember('dispatched', { blessedPct: 0, status: 'on-mission' });
    const idle = makeMember('idle', { blessedPct: 0 });
    const store = makeStore([dispatched, idle], [makeMission(['dispatched'])]);
    processBlessedRegen(store, BLESSED_FULL_MS / 2);
    const [updates] = store.applyBlessedRegen.mock.calls[0];
    expect(updates).toEqual([{ id: 'idle', pct: expect.closeTo(0.5) }]);
  });

  it('builds the busy-set across every active mission party (flatMap)', () => {
    const a = makeMember('a', { blessedPct: 0 });
    const b = makeMember('b', { blessedPct: 0 });
    const c = makeMember('c', { blessedPct: 0 });
    const store = makeStore([a, b, c], [makeMission(['a']), makeMission(['b'])]);
    processBlessedRegen(store, BLESSED_FULL_MS / 2);
    const [updates] = store.applyBlessedRegen.mock.calls[0];
    // a and b are busy in two separate missions; only c regens.
    expect(updates).toEqual([{ id: 'c', pct: expect.closeTo(0.5) }]);
  });

  it('does NOT regen non-Linh-Sơn members', () => {
    const store = makeStore([makeMember('a', { blessedPct: 0, civilization: 'DeQuoc' })]);
    processBlessedRegen(store, BLESSED_FULL_MS);
    expect(store.applyBlessedRegen).not.toHaveBeenCalled();
  });

  it('includes the founder (members[0]) in regen', () => {
    const store = makeStore([makeMember('founder', { blessedPct: 0, isFounder: true })]);
    processBlessedRegen(store, BLESSED_FULL_MS / 4);
    expect(store.applyBlessedRegen).toHaveBeenCalledWith([
      { id: 'founder', pct: expect.closeTo(0.25) },
    ]);
  });

  it('is a no-op when dtMs is 0', () => {
    const store = makeStore([makeMember('a', { blessedPct: 0 })]);
    processBlessedRegen(store, 0);
    expect(store.applyBlessedRegen).not.toHaveBeenCalled();
  });
});
