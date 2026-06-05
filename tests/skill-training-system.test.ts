/**
 * Skill-rank training engine tests.
 *
 * Covers:
 *  - processSkillTraining: GDD speed model (×1.0/0.8/0.6), rank-up, cap gating,
 *    dt≤0 no-op, non-training member, empty queue.
 *  - applySkillTrainingResults: rank +1, slot removed, member → idle on completion.
 *  - cancelSkillTraining: 50% gold refund, progress reset, member → idle.
 *
 * Deterministic — uses explicit dtMs, no fake timers.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { processSkillTraining } from '@/game/systems/skill-training-system';
import { GAME_DAY_REAL_MS, RANK_TRAIN_DAYS } from '@/game/data/skill-rank-costs';
import type { Member, GuildFacility } from '@/game/state/game-state';
import { useGameStore } from '@/game/state/store';

// ── Factories ────────────────────────────────────────────────────────────────

function makeMember(id: string, overrides: Partial<Member> = {}): Member {
  return {
    id, name: id, grade: 'D', isMercenary: false,
    stats: { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    unallocatedPoints: 0, skill: null, status: 'idle', injuredUntil: null,
    civilization: 'LinhSon', isFounder: false, missionsCompleted: 0,
    ...overrides,
  };
}

function makeTrainingYard(level: number, queue: GuildFacility['trainingQueue'] = []): GuildFacility {
  return {
    id: 'training-yard', type: 'training-yard', level,
    assignedMemberIds: queue?.map(s => s.memberId) ?? [],
    placedSlot: null, trainingQueue: queue,
  };
}

function makeTrainingSlot(memberId: string, skillId: string, targetRank: number, goldPaid = 150) {
  return { memberId, skillId, targetRank, goldPaid, materialPaid: false };
}

function makeTrainer(id: string, skillId: string, rank = 1, progress = 0): Member {
  return makeMember(id, {
    status: 'training',
    skillRanks: { [skillId]: { rank, progress } },
  });
}

// ── processSkillTraining ─────────────────────────────────────────────────────

describe('processSkillTraining', () => {
  it('returns [] when dtMs <= 0', () => {
    const yard = makeTrainingYard(1, [makeTrainingSlot('a', 'pierce', 2)]);
    const member = makeTrainer('a', 'pierce');
    expect(processSkillTraining(yard, [member], 0)).toEqual([]);
    expect(processSkillTraining(yard, [member], -100)).toEqual([]);
  });

  it('returns [] for empty queue', () => {
    const yard = makeTrainingYard(1, []);
    expect(processSkillTraining(yard, [], 1000)).toEqual([]);
  });

  it('skips member whose status is not training', () => {
    const yard = makeTrainingYard(1, [makeTrainingSlot('a', 'pierce', 2)]);
    const idle = makeMember('a', { skillRanks: { pierce: { rank: 1, progress: 0 } } });
    expect(processSkillTraining(yard, [idle], 1000)).toEqual([]);
  });

  it('Lv1 delta = full duration → progressDelta = 1.0 (rank-up)', () => {
    const trainMs = RANK_TRAIN_DAYS[2] * GAME_DAY_REAL_MS; // rank-2 full duration
    const yard = makeTrainingYard(1, [makeTrainingSlot('a', 'pierce', 2)]);
    const member = makeTrainer('a', 'pierce');
    const [result] = processSkillTraining(yard, [member], trainMs);
    expect(result.progressDelta).toBeCloseTo(1.0, 5);
    expect(result.rankReached).toBe(2);
  });

  it('Lv2 delta is 1.25× Lv1 for same dtMs', () => {
    const dtMs = 60_000;
    const slot = makeTrainingSlot('a', 'pierce', 2);
    const member = makeTrainer('a', 'pierce');
    const lv1 = processSkillTraining(makeTrainingYard(1, [slot]), [member], dtMs);
    const lv2 = processSkillTraining(makeTrainingYard(2, [slot]), [member], dtMs);
    expect(lv2[0].progressDelta / lv1[0].progressDelta).toBeCloseTo(1.25, 5);
  });

  it('Lv3 delta is ~1.667× Lv1 for same dtMs', () => {
    const dtMs = 60_000;
    const slot = makeTrainingSlot('a', 'pierce', 2);
    const member = makeTrainer('a', 'pierce');
    const lv1 = processSkillTraining(makeTrainingYard(1, [slot]), [member], dtMs);
    const lv3 = processSkillTraining(makeTrainingYard(3, [slot]), [member], dtMs);
    expect(lv3[0].progressDelta / lv1[0].progressDelta).toBeCloseTo(1 / 0.6, 3);
  });

  it('rank-up: progress crossing 1.0 sets rankReached = targetRank', () => {
    const slot = makeTrainingSlot('a', 'pierce', 2);
    const member = makeTrainer('a', 'pierce', 1, 0.95);
    const trainMs = RANK_TRAIN_DAYS[2] * GAME_DAY_REAL_MS;
    const [result] = processSkillTraining(makeTrainingYard(1, [slot]), [member], trainMs * 0.1);
    expect(result.rankReached).toBe(2);
  });

  it('cap gating: skips slot when targetRank > MAX_RANK_BY_FACILITY_LEVEL', () => {
    // Lv1 yard caps at rank 2; targetRank 3 must be skipped
    const slot = makeTrainingSlot('a', 'pierce', 3);
    const member = makeTrainer('a', 'pierce');
    expect(processSkillTraining(makeTrainingYard(1, [slot]), [member], 60_000)).toEqual([]);
  });

  it('skips slot when currentRank >= targetRank (already at target)', () => {
    const slot = makeTrainingSlot('a', 'pierce', 2);
    const member = makeTrainer('a', 'pierce', 2, 0); // already rank 2
    expect(processSkillTraining(makeTrainingYard(2, [slot]), [member], 60_000)).toEqual([]);
  });
});

// ── Store actions ────────────────────────────────────────────────────────────

describe('applySkillTrainingResults', () => {
  beforeEach(() => {
    useGameStore.setState({
      roster: [makeTrainer('r1', 'pierce', 1, 0.8)],
      founder: null,
      facilities: [makeTrainingYard(1, [makeTrainingSlot('r1', 'pierce', 2)])],
    });
  });

  it('on rank-up: member gets rank+1, progress reset to 0, status idle, slot removed', () => {
    useGameStore.getState().applySkillTrainingResults([
      { memberId: 'r1', skillId: 'pierce', rankReached: 2, progressDelta: 0.5 },
    ]);
    const state = useGameStore.getState();
    const member = state.roster.find(m => m.id === 'r1')!;
    expect(member.skillRanks?.['pierce']).toEqual({ rank: 2, progress: 0 });
    expect(member.status).toBe('idle');
    const yard = state.facilities.find(f => f.type === 'training-yard')!;
    expect(yard.trainingQueue).toHaveLength(0);
  });

  it('in-progress: updates progress, keeps member training, slot intact', () => {
    useGameStore.getState().applySkillTrainingResults([
      { memberId: 'r1', skillId: 'pierce', rankReached: null, progressDelta: 0.1 },
    ]);
    const member = useGameStore.getState().roster.find(m => m.id === 'r1')!;
    expect(member.skillRanks?.['pierce']?.progress).toBeCloseTo(0.9, 5);
    expect(member.status).toBe('training');
  });
});

describe('startSkillTraining (learn + rank, no auto-equip)', () => {
  beforeEach(() => {
    useGameStore.setState({
      gold: 1000,
      inventory: { items: {}, equipmentInventory: [] },
      founder: makeMember('f0', {
        archetype: 'sword', isFounder: true,
        skill: { id: 'pierce', name: 'Pierce', damageMultiplier: 1.3, cooldownMs: 9000, autoEnabled: true },
        skillRanks: { pierce: { rank: 1, progress: 0 } },
      }),
      roster: [],
      facilities: [makeTrainingYard(2, [])],
    });
  });

  it('learns an unlearned pool skill (Lv0→Lv1) without changing the carried skill', () => {
    // cleave is in the Templar pool but not yet learned (Lv0)
    const ok = useGameStore.getState().startSkillTraining('f0', 'cleave', 'training-yard');
    expect(ok).toBe(true);
    const state = useGameStore.getState();
    expect(state.founder?.skill?.id).toBe('pierce'); // carried skill unchanged (equip is separate)
    expect(state.founder?.status).toBe('training');
    const yard = state.facilities.find(f => f.type === 'training-yard')!;
    expect(yard.trainingQueue?.[0]).toMatchObject({ memberId: 'f0', skillId: 'cleave', targetRank: 1 });
    expect(state.gold).toBe(950); // 1000 - 50 (learn cost)
  });

  it('rejects a skill that is not in the member class pool', () => {
    const ok = useGameStore.getState().startSkillTraining('f0', 'snipe', 'training-yard');
    expect(ok).toBe(false);
    expect(useGameStore.getState().founder?.status).toBe('idle');
  });
});

describe('equipMemberSkill (carry swap)', () => {
  beforeEach(() => {
    useGameStore.setState({
      founder: makeMember('f0', {
        archetype: 'sword', isFounder: true, status: 'idle',
        skill: { id: 'pierce', name: 'Pierce', damageMultiplier: 1.3, cooldownMs: 9000, autoEnabled: false },
        skillRanks: { cleave: { rank: 3, progress: 0 } },
      }),
      roster: [],
    });
  });

  it('equips a pool skill as carried, preserving auto-cast toggle', () => {
    useGameStore.getState().equipMemberSkill('f0', 'cleave');
    const f = useGameStore.getState().founder!;
    expect(f.skill?.id).toBe('cleave');
    expect(f.skill?.autoEnabled).toBe(false); // carried over from prior skill
    expect(f.skillRanks?.['cleave']?.rank).toBe(3); // ranks untouched
  });

  it('rejects a skill outside the class pool', () => {
    useGameStore.getState().equipMemberSkill('f0', 'snipe');
    expect(useGameStore.getState().founder?.skill?.id).toBe('pierce');
  });

  it('rejects an unlearned pool skill (Lv0)', () => {
    // riposte is in the Templar pool but has no skillRanks entry → Lv0
    useGameStore.getState().equipMemberSkill('f0', 'riposte');
    expect(useGameStore.getState().founder?.skill?.id).toBe('pierce');
  });

  it('is a no-op while training', () => {
    useGameStore.setState({ founder: { ...useGameStore.getState().founder!, status: 'training' } });
    useGameStore.getState().equipMemberSkill('f0', 'cleave');
    expect(useGameStore.getState().founder?.skill?.id).toBe('pierce');
  });
});

describe('cancelSkillTraining', () => {
  beforeEach(() => {
    useGameStore.setState({
      gold: 500,
      roster: [makeTrainer('r1', 'pierce', 1, 0.6)],
      founder: null,
      facilities: [makeTrainingYard(1, [makeTrainingSlot('r1', 'pierce', 2, 150)])],
    });
  });

  it('refunds 50% gold (floor of goldPaid)', () => {
    useGameStore.getState().cancelSkillTraining('r1', 'training-yard');
    expect(useGameStore.getState().gold).toBe(575); // 500 + floor(150 * 0.5)
  });

  it('resets skill progress to 0', () => {
    useGameStore.getState().cancelSkillTraining('r1', 'training-yard');
    const member = useGameStore.getState().roster.find(m => m.id === 'r1')!;
    expect(member.skillRanks?.['pierce']?.progress).toBe(0);
  });

  it('sets member status to idle and removes from trainingQueue', () => {
    useGameStore.getState().cancelSkillTraining('r1', 'training-yard');
    const state = useGameStore.getState();
    const member = state.roster.find(m => m.id === 'r1')!;
    expect(member.status).toBe('idle');
    const yard = state.facilities.find(f => f.type === 'training-yard')!;
    expect(yard.trainingQueue).toHaveLength(0);
  });

  it('also works when the trainer is the founder', () => {
    useGameStore.setState({
      gold: 400,
      founder: makeTrainer('f0', 'cleave', 1, 0.3),
      roster: [],
      facilities: [makeTrainingYard(1, [makeTrainingSlot('f0', 'cleave', 2, 200)])],
    });
    useGameStore.getState().cancelSkillTraining('f0', 'training-yard');
    const state = useGameStore.getState();
    expect(state.gold).toBe(500); // 400 + floor(200 * 0.5)
    expect(state.founder?.status).toBe('idle');
    expect(state.founder?.skillRanks?.['cleave']?.progress).toBe(0);
  });
});
