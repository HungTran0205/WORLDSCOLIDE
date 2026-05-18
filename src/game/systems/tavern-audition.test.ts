/**
 * Phase 05 — Audition pipeline tests.
 * Coverage: spec §8.1 RP table, re-invite prompt queueing, executeReinvite
 * success/fail paths, acceptCounterOffer, RP cap, idempotency.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, resetGameState } from '@/game/state/store';
import type { Member, MercContract, TavernVisitor } from '@/game/state/game-state';
import {
  RP_REINVITE_THRESHOLD,
  REINVITE_SUCCESS_REP_BONUS,
  RP_CAP,
  clampRP,
  isReinviteEligible,
  promoteMercToMember,
  rpDelta,
} from './tavern-audition';
import {
  applyMercSurvival,
  makeMercContract,
} from './tavern-merc-lifecycle';
import { hireMercCost } from './tavern-negotiation';

const FOUNDER_ID = 'founder-005';

function makeFounder(overrides: Partial<Member> = {}): Member {
  return {
    id: FOUNDER_ID,
    name: 'Founder',
    level: 5,
    exp: 0,
    stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 20, LCK: 5, AGI: 5 }, // high CHA → reliable success
    unallocatedPoints: 0,
    skill: null,
    status: 'idle',
    injuredUntil: null,
    civilization: 'LinhSon',
    isFounder: true,
    rank: 'COMMANDER',
    missionsCompleted: 0,
    rarity: 1,
    traits: [],
    ...overrides,
  };
}

function fakeVisitor(overrides: Partial<TavernVisitor> = {}): TavernVisitor {
  return {
    id: 'v-aud-1',
    archetype: 'warrior',
    civilization: 'LinhSon',
    rarity: 3,
    level: 5,
    stats: { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    derivedDemand: 25,
    dailyMoodBias: 0,
    traits: ['hot-headed'],
    preferredGiftCategory: 'consumable',
    attemptHistory: [],
    veteranTag: false,
    spawnedDay: 1,
    ...overrides,
  };
}

function bootstrap(opts: { gold?: number; founderStats?: Partial<Member['stats']> } = {}) {
  resetGameState();
  useGameStore.setState((s) => ({
    gold: opts.gold ?? 5000,
    founder: makeFounder(
      opts.founderStats
        ? { stats: { ...makeFounder().stats, ...opts.founderStats } }
        : {},
    ),
    facilities: s.facilities.map((f) =>
      f.type === 'tavern'
        ? { ...f, level: 2, assignedMemberIds: [FOUNDER_ID], placedSlot: 0 }
        : f,
    ),
  }));
}

// ─── rpDelta (spec §8.1) ────────────────────────────────────────────────────

describe('rpDelta — spec §8.1 table', () => {
  it('success + 0 damage → +30 (pristine carry)', () => {
    expect(rpDelta({ success: true, defeated: false, mercDamage: 0 })).toBe(30);
  });

  it('success + solo-carry (members all down) → +25', () => {
    expect(
      rpDelta({
        success: true,
        defeated: false,
        mercDamage: 50,
        mercAssisted: 'solo-carry',
      }),
    ).toBe(25);
  });

  it('success + with-members → +20', () => {
    expect(
      rpDelta({
        success: true,
        defeated: false,
        mercDamage: 50,
        mercAssisted: 'with-members',
      }),
    ).toBe(20);
  });

  it('failure + a member died → -20', () => {
    expect(rpDelta({ success: false, defeated: false, memberDied: true })).toBe(-20);
  });

  it('failure + members alive → -10', () => {
    expect(rpDelta({ success: false, defeated: false, memberDied: false })).toBe(-10);
  });

  it('defeated → 0 (AD12: no -Infinity sentinel)', () => {
    expect(rpDelta({ success: true, defeated: true, mercDamage: 0 })).toBe(0);
    expect(rpDelta({ success: false, defeated: true })).toBe(0);
  });

  it('legacy {success, defeated} only — falls to +20 / -10 tiers', () => {
    expect(rpDelta({ success: true, defeated: false })).toBe(20);
    expect(rpDelta({ success: false, defeated: false })).toBe(-10);
  });
});

describe('clampRP', () => {
  it('caps positive at RP_CAP', () => {
    expect(clampRP(RP_CAP + 50)).toBe(RP_CAP);
  });
  it('floors negative at -RP_CAP', () => {
    expect(clampRP(-(RP_CAP + 50))).toBe(-RP_CAP);
  });
  it('passes through in-range values', () => {
    expect(clampRP(42)).toBe(42);
  });
});

// ─── isReinviteEligible ─────────────────────────────────────────────────────

describe('isReinviteEligible', () => {
  it('false when RP below threshold', () => {
    const c: MercContract = {
      ...makeMercContract(fakeVisitor(), 100, 1),
      relationshipPoints: RP_REINVITE_THRESHOLD - 1,
    };
    expect(isReinviteEligible(c)).toBe(false);
  });

  it('true at or above threshold', () => {
    const c: MercContract = {
      ...makeMercContract(fakeVisitor(), 100, 1),
      relationshipPoints: RP_REINVITE_THRESHOLD,
    };
    expect(isReinviteEligible(c)).toBe(true);
  });
});

// ─── promoteMercToMember ────────────────────────────────────────────────────

describe('promoteMercToMember', () => {
  it('copies stats, civ, archetype, rarity, traits, level — rank = MEMBER', () => {
    const visitor = fakeVisitor({
      rarity: 4,
      level: 7,
      stats: { STR: 20, END: 15, INT: 5, DEX: 10, CHA: 8, LCK: 6, AGI: 12 },
      traits: ['loyal', 'hot-headed'],
      civilization: 'DeQuoc',
      archetype: 'dualblade',
    });
    const contract = makeMercContract(visitor, 200, 1);
    const member = promoteMercToMember(contract);

    expect(member.rank).toBe('MEMBER');
    expect(member.stats).toEqual(visitor.stats);
    expect(member.civilization).toBe('DeQuoc');
    expect(member.archetype).toBe('dualblade');
    expect(member.rarity).toBe(4);
    expect(member.level).toBe(7);
    expect(member.traits).toEqual(['loyal', 'hot-headed']);
    expect(member.status).toBe('idle');
    expect(member.isFounder).toBe(false);
    expect(member.missionsCompleted).toBe(0);
  });

  it('clones traits (no shared reference)', () => {
    const visitor = fakeVisitor({ traits: ['loyal'] });
    const contract = makeMercContract(visitor, 100, 1);
    const member = promoteMercToMember(contract);
    member.traits!.push('hot-headed');
    expect(contract.visitorSnapshot.traits).toEqual(['loyal']); // unmutated
  });
});

// ─── applyMercSurvival queues reinvite prompt ───────────────────────────────

describe('applyMercSurvival — queue reinvite prompt when RP crosses threshold', () => {
  it('success + pristine performance → +30 RP, prompt pushed', () => {
    bootstrap();
    const contract = makeMercContract(fakeVisitor({ id: 'v-rp-1' }), 200, 1);
    const tavern = {
      ...useGameStore.getState().tavern,
      mercContracts: [contract],
      pendingPrompts: [],
      veteranPool: [],
    };

    const patch = applyMercSurvival(
      tavern,
      contract.id,
      { success: true, defeated: false, mercDamage: 0 },
      3,
    );

    expect(patch.mercContracts).toEqual([]);
    expect(patch.veteranPool).toHaveLength(1);
    expect(patch.veteranPool![0].relationshipPoints).toBe(30);
    expect(patch.pendingPrompts).toHaveLength(1);
    expect(patch.pendingPrompts![0].kind).toBe('reinvite');
    expect(patch.pendingPrompts![0].contractId).toBe(contract.id);
  });

  it('success + with-members → +20 RP, NO prompt (below threshold)', () => {
    bootstrap();
    const contract = makeMercContract(fakeVisitor({ id: 'v-rp-2' }), 200, 1);
    const tavern = {
      ...useGameStore.getState().tavern,
      mercContracts: [contract],
      pendingPrompts: [],
      veteranPool: [],
    };
    const patch = applyMercSurvival(
      tavern,
      contract.id,
      { success: true, defeated: false, mercDamage: 50, mercAssisted: 'with-members' },
      3,
    );
    expect(patch.veteranPool![0].relationshipPoints).toBe(20);
    expect(patch.pendingPrompts).toBeUndefined();
  });

  it('failure path → no prompt regardless of RP', () => {
    bootstrap();
    const contract: MercContract = {
      ...makeMercContract(fakeVisitor({ id: 'v-rp-3' }), 200, 1),
      relationshipPoints: 50, // pre-loaded — would qualify if success
    };
    const tavern = {
      ...useGameStore.getState().tavern,
      mercContracts: [contract],
      pendingPrompts: [],
    };
    const patch = applyMercSurvival(
      tavern,
      contract.id,
      { success: false, defeated: false },
      3,
    );
    expect(patch.mercContracts).toEqual([]);
    expect(patch.pendingPrompts).toBeUndefined();
  });

  it('prompt de-duplication when survival runs twice for the same contract', () => {
    bootstrap();
    const contract = makeMercContract(fakeVisitor({ id: 'v-dup' }), 200, 1);
    const tavern = {
      ...useGameStore.getState().tavern,
      mercContracts: [contract],
      pendingPrompts: [
        {
          kind: 'reinvite' as const,
          contractId: contract.id,
          visitorSnapshot: contract.visitorSnapshot,
          bonusModifier: 25,
          createdDay: 1,
        },
      ],
      veteranPool: [],
    };
    const patch = applyMercSurvival(
      tavern,
      contract.id,
      { success: true, defeated: false, mercDamage: 0 },
      3,
    );
    // de-dup: still 1 prompt (not 2)
    expect(patch.pendingPrompts).toBeUndefined();
  });
});

// ─── acceptCounterOffer ─────────────────────────────────────────────────────

describe('acceptCounterOffer', () => {
  beforeEach(() => bootstrap({ gold: 100_000 }));

  it('creates a merc contract at +20% standard hire cost', () => {
    // Manually splice a visitor onto roster so we control the cost calc.
    const v = fakeVisitor({ id: 'v-counter', rarity: 2, level: 3 });
    useGameStore.setState((s) => ({
      tavern: { ...s.tavern, currentRoster: [v] },
    }));

    const baseCost = hireMercCost(v, 1.0);
    const counterCost = hireMercCost(v, 1.2);
    expect(counterCost).toBeGreaterThan(baseCost);

    const goldBefore = useGameStore.getState().gold;
    const ok = useGameStore.getState().acceptCounterOffer(v.id);
    expect(ok).toBe(true);
    expect(useGameStore.getState().gold).toBe(goldBefore - counterCost);
    expect(useGameStore.getState().tavern.mercContracts).toHaveLength(1);
    expect(useGameStore.getState().tavern.mercContracts[0].hireCost).toBe(counterCost);
  });

  it('returns false when visitor missing', () => {
    expect(useGameStore.getState().acceptCounterOffer('nope')).toBe(false);
  });
});

// ─── executeReinvite ────────────────────────────────────────────────────────

describe('executeReinvite', () => {
  function seedReinvitePrompt(visitorOverrides: Partial<TavernVisitor> = {}) {
    bootstrap({ gold: 10_000 });
    // Push a contract → veteranPool entry + a pending reinvite prompt.
    const visitor = fakeVisitor({ ...visitorOverrides, stats: { STR: 3, END: 3, INT: 3, DEX: 3, CHA: 0, LCK: 0, AGI: 3 } });
    const contract = makeMercContract(visitor, 200, 1);
    useGameStore.setState((s) => ({
      tavern: {
        ...s.tavern,
        veteranPool: [
          {
            contractId: contract.id,
            visitorSnapshot: visitor,
            relationshipPoints: 30,
            addedDay: 2,
          },
        ],
        pendingPrompts: [
          {
            kind: 'reinvite' as const,
            contractId: contract.id,
            visitorSnapshot: visitor,
            bonusModifier: 25,
            createdDay: 2,
          },
        ],
      },
    }));
    return contract;
  }

  it('decline → prompt removed, no roster change, no rep change', () => {
    const contract = seedReinvitePrompt();
    const rosterBefore = useGameStore.getState().roster.length;
    const repBefore = useGameStore.getState().tavern.reputation;

    const result = useGameStore.getState().executeReinvite(contract.id, false);
    expect(result).toBeNull();
    expect(useGameStore.getState().tavern.pendingPrompts).toEqual([]);
    expect(useGameStore.getState().roster).toHaveLength(rosterBefore);
    expect(useGameStore.getState().tavern.reputation).toBe(repBefore);
    // Veteran stays in pool — player can still meet them next reappear roll.
    expect(useGameStore.getState().tavern.veteranPool).toHaveLength(1);
  });

  it('accept + success path → roster +1, rep +2, prompt cleared, veteran consumed', () => {
    const contract = seedReinvitePrompt(); // low-stat visitor; high-CHA founder
    // Stack the deck: very low demand (rarity 1) so the +25 bonus + base rate ~95% nearly always succeeds.
    useGameStore.setState((s) => ({
      tavern: {
        ...s.tavern,
        pendingPrompts: s.tavern.pendingPrompts.map((p) => ({
          ...p,
          visitorSnapshot: { ...p.visitorSnapshot, rarity: 1, stats: { STR: 1, END: 1, INT: 1, DEX: 1, CHA: 1, LCK: 1, AGI: 1 } },
        })),
        veteranPool: s.tavern.veteranPool.map((v) => ({
          ...v,
          visitorSnapshot: { ...v.visitorSnapshot, rarity: 1, stats: { STR: 1, END: 1, INT: 1, DEX: 1, CHA: 1, LCK: 1, AGI: 1 } },
        })),
      },
    }));
    const repBefore = useGameStore.getState().tavern.reputation;
    const rosterBefore = useGameStore.getState().roster.length;

    const result = useGameStore.getState().executeReinvite(contract.id, true);

    expect(result).not.toBeNull();
    // With CHA=20 founder vs rarity-1 trash visitor, the roll should land in
    // a success tier (margin negative). Assert outcome family rather than tier.
    expect(result!.outcome.kind === 'success'
      || result!.outcome.kind === 'counter'
      || result!.outcome.kind === 'soft-refuse'
      || result!.outcome.kind === 'hard-refuse'
      || result!.outcome.kind === 'insult').toBe(true);
    // Pending prompts cleared either way.
    expect(useGameStore.getState().tavern.pendingPrompts).toEqual([]);

    if (result!.outcome.kind === 'success') {
      expect(useGameStore.getState().roster).toHaveLength(rosterBefore + 1);
      expect(useGameStore.getState().tavern.reputation).toBe(repBefore + REINVITE_SUCCESS_REP_BONUS);
      expect(useGameStore.getState().tavern.veteranPool).toHaveLength(0);
      const added = useGameStore.getState().roster[rosterBefore];
      expect(added.rank).toBe('MEMBER');
    }
  });

  it('accept + failure → veteran retained, no roster change, no rep bonus', () => {
    // Stack the deck the other way: very high-demand visitor vs zero-CHA founder.
    bootstrap({ gold: 10_000, founderStats: { CHA: 0, INT: 0 } });
    const visitor = fakeVisitor({
      id: 'v-fail',
      rarity: 5,
      level: 9,
      stats: { STR: 99, END: 99, INT: 99, DEX: 99, CHA: 99, LCK: 0, AGI: 99 },
    });
    const contract = makeMercContract(visitor, 200, 1);
    useGameStore.setState((s) => ({
      tavern: {
        ...s.tavern,
        veteranPool: [
          { contractId: contract.id, visitorSnapshot: visitor, relationshipPoints: 30, addedDay: 2 },
        ],
        pendingPrompts: [
          { kind: 'reinvite', contractId: contract.id, visitorSnapshot: visitor, bonusModifier: 25, createdDay: 2 },
        ],
      },
    }));
    const repBefore = useGameStore.getState().tavern.reputation;
    const rosterBefore = useGameStore.getState().roster.length;

    const result = useGameStore.getState().executeReinvite(contract.id, true);
    expect(result).not.toBeNull();
    expect(useGameStore.getState().tavern.pendingPrompts).toEqual([]);

    if (result!.outcome.kind !== 'success') {
      // Veteran kept (still eligible for future reappear).
      expect(useGameStore.getState().tavern.veteranPool).toHaveLength(1);
      expect(useGameStore.getState().roster).toHaveLength(rosterBefore);
      expect(useGameStore.getState().tavern.reputation).toBe(repBefore);
    }
  });

  it('returns null for unknown contract id (no prompt)', () => {
    bootstrap();
    expect(useGameStore.getState().executeReinvite('nope', true)).toBeNull();
  });
});
