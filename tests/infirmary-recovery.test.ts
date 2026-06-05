/**
 * Infirmary recovery engine + queue-resolver tests.
 *
 * Covers the GDD bed/queue model (replaces the obsolete flat-deadline path):
 *  - resolveInjuryQueue: FIFO partition, multi-infirmary bed sum, speed by max level.
 *  - processInjuryRecovery: passive vs bedded progress rate, recovery threshold,
 *    FIFO promotion, multi-infirmary acceleration, dt=0 no-op.
 *
 * Deterministic — uses explicit `dtMs`, no fake timers.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  resolveInjuryQueue,
  processInjuryRecovery,
} from '@/game/systems/infirmary-recovery';
import type { Member, GuildFacility } from '@/game/state/game-state';
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
    ...overrides,
  };
}

function makeInjured(
  id: string,
  injuredAt: number,
  baseRecoveryMs = 120_000,
  recoveryProgress = 0,
): Member {
  return makeMember(id, {
    status: 'injured',
    injuredAt,
    baseRecoveryMs,
    recoveryProgress,
  });
}

function makeInfirmary(id: string, level: number): GuildFacility {
  return {
    id,
    type: 'infirmary',
    level,
    assignedMemberIds: [],
    placedSlot: null,
    lastSkipDay: null,
  };
}

function makeStore(members: Member[], facilities: GuildFacility[]) {
  const applyInjuryRecovery = vi.fn();
  return {
    founder: members[0] ?? null,
    roster: members.slice(1),
    facilities,
    applyInjuryRecovery,
  } as unknown as GameStore & { applyInjuryRecovery: ReturnType<typeof vi.fn> };
}

// ── resolveInjuryQueue ───────────────────────────────────────────────────────

describe('resolveInjuryQueue', () => {
  it('returns no beds when no infirmary is built', () => {
    const members = [makeInjured('a', 100), makeInjured('b', 200)];
    const result = resolveInjuryQueue(members, []);
    expect(result.beds).toBe(0);
    expect(result.level).toBe(0);
    expect(result.rows.every((r) => !r.bedded)).toBe(true);
    expect(result.rows.every((r) => r.speedFactor === 1.0)).toBe(true);
  });

  it('partitions injured FIFO by injuredAt (oldest first)', () => {
    const members = [
      makeInjured('young', 500),
      makeInjured('mid', 200),
      makeInjured('old', 100),
    ];
    const result = resolveInjuryQueue(members, [makeInfirmary('infirmary', 1)]);
    expect(result.rows.map((r) => r.member.id)).toEqual(['old', 'mid', 'young']);
    expect(result.rows[0].bedded).toBe(true);
    expect(result.rows[1].bedded).toBe(false);
    expect(result.rows[2].bedded).toBe(false);
  });

  it('tie-breaks identical injuredAt by member id (lexical)', () => {
    const members = [makeInjured('z', 100), makeInjured('a', 100), makeInjured('m', 100)];
    const result = resolveInjuryQueue(members, [makeInfirmary('infirmary', 1)]);
    expect(result.rows.map((r) => r.member.id)).toEqual(['a', 'm', 'z']);
  });

  it('applies the correct speed factor per infirmary level', () => {
    const members = [makeInjured('a', 100)];
    const lv1 = resolveInjuryQueue(members, [makeInfirmary('infirmary', 1)]);
    const lv2 = resolveInjuryQueue(members, [makeInfirmary('infirmary', 2)]);
    const lv3 = resolveInjuryQueue(members, [makeInfirmary('infirmary', 3)]);
    expect(lv1.rows[0].speedFactor).toBeCloseTo(0.6);
    expect(lv2.rows[0].speedFactor).toBeCloseTo(0.5);
    expect(lv3.rows[0].speedFactor).toBeCloseTo(0.4);
  });

  it('computes remainingMs from progress, base, and speed factor', () => {
    const members = [makeInjured('a', 100, 100_000, 0.25)];
    const { rows } = resolveInjuryQueue(members, [makeInfirmary('infirmary', 3)]);
    // (1 - 0.25) * 100_000 * 0.4 = 30_000
    expect(rows[0].remainingMs).toBeCloseTo(30_000);
  });

  it('sums beds across multiple infirmaries; speed uses the highest level', () => {
    const members = [
      makeInjured('a', 100),
      makeInjured('b', 200),
      makeInjured('c', 300),
      makeInjured('d', 400),
      makeInjured('e', 500),
    ];
    const facilities = [
      makeInfirmary('infirmary', 1),       // 1 bed
      makeInfirmary('infirmary-2', 3),     // 3 beds
    ];
    const result = resolveInjuryQueue(members, facilities);
    expect(result.beds).toBe(4); // 1 + 3
    expect(result.level).toBe(3); // max
    expect(result.rows.filter((r) => r.bedded)).toHaveLength(4);
    // every bedded member gets the lv3 ×0.4 rate (not a per-instance mix)
    for (const row of result.rows.filter((r) => r.bedded)) {
      expect(row.speedFactor).toBeCloseTo(0.4);
    }
    expect(result.rows[4].bedded).toBe(false);
    expect(result.rows[4].position).toBe(0); // first in queue
  });

  it('ignores infirmary instances at level 0', () => {
    const members = [makeInjured('a', 100)];
    const result = resolveInjuryQueue(members, [makeInfirmary('infirmary', 0)]);
    expect(result.beds).toBe(0);
    expect(result.rows[0].bedded).toBe(false);
  });
});

// ── processInjuryRecovery ────────────────────────────────────────────────────

describe('processInjuryRecovery', () => {
  it('advances progress at the passive rate when no infirmary is built', () => {
    const members = [makeInjured('a', 100, 100_000, 0)];
    const store = makeStore(members, []);
    processInjuryRecovery(store, 10_000);
    // passive: 10_000 / 100_000 / 1.0 = 0.1
    expect(store.applyInjuryRecovery).toHaveBeenCalledWith(
      [{ id: 'a', progress: expect.closeTo(0.1) }],
      [],
    );
  });

  it('advances bedded progress 2.5× passive at Lv3 (1 / 0.4)', () => {
    const members = [makeInjured('a', 100, 100_000, 0)];
    const store = makeStore(members, [makeInfirmary('infirmary', 3)]);
    processInjuryRecovery(store, 10_000);
    // bedded lv3: (10_000 / 100_000) / 0.4 = 0.25
    expect(store.applyInjuryRecovery).toHaveBeenCalledWith(
      [{ id: 'a', progress: expect.closeTo(0.25) }],
      [],
    );
  });

  it('marks members as recovered when progress reaches 1', () => {
    const members = [
      makeInjured('done', 100, 100_000, 0.95),
      makeInjured('still', 200, 100_000, 0.5),
    ];
    const store = makeStore(members, []);
    processInjuryRecovery(store, 10_000);
    const [updates, recovered] = store.applyInjuryRecovery.mock.calls[0];
    expect(recovered).toEqual(['done']);
    expect(updates).toEqual([{ id: 'still', progress: expect.closeTo(0.6) }]);
  });

  it('FIFO promotion: recovering the bedded member lets the next-oldest bed next tick', () => {
    // Two injured, 1 bed. The older one (a) is bedded and on the edge of recovery.
    const members = [
      makeInjured('a', 100, 100_000, 0.99), // bedded, ~recovers
      makeInjured('b', 200, 100_000, 0),    // queued
    ];
    const facilities = [makeInfirmary('infirmary', 1)];
    const store = makeStore(members, facilities);
    processInjuryRecovery(store, 10_000);
    const [, recoveredFirst] = store.applyInjuryRecovery.mock.calls[0];
    expect(recoveredFirst).toEqual(['a']);

    // Simulate the recovery being applied: drop `a` from injured state.
    const next = [makeMember('a', { status: 'idle' }), members[1]];
    const store2 = makeStore(next, facilities);
    const queueAfter = resolveInjuryQueue(next, facilities);
    // b is now alone → bedded.
    expect(queueAfter.rows[0].member.id).toBe('b');
    expect(queueAfter.rows[0].bedded).toBe(true);

    processInjuryRecovery(store2, 10_000);
    const [updates2] = store2.applyInjuryRecovery.mock.calls[0];
    // b should now accrue at the bedded lv1 rate: (10_000 / 100_000) / 0.6 ≈ 0.1667
    expect(updates2).toEqual([{ id: 'b', progress: expect.closeTo(0.1667, 3) }]);
  });

  it('multi-infirmary: 4 beds across Lv1 + Lv3 all heal at the ×0.4 rate', () => {
    const members = [
      makeInjured('a', 100, 100_000, 0),
      makeInjured('b', 200, 100_000, 0),
      makeInjured('c', 300, 100_000, 0),
      makeInjured('d', 400, 100_000, 0),
    ];
    const facilities = [
      makeInfirmary('infirmary', 1),
      makeInfirmary('infirmary-2', 3),
    ];
    const store = makeStore(members, facilities);
    processInjuryRecovery(store, 10_000);
    const [updates] = store.applyInjuryRecovery.mock.calls[0];
    // All 4 bedded at the lv3 speed factor → progress 0.25 each.
    expect(updates).toHaveLength(4);
    for (const u of updates) {
      expect(u.progress).toBeCloseTo(0.25);
    }
  });

  it('is a no-op when dtMs is 0', () => {
    const members = [makeInjured('a', 100, 100_000, 0)];
    const store = makeStore(members, [makeInfirmary('infirmary', 3)]);
    processInjuryRecovery(store, 0);
    expect(store.applyInjuryRecovery).not.toHaveBeenCalled();
  });

  it('is a no-op when no members are injured', () => {
    const store = makeStore([makeMember('idle1')], [makeInfirmary('infirmary', 1)]);
    processInjuryRecovery(store, 10_000);
    expect(store.applyInjuryRecovery).not.toHaveBeenCalled();
  });
});
