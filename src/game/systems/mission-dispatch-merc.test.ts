/**
 * Phase 04 — mission-dispatch validateDispatch with mixed parties.
 * Verifies legacy MERCENARY fee removal + merc-contract validation gates.
 */

import { describe, it, expect } from 'vitest';
import { validateDispatch, createActiveMission } from './mission-dispatch';
import type { Member, Mission, MercContract, TavernVisitor } from '@/game/state/game-state';
import { makeMercContract } from './tavern-merc-lifecycle';

const MISSION: Mission = {
  id: 'm1',
  name: 'Test',
  tier: 'F',
  durationMs: 60000,
  travelTimeMs: 1000,
  goldRewardMin: 100,
  goldRewardMax: 200,
  expReward: 100,
  enemyIds: [],
  requiredMembers: 2,
  requiredLevel: 3,
};

function member(id: string, level = 5, status: Member['status'] = 'idle'): Member {
  return {
    id, name: id, level, exp: 0,
    stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    unallocatedPoints: 0, skill: null, status, injuredUntil: null,
    civilization: 'LinhSon', isFounder: false, rank: 'MEMBER',
    missionsCompleted: 0, rarity: 1,
  };
}

function visitor(level = 5): TavernVisitor {
  return {
    id: 'vis-1', name: 'vis-1', archetype: 'warrior', civilization: 'LinhSon', gender: 'M',
    rarity: 2, level,
    stats: { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    derivedDemand: 0, dailyMoodBias: 0, traits: [],
    preferredGiftCategory: 'consumable', attemptHistory: [],
    veteranTag: false, spawnedDay: 1,
  };
}

describe('validateDispatch (Phase 04)', () => {
  it('valid mixed party (1 member + 1 merc) meets requiredMembers=2', () => {
    const v = validateDispatch(MISSION, [member('a')], [makeMercContract(visitor(), 100, 1)]);
    expect(v.valid).toBe(true);
  });

  it('rejects undersized mixed party', () => {
    const v = validateDispatch(MISSION, [member('a')], []);
    expect(v.valid).toBe(false);
    expect(v.reason).toMatch(/Need 2/);
  });

  it('rejects when a merc contract is not available', () => {
    const c = makeMercContract(visitor(), 100, 1);
    const onQuest: MercContract = { ...c, status: 'on-quest', questId: 'm0' };
    const v = validateDispatch(MISSION, [member('a'), member('b')], [onQuest]);
    expect(v.valid).toBe(false);
  });

  it('rejects when merc level below requiredLevel', () => {
    const v = validateDispatch(
      MISSION,
      [member('a')],
      [makeMercContract(visitor(1), 100, 1)],
    );
    expect(v.valid).toBe(false);
    expect(v.reason).toMatch(/Mercs must be level/);
  });

  it('does NOT charge any per-quest mercenary fee (legacy MERCENARY 50% removed)', () => {
    // Pure validation result has no mercenaryFee field anymore — type guarantee.
    const v = validateDispatch(MISSION, [member('a'), member('b')], []);
    expect(v).toEqual({ valid: true });
  });

  it('rejects busy member', () => {
    const v = validateDispatch(MISSION, [member('a', 5, 'on-mission'), member('b')], []);
    expect(v.valid).toBe(false);
  });
});

describe('createActiveMission (Phase 04)', () => {
  it('stores merc contract ids in parallel field', () => {
    const am = createActiveMission(MISSION, ['mem-1'], ['merc-A', 'merc-B'], 1000);
    expect(am.memberIds).toEqual(['mem-1']);
    expect(am.mercContractIds).toEqual(['merc-A', 'merc-B']);
    expect(am.phase).toBe('traveling');
  });
});
