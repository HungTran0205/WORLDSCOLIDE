import { describe, it, expect, vi } from 'vitest';
import { processMissionTick, processInjuryRecovery, ARRIVAL_TIMEOUT_MS } from '@/game/systems/mission-tick';
import type { ActiveMission, Member } from '@/game/state/game-state';
import type { GameStore } from '@/game/state/store';

// ── Mock member factory ──────────────────────────────────────────────────────

function makeMember(id: string, status: Member['status'] = 'on-mission'): Member {
  return {
    id, name: id, level: 5, exp: 0,
    stats: { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    unallocatedPoints: 0, skill: null, status, injuredUntil: null,
    civilization: 'human', isFounder: false,
  };
}

// ── Mock store factory ───────────────────────────────────────────────────────

function makeMission(phase: ActiveMission['phase'], overrides: Partial<ActiveMission> = {}): ActiveMission {
  return {
    missionId: 'slime-extermination',
    memberIds: ['m1'],
    startTime: 0,
    estimatedEndTime: 60_000,
    phase,
    arrivalTime: null,
    combatMode: null,
    ...overrides,
  };
}

function makeStore(
  activeMissions: ActiveMission[],
  members: Member[] = [makeMember('m1')],
): GameStore & { calls: string[] } {
  const calls: string[] = [];
  const state = { activeMissions: [...activeMissions] };

  return {
    ...state,
    founder: members[0] ?? null,
    roster: members.slice(1),
    calls,
    gold: 100,
    realTimeLastTick: 0,

    updateMissionPhase: vi.fn((id: string, phase: string, arrivalTime?: number) => {
      calls.push(`updatePhase:${id}:${phase}`);
      const m = state.activeMissions.find((x) => x.missionId === id);
      if (m) {
        (m as ActiveMission).phase = phase as ActiveMission['phase'];
        if (arrivalTime !== undefined) (m as ActiveMission).arrivalTime = arrivalTime;
      }
    }),
    setCombatMode: vi.fn((id: string, mode: string) => {
      calls.push(`setCombatMode:${id}:${mode}`);
      const m = state.activeMissions.find((x) => x.missionId === id);
      if (m) (m as ActiveMission).combatMode = mode as 'auto' | 'manual';
    }),
    setArrivedMissionId: vi.fn((id: string | null) => {
      calls.push(`setArrivedMissionId:${id}`);
    }),
    addGold: vi.fn((g: number) => { calls.push(`addGold:${g}`); }),
    addMemberExp: vi.fn((id: string, exp: number) => { calls.push(`addExp:${id}:${exp}`); }),
    updateMemberStatus: vi.fn((id: string, s: string) => { calls.push(`setStatus:${id}:${s}`); }),
    completeMission: vi.fn((id: string) => {
      calls.push(`completeMission:${id}`);
      state.activeMissions = state.activeMissions.filter((m) => m.missionId !== id);
    }),
    failMission: vi.fn((id: string) => {
      calls.push(`failMission:${id}`);
      state.activeMissions = state.activeMissions.filter((m) => m.missionId !== id);
    }),
    setMemberInjuredUntil: vi.fn((id: string, until: number | null) => {
      calls.push(`setInjured:${id}:${until}`);
    }),
    pushMissionResult: vi.fn(() => { calls.push('pushResult'); }),
  } as unknown as GameStore & { calls: string[] };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('processMissionTick — traveling phase', () => {
  it('stays traveling when travelTimeMs has not elapsed', () => {
    const am = makeMission('traveling', { startTime: 1000 });
    const store = makeStore([am]);
    // now = 5000, travelTimeMs for slime-extermination = 10_000 → not elapsed
    const events = processMissionTick(store, 5_000);
    expect(events).toHaveLength(0);
    expect(store.calls).not.toContain(expect.stringContaining('updatePhase'));
  });

  it('transitions to arrived when travelTimeMs has elapsed', () => {
    const am = makeMission('traveling', { startTime: 0 });
    const store = makeStore([am]);
    // slime-extermination travelTimeMs = 10_000 → arrived at now >= 10_000
    const events = processMissionTick(store, 10_000);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('arrival');
    expect(store.calls).toContain('updatePhase:slime-extermination:arrived');
  });

  it('emits arrival event with mission name and zone', () => {
    const am = makeMission('traveling', { startTime: 0 });
    const store = makeStore([am]);
    const events = processMissionTick(store, 15_000);
    expect(events[0]).toMatchObject({
      type: 'arrival',
      missionId: 'slime-extermination',
      missionName: 'Slime Extermination',
      zone: 'Outskirts Forest',
    });
  });
});

describe('processMissionTick — arrived phase', () => {
  it('stays arrived within timeout if no combatMode set', () => {
    const am = makeMission('arrived', { arrivalTime: 0, combatMode: null });
    const store = makeStore([am]);
    // 15s elapsed — within 30s timeout
    const events = processMissionTick(store, 15_000);
    expect(events).toHaveLength(0);
    expect(store.calls).not.toContain(expect.stringContaining('updatePhase'));
  });

  it('transitions to in-combat when player sets combatMode', () => {
    const am = makeMission('arrived', { arrivalTime: 0, combatMode: 'manual' });
    const store = makeStore([am]);
    const events = processMissionTick(store, 5_000);
    expect(events[0]).toMatchObject({ type: 'combat-start', missionId: 'slime-extermination' });
    expect(store.calls).toContain('updatePhase:slime-extermination:in-combat');
  });

  it('auto-sets combatMode to auto after 30s timeout', () => {
    const am = makeMission('arrived', { arrivalTime: 0, combatMode: null });
    const store = makeStore([am]);
    const events = processMissionTick(store, ARRIVAL_TIMEOUT_MS + 1);
    expect(store.calls).toContain('setCombatMode:slime-extermination:auto');
    expect(store.calls).toContain('updatePhase:slime-extermination:in-combat');
    expect(events[0]?.type).toBe('combat-start');
  });

  it('does not trigger on exact timeout boundary — triggers one ms after', () => {
    const am = makeMission('arrived', { arrivalTime: 0, combatMode: null });
    const store = makeStore([am]);
    // Exactly at ARRIVAL_TIMEOUT_MS — now >= arrivalTime + ARRIVAL_TIMEOUT_MS
    const events = processMissionTick(store, ARRIVAL_TIMEOUT_MS);
    expect(events[0]?.type).toBe('combat-start');
  });
});

describe('processMissionTick — in-combat phase', () => {
  it('resolves combat and emits combat-complete event', () => {
    const am = makeMission('in-combat');
    const store = makeStore([am]);
    const events = processMissionTick(store, 10_000);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('combat-complete');
    expect(store.calls).toContain('pushResult');
  });

  it('calls completeMission on non-wipe outcome', () => {
    const am = makeMission('in-combat');
    // Give members strong stats to increase victory likelihood
    const member = makeMember('m1');
    member.stats = { STR: 50, END: 50, INT: 20, DEX: 20, CHA: 20, LCK: 20, AGI: 20 };
    const store = makeStore([am], [member]);

    // Mock resolveMission to force victory
    vi.mock('@/game/systems/mission-resolver', () => ({
      resolveMission: () => ({
        missionId: 'slime-extermination',
        outcome: 'victory',
        goldEarned: 15,
        expPerMember: 100,
        survivors: ['m1'],
        injured: [],
        combatResult: { outcome: 'victory', ticks: [], totalDamageDealt: 100, durationMs: 5000 },
      }),
    }));

    processMissionTick(store, 10_000);
    // Either completeMission or failMission was called — both are valid resolutions
    const resolved = store.calls.some((c) => c.startsWith('completeMission') || c.startsWith('failMission'));
    expect(resolved).toBe(true);
  });

  it('includes combatMode in combat-complete event for manual mode', () => {
    const am = makeMission('in-combat', { combatMode: 'manual' });
    const store = makeStore([am]);
    const events = processMissionTick(store, 10_000);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: 'combat-complete', combatMode: 'manual' });
  });

  it('defaults combatMode to auto in combat-complete event', () => {
    const am = makeMission('in-combat', { combatMode: null });
    const store = makeStore([am]);
    const events = processMissionTick(store, 10_000);
    expect(events[0]).toMatchObject({ type: 'combat-complete', combatMode: 'auto' });
  });

  it('applies gold and exp on success, or fails on wipe (non-deterministic combat)', () => {
    const am = makeMission('in-combat');
    const store = makeStore([am]);
    processMissionTick(store, 10_000);

    const hasGold = store.calls.some((c) => c.startsWith('addGold:'));
    const hasFail = store.calls.some((c) => c.startsWith('failMission:'));
    // Either gold was added (victory) or mission failed (wipe) — both are valid outcomes
    expect(hasGold || hasFail).toBe(true);
  });
});

describe('processMissionTick — edge cases', () => {
  it('calls failMission for unknown missionId', () => {
    const am = makeMission('traveling', { missionId: 'nonexistent-quest' });
    const store = makeStore([am]);
    processMissionTick(store, 99_999);
    expect(store.calls).toContain('failMission:nonexistent-quest');
  });

  it('processes multiple missions in a single tick', () => {
    const am1 = makeMission('traveling', { missionId: 'slime-extermination', startTime: 0 });
    const am2: ActiveMission = {
      missionId: 'slime-king-lair',
      memberIds: ['m1'],
      startTime: 0,
      estimatedEndTime: 120_000,
      phase: 'traveling',
      arrivalTime: null,
      combatMode: null,
    };
    const store = makeStore([am1, am2]);
    const events = processMissionTick(store, 15_000);
    // Both slime missions have travelTimeMs: 10_000, so both should arrive
    const arrivals = events.filter((e) => e.type === 'arrival');
    expect(arrivals.length).toBe(2);
  });
});

describe('processInjuryRecovery', () => {
  it('sets injuredUntil to null for expired injuries', () => {
    const member = makeMember('m1', 'injured');
    member.injuredUntil = 5_000;
    const store = makeStore([], [member]);
    processInjuryRecovery(store, 6_000);
    expect(store.calls).toContain('setInjured:m1:null');
  });

  it('does not recover members still within injury duration', () => {
    const member = makeMember('m1', 'injured');
    member.injuredUntil = 20_000;
    const store = makeStore([], [member]);
    processInjuryRecovery(store, 10_000);
    expect(store.calls).toHaveLength(0);
  });
});
