/**
 * Phase 04 — merc lifecycle slice + helper tests.
 * Covers: hireMerc cost/cap, contract status transitions, mixed-party quest
 * resolution (member EXP + merc reputation), veteranPool promotion + cap,
 * tavern reputation clamping, RP serialization safety (AD12).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, resetGameState } from './store';
import type { Member, TavernState, TavernVisitor } from './game-state';
import {
  applyMercDeath,
  applyMercSurvival,
  accrueRPFromQuest,
  concurrentMercCap,
  makeMercContract,
  materializeVisitorFromVeteran,
  VETERAN_POOL_CAP,
} from '@/game/systems/tavern-merc-lifecycle';
import { hireMercCost } from '@/game/systems/tavern-negotiation';
import { applyMercResultsForMission } from '@/game/systems/tavern-merc-result-router';

const FOUNDER_ID = 'founder-001';

function makeFounder(): Member {
  return {
    id: FOUNDER_ID,
    name: 'Founder',
    grade: 'D',
    isMercenary: false,
    stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 10, LCK: 5, AGI: 5 },
    unallocatedPoints: 0,
    skill: null,
    status: 'idle',
    injuredUntil: null,
    civilization: 'LinhSon',
    isFounder: true,
    missionsCompleted: 0,
  };
}

function setupTavern(opts: { level?: 1 | 2 | 3; gold?: number } = {}) {
  resetGameState();
  const { level = 2, gold = 5000 } = opts;
  useGameStore.setState((s) => ({
    gold,
    founder: makeFounder(),
    facilities: s.facilities.map((f) =>
      f.type === 'tavern'
        ? { ...f, level, assignedMemberIds: [], placedSlot: 0 }
        : f,
    ),
  }));
  // Generate today's roster so hireMerc has visitors to pull from.
  useGameStore.getState().tickTavernDay(1);
}

function fakeVisitor(overrides: Partial<TavernVisitor> = {}): TavernVisitor {
  return {
    id: 'v-fake-1',
    name: 'v-fake-1',
    archetype: 'warrior',
    civilization: 'LinhSon',
    gender: 'M',
    grade: 'E',
    stats: { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    derivedDemand: 25,
    dailyMoodBias: 0,
    traits: [],
    preferredGiftCategory: 'consumable',
    attemptHistory: [],
    veteranTag: false,
    spawnedDay: 1,
    ...overrides,
  };
}

describe('concurrentMercCap (spec §7.5)', () => {
  it('Lv1=3, Lv2=3, Lv3=4', () => {
    expect(concurrentMercCap(1)).toBe(3);
    expect(concurrentMercCap(2)).toBe(3);
    expect(concurrentMercCap(3)).toBe(4);
  });
});

describe('hireMerc', () => {
  beforeEach(() => setupTavern({ level: 2, gold: 5000 }));

  it('moves visitor to mercContracts and deducts hireMercCost gold', () => {
    const visitor = useGameStore.getState().tavern.currentRoster[0];
    const expectedCost = hireMercCost(visitor);
    const goldBefore = useGameStore.getState().gold;

    const ok = useGameStore.getState().hireMerc(visitor.id);

    expect(ok).toBe(true);
    expect(useGameStore.getState().gold).toBe(goldBefore - expectedCost);
    expect(useGameStore.getState().tavern.mercContracts).toHaveLength(1);
    expect(useGameStore.getState().tavern.currentRoster.find(v => v.id === visitor.id)).toBeUndefined();
  });

  it('applies counter-offer multiplier to cost', () => {
    const visitor = useGameStore.getState().tavern.currentRoster[0];
    const baseCost = hireMercCost(visitor);
    const counterCost = hireMercCost(visitor, 1.2);
    expect(counterCost).toBeGreaterThan(baseCost);

    const goldBefore = useGameStore.getState().gold;
    useGameStore.getState().hireMerc(visitor.id, 1.2);
    expect(useGameStore.getState().gold).toBe(goldBefore - counterCost);
  });

  it('rejects when gold is insufficient', () => {
    useGameStore.setState({ gold: 1 });
    const visitor = useGameStore.getState().tavern.currentRoster[0];
    expect(useGameStore.getState().hireMerc(visitor.id)).toBe(false);
    expect(useGameStore.getState().tavern.mercContracts).toHaveLength(0);
  });

  it('rejects unknown visitorId', () => {
    expect(useGameStore.getState().hireMerc('nope')).toBe(false);
  });

  it('respects concurrent cap (Lv2 = 3 mercs)', () => {
    // Pre-seed 3 contracts so the next hire must be rejected.
    useGameStore.setState((s) => ({
      tavern: {
        ...s.tavern,
        mercContracts: [0, 1, 2].map((i) =>
          makeMercContract(fakeVisitor({ id: `pre-${i}` }), 100, 1),
        ),
      },
    }));
    const visitor = useGameStore.getState().tavern.currentRoster[0];
    expect(useGameStore.getState().hireMerc(visitor.id)).toBe(false);
  });
});

describe('adjustTavernRep — clamps to [-5, +5]', () => {
  beforeEach(() => setupTavern());

  it('positive delta clamps at +5', () => {
    useGameStore.getState().adjustTavernRep(20);
    expect(useGameStore.getState().tavern.reputation).toBe(5);
  });

  it('negative delta clamps at -5', () => {
    useGameStore.getState().adjustTavernRep(-99);
    expect(useGameStore.getState().tavern.reputation).toBe(-5);
  });

  it('mid-range delta applies normally', () => {
    useGameStore.getState().adjustTavernRep(2);
    useGameStore.getState().adjustTavernRep(-1);
    expect(useGameStore.getState().tavern.reputation).toBe(1);
  });
});

describe('markMercsOnQuest + releaseMerc', () => {
  beforeEach(() => setupTavern());

  it('flips status="on-quest" + sets questId for matching contracts', () => {
    const visitor = useGameStore.getState().tavern.currentRoster[0];
    useGameStore.getState().hireMerc(visitor.id);
    const contractId = useGameStore.getState().tavern.mercContracts[0].id;

    useGameStore.getState().markMercsOnQuest([contractId], 'mission-A');
    const c = useGameStore.getState().tavern.mercContracts[0];
    expect(c.status).toBe('on-quest');
    expect(c.questId).toBe('mission-A');
  });

  it('releaseMerc drops the contract without refund', () => {
    const visitor = useGameStore.getState().tavern.currentRoster[0];
    const goldBefore = useGameStore.getState().gold;
    useGameStore.getState().hireMerc(visitor.id);
    const contractId = useGameStore.getState().tavern.mercContracts[0].id;
    const goldAfterHire = useGameStore.getState().gold;
    expect(goldAfterHire).toBeLessThan(goldBefore);

    useGameStore.getState().releaseMerc(contractId);
    expect(useGameStore.getState().tavern.mercContracts).toHaveLength(0);
    // No refund — gold unchanged from post-hire amount.
    expect(useGameStore.getState().gold).toBe(goldAfterHire);
  });
});

describe('accrueRPFromQuest — legacy {success, defeated} tier (spec §8.1)', () => {
  // Phase 05 expanded the RP table; the {success, defeated} shape now falls
  // into the "with-members survived" / "members alive" buckets (+20 / -10).
  it('success + survived (no mercDamage/assist info) = +20 (with-members tier)', () => {
    expect(accrueRPFromQuest({ success: true, defeated: false })).toBe(20);
  });
  it('failure + survived (no member died) = -10', () => {
    expect(accrueRPFromQuest({ success: false, defeated: false })).toBe(-10);
  });
  it('defeated = 0 (AD12: no -Infinity sentinel)', () => {
    expect(accrueRPFromQuest({ success: true, defeated: true })).toBe(0);
    expect(accrueRPFromQuest({ success: false, defeated: true })).toBe(0);
  });
});

describe('applyMercDeath (pure)', () => {
  it('drops contract, decrements rep, no infirmary side-effect', () => {
    const contract = makeMercContract(fakeVisitor(), 200, 1);
    const tavern: TavernState = {
      ...useGameStore.getState().tavern,
      reputation: 2,
      mercContracts: [contract],
    };
    const patch = applyMercDeath(tavern, contract.id);
    expect(patch.mercContracts).toEqual([]);
    expect(patch.reputation).toBe(1);
  });

  it('reputation clamps at -5 on serial defeats', () => {
    let tavern: TavernState = {
      ...useGameStore.getState().tavern,
      reputation: -4,
      mercContracts: [makeMercContract(fakeVisitor({ id: 'a' }), 100, 1)],
    };
    let patch = applyMercDeath(tavern, tavern.mercContracts[0].id);
    expect(patch.reputation).toBe(-5);

    tavern = { ...tavern, ...patch, mercContracts: [makeMercContract(fakeVisitor({ id: 'b' }), 100, 1)] };
    patch = applyMercDeath(tavern, tavern.mercContracts[0].id);
    expect(patch.reputation).toBe(-5);
  });
});

describe('applyMercSurvival (pure)', () => {
  it('success → contract removed, veteranPool gains entry', () => {
    const contract = makeMercContract(fakeVisitor(), 200, 1);
    const tavern: TavernState = {
      ...useGameStore.getState().tavern,
      mercContracts: [contract],
      veteranPool: [],
    };
    const patch = applyMercSurvival(tavern, contract.id, { success: true, defeated: false }, 5);
    expect(patch.mercContracts).toEqual([]);
    expect(patch.veteranPool).toHaveLength(1);
    // §8.1 legacy tier (no mercDamage/assist info): +20.
    expect(patch.veteranPool![0].relationshipPoints).toBe(20);
    expect(patch.veteranPool![0].addedDay).toBe(5);
  });

  it('failure → contract removed but no veteran promotion', () => {
    const contract = makeMercContract(fakeVisitor(), 200, 1);
    const tavern: TavernState = {
      ...useGameStore.getState().tavern,
      mercContracts: [contract],
      veteranPool: [],
    };
    const patch = applyMercSurvival(tavern, contract.id, { success: false, defeated: false }, 5);
    expect(patch.mercContracts).toEqual([]);
    expect(patch.veteranPool).toBeUndefined();
  });

  it('FIFO eviction at VETERAN_POOL_CAP (=20)', () => {
    const fillPool = Array.from({ length: VETERAN_POOL_CAP }, (_, i) => ({
      contractId: `merc-old-${i}`,
      visitorSnapshot: fakeVisitor({ id: `vs-${i}` }),
      relationshipPoints: i,
      addedDay: i,
    }));
    const newContract = makeMercContract(fakeVisitor({ id: 'fresh' }), 200, 100);
    const tavern: TavernState = {
      ...useGameStore.getState().tavern,
      mercContracts: [newContract],
      veteranPool: fillPool,
    };
    const patch = applyMercSurvival(tavern, newContract.id, { success: true, defeated: false }, 100);
    expect(patch.veteranPool).toHaveLength(VETERAN_POOL_CAP);
    // Oldest evicted, newest at end.
    expect(patch.veteranPool![0].contractId).toBe('merc-old-1');
    expect(patch.veteranPool![VETERAN_POOL_CAP - 1].contractId).toBe(newContract.id);
  });

  it('AD12: defeated path writes RP=0, never -Infinity', () => {
    const contract = makeMercContract(fakeVisitor(), 200, 1);
    const tavern: TavernState = {
      ...useGameStore.getState().tavern,
      reputation: 0,
      mercContracts: [contract],
    };
    // accrueRPFromQuest({ defeated: true }) MUST be 0 — guards JSON.stringify(-Infinity).
    expect(accrueRPFromQuest({ success: true, defeated: true })).toBe(0);
    // applyMercDeath does not write RP at all (contract gone) — verify safety.
    const patch = applyMercDeath(tavern, contract.id);
    expect(JSON.stringify(patch)).not.toContain('null');
  });
});

describe('materializeVisitorFromVeteran', () => {
  it('returns a visitor with veteranTag=true and fresh attemptHistory', () => {
    const vet = {
      contractId: 'merc-old',
      visitorSnapshot: fakeVisitor({ id: 'snap', attemptHistory: [{ day: 1, margin: -10, outcome: 'success' as const }] }),
      relationshipPoints: 7,
      addedDay: 1,
    };
    const v = materializeVisitorFromVeteran(vet, 9);
    expect(v.veteranTag).toBe(true);
    expect(v.spawnedDay).toBe(9);
    expect(v.attemptHistory).toEqual([]);
    // Stats/archetype/civ preserved from snapshot.
    expect(v.archetype).toBe('warrior');
    expect(v.stats.STR).toBe(10);
  });
});

describe('applyMercResultsForMission (router)', () => {
  beforeEach(() => setupTavern({ level: 2, gold: 5000 }));

  it('mixed party — member survivor unaffected, merc survivor → veteranPool', () => {
    const visitor = useGameStore.getState().tavern.currentRoster[0];
    useGameStore.getState().hireMerc(visitor.id);
    const contractId = useGameStore.getState().tavern.mercContracts[0].id;

    applyMercResultsForMission(
      { mercContractIds: [contractId] },
      // survivors include both member id + merc id; outcome = victory
      {
        missionId: 'm-test',
        outcome: 'victory',
        goldEarned: 0, expPerMember: 0,
        survivors: [FOUNDER_ID, contractId],
        injured: [],
        combatResult: { outcome: 'victory', ticks: [], survivors: [FOUNDER_ID, contractId], injured: [], totalDamageDealt: 0, durationMs: 0 },
        lootEarned: {},
      },
    );

    const tavern = useGameStore.getState().tavern;
    expect(tavern.mercContracts).toHaveLength(0);
    expect(tavern.veteranPool).toHaveLength(1);
  });

  it('merc defeated → contract removed, rep -1', () => {
    const visitor = useGameStore.getState().tavern.currentRoster[0];
    useGameStore.getState().hireMerc(visitor.id);
    const contractId = useGameStore.getState().tavern.mercContracts[0].id;
    const repBefore = useGameStore.getState().tavern.reputation;

    applyMercResultsForMission(
      { mercContractIds: [contractId] },
      {
        missionId: 'm-test',
        outcome: 'victory',
        goldEarned: 0, expPerMember: 0,
        survivors: [FOUNDER_ID],            // merc absent = defeated
        injured: [],
        combatResult: { outcome: 'victory', ticks: [], survivors: [FOUNDER_ID], injured: [], totalDamageDealt: 0, durationMs: 0 },
        lootEarned: {},
      },
    );

    const tavern = useGameStore.getState().tavern;
    expect(tavern.mercContracts).toHaveLength(0);
    expect(tavern.reputation).toBe(repBefore - 1);
    // Crucial: no infirmary entry for the merc → founder status untouched.
    expect(useGameStore.getState().founder!.status).toBe('idle');
  });

  it('full-wipe with merc → merc treated as defeated', () => {
    const visitor = useGameStore.getState().tavern.currentRoster[0];
    useGameStore.getState().hireMerc(visitor.id);
    const contractId = useGameStore.getState().tavern.mercContracts[0].id;

    applyMercResultsForMission(
      { mercContractIds: [contractId] },
      {
        missionId: 'm-test',
        outcome: 'full-wipe',
        goldEarned: 0, expPerMember: 0,
        survivors: [],
        injured: [],
        combatResult: { outcome: 'full-wipe', ticks: [], survivors: [], injured: [], totalDamageDealt: 0, durationMs: 0 },
        lootEarned: {},
      },
    );

    expect(useGameStore.getState().tavern.mercContracts).toHaveLength(0);
    expect(useGameStore.getState().tavern.veteranPool).toHaveLength(0);
  });

  it('idempotent — second call is a no-op', () => {
    const visitor = useGameStore.getState().tavern.currentRoster[0];
    useGameStore.getState().hireMerc(visitor.id);
    const contractId = useGameStore.getState().tavern.mercContracts[0].id;

    const result = {
      missionId: 'm-test',
      outcome: 'victory' as const,
      goldEarned: 0, expPerMember: 0,
      survivors: [FOUNDER_ID, contractId],
      injured: [],
      combatResult: { outcome: 'victory' as const, ticks: [], survivors: [FOUNDER_ID, contractId], injured: [], totalDamageDealt: 0, durationMs: 0 },
      lootEarned: {},
    };
    applyMercResultsForMission({ mercContractIds: [contractId] }, result);
    const repFirst = useGameStore.getState().tavern.reputation;
    const poolFirst = useGameStore.getState().tavern.veteranPool.length;

    applyMercResultsForMission({ mercContractIds: [contractId] }, result);
    expect(useGameStore.getState().tavern.reputation).toBe(repFirst);
    expect(useGameStore.getState().tavern.veteranPool.length).toBe(poolFirst);
  });
});

describe('veteranPool persists in TavernState shape', () => {
  it('default tavern initializes empty pool', () => {
    resetGameState();
    expect(useGameStore.getState().tavern.veteranPool).toEqual([]);
  });
});
