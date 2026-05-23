/**
 * Phase 03 economy tests — buildFacility material cost + handleFirstHaul.
 *
 * Covers:
 *  - buildFacility tavern: blocked when WOOD < 200 (null return, no mutation)
 *  - buildFacility tavern: succeeds and decrements WOOD by exactly 200
 *  - buildFacility tavern: gold spend of 0 (buildCost=0) stays correct
 *  - buildFacility non-material facility (training-yard): unaffected by material check
 *  - handleFirstHaul: correct step + Kael + logging-site → grants +200 WOOD +200 gold, advances step
 *  - handleFirstHaul: re-invoke after step advance is a no-op (double-grant guard)
 *  - handleFirstHaul: wrong step → no-op
 *  - handleFirstHaul: non-Kael member → no-op
 *  - handleFirstHaul: wrong facility (not logging-site) → no-op
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, resetGameState } from './store';
import { handleFirstHaul } from '@/game/systems/tutorial-first-haul-handler';
import type { Member } from './game-state';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeKael(): Member {
  return {
    id: 'kael-001',
    name: 'Kael',
    level: 1,
    exp: 0,
    stats: { STR: 10, END: 8, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    unallocatedPoints: 0,
    skill: null,
    status: 'idle',
    injuredUntil: null,
    civilization: 'LinhSon',
    isFounder: false,
    rank: 'RECRUIT',
    missionsCompleted: 0,
    rarity: 1,
  };
}

/** Set up state with given inventory items and gold. guildLevel=2 to pass gold+level guard. */
function setupBuildState(opts: { wood?: number; gold?: number; guildLevel?: number } = {}) {
  resetGameState();
  const { wood = 0, gold = 500, guildLevel = 2 } = opts;
  useGameStore.setState((s) => ({
    gold,
    guildLevel,
    inventory: {
      ...s.inventory,
      items: wood > 0 ? { WOOD: wood } : {},
    },
  }));
}

/** Set up state for handleFirstHaul testing — logging-site at level 1, Kael in roster. */
function setupFirstHaulState(opts: {
  tutorialStep?: 'assign-kael' | 'complete' | 'build-logging-site';
  memberName?: string;
  facilityType?: 'logging-site' | 'workshop';
  gold?: number;
} = {}) {
  resetGameState();
  const {
    tutorialStep = 'assign-kael',
    memberName = 'Kael',
    facilityType = 'logging-site',
    gold = 0,
  } = opts;

  const member: Member = { ...makeKael(), name: memberName };

  useGameStore.setState((s) => ({
    gold,
    tutorialStep,
    roster: [member],
    // Activate the target facility at level 1
    facilities: s.facilities.map((f) => {
      if (f.type === facilityType) return { ...f, level: 1, placedSlot: 0 };
      return f;
    }),
    inventory: { items: {}, equipmentInventory: [] },
  }));

  return { memberId: member.id, facilityId: facilityType };
}

// ─── buildFacility — material cost (tavern) ──────────────────────────────────

describe('buildFacility — tavern material cost (200 WOOD)', () => {
  beforeEach(() => setupBuildState());

  it('returns null when WOOD < 200; gold and inventory unchanged', () => {
    setupBuildState({ wood: 150, gold: 500 });
    const goldBefore = useGameStore.getState().gold;
    const woodBefore = useGameStore.getState().inventory.items.WOOD ?? 0;

    const result = useGameStore.getState().buildFacility('tavern');

    expect(result).toBeNull();
    expect(useGameStore.getState().gold).toBe(goldBefore);
    expect(useGameStore.getState().inventory.items.WOOD ?? 0).toBe(woodBefore);
    // facility must remain at level 0
    const facility = useGameStore.getState().facilities.find((f) => f.type === 'tavern');
    expect(facility?.level).toBe(0);
  });

  it('returns null with 0 WOOD; state untouched', () => {
    setupBuildState({ wood: 0, gold: 500 });
    const result = useGameStore.getState().buildFacility('tavern');
    expect(result).toBeNull();
    const facility = useGameStore.getState().facilities.find((f) => f.type === 'tavern');
    expect(facility?.level).toBe(0);
  });

  it('returns null with exactly 199 WOOD (boundary check)', () => {
    setupBuildState({ wood: 199, gold: 500 });
    const result = useGameStore.getState().buildFacility('tavern');
    expect(result).toBeNull();
  });

  it('succeeds with exactly 200 WOOD; WOOD decrements by exactly 200', () => {
    setupBuildState({ wood: 200, gold: 500 });

    const result = useGameStore.getState().buildFacility('tavern');

    expect(result).not.toBeNull();
    const woodAfter = useGameStore.getState().inventory.items.WOOD ?? 0;
    expect(woodAfter).toBe(0); // 200 - 200 = 0 (key deleted from items)
  });

  it('succeeds with WOOD > 200; WOOD decrements by exactly 200', () => {
    setupBuildState({ wood: 350, gold: 500 });

    const result = useGameStore.getState().buildFacility('tavern');

    expect(result).not.toBeNull();
    const woodAfter = useGameStore.getState().inventory.items.WOOD ?? 0;
    expect(woodAfter).toBe(150); // 350 - 200 = 150
  });

  it('tavern buildCost=0 → gold not spent on successful build', () => {
    setupBuildState({ wood: 200, gold: 500 });

    useGameStore.getState().buildFacility('tavern');

    expect(useGameStore.getState().gold).toBe(500); // buildCost=0
  });

  it('tavern facility transitions to level 1 on success', () => {
    setupBuildState({ wood: 200, gold: 500 });

    useGameStore.getState().buildFacility('tavern');

    const facility = useGameStore.getState().facilities.find((f) => f.type === 'tavern');
    expect(facility?.level).toBe(1);
  });
});

// ─── buildFacility — non-material facility (training-yard) ───────────────────

describe('buildFacility — training-yard (no material cost, gold only)', () => {
  it('builds successfully when gold >= 250 and guildLevel >= 3; no WOOD required', () => {
    setupBuildState({ wood: 0, gold: 500, guildLevel: 3 });

    const result = useGameStore.getState().buildFacility('training-yard');

    expect(result).not.toBeNull();
    const facility = useGameStore.getState().facilities.find((f) => f.type === 'training-yard');
    expect(facility?.level).toBe(1);
    expect(useGameStore.getState().gold).toBe(250); // 500 - 250
    // WOOD untouched (was 0, stays 0)
    expect(useGameStore.getState().inventory.items.WOOD ?? 0).toBe(0);
  });

  it('returns null when gold < 250', () => {
    setupBuildState({ wood: 500, gold: 100, guildLevel: 3 });

    const result = useGameStore.getState().buildFacility('training-yard');

    expect(result).toBeNull();
    expect(useGameStore.getState().gold).toBe(100);
  });

  it('returns null when guildLevel < 3 (even with enough gold)', () => {
    setupBuildState({ wood: 500, gold: 1000, guildLevel: 2 });

    const result = useGameStore.getState().buildFacility('training-yard');

    expect(result).toBeNull();
  });
});

// ─── handleFirstHaul ─────────────────────────────────────────────────────────

describe('handleFirstHaul — grants +200 WOOD +200 gold, advances step', () => {
  it('at assign-kael + Kael + logging-site → grants exactly +200 WOOD +200 gold', () => {
    const { memberId, facilityId } = setupFirstHaulState({ gold: 100 });

    handleFirstHaul(memberId, facilityId);

    const state = useGameStore.getState();
    expect(state.gold).toBe(300); // 100 + 200
    expect(state.inventory.items.WOOD ?? 0).toBe(200);
  });

  it('advances tutorialStep away from assign-kael', () => {
    const { memberId, facilityId } = setupFirstHaulState();

    handleFirstHaul(memberId, facilityId);

    const step = useGameStore.getState().tutorialStep;
    expect(step).not.toBe('assign-kael');
  });

  it('re-invoke after step advance → no double-grant (once-only guard)', () => {
    const { memberId, facilityId } = setupFirstHaulState({ gold: 0 });

    handleFirstHaul(memberId, facilityId); // first call — grants +200 WOOD +200 gold
    const goldAfterFirst = useGameStore.getState().gold;
    const woodAfterFirst = useGameStore.getState().inventory.items.WOOD ?? 0;

    handleFirstHaul(memberId, facilityId); // second call — should be no-op

    expect(useGameStore.getState().gold).toBe(goldAfterFirst);
    expect(useGameStore.getState().inventory.items.WOOD ?? 0).toBe(woodAfterFirst);
  });
});

describe('handleFirstHaul — no-op guard cases', () => {
  it('wrong tutorialStep (complete) → no-op', () => {
    const { memberId, facilityId } = setupFirstHaulState({ tutorialStep: 'complete', gold: 50 });

    handleFirstHaul(memberId, facilityId);

    expect(useGameStore.getState().gold).toBe(50);
    expect(useGameStore.getState().inventory.items.WOOD ?? 0).toBe(0);
    expect(useGameStore.getState().tutorialStep).toBe('complete');
  });

  it('wrong tutorialStep (build-logging-site) → no-op', () => {
    const { memberId, facilityId } = setupFirstHaulState({
      tutorialStep: 'build-logging-site',
      gold: 50,
    });

    handleFirstHaul(memberId, facilityId);

    expect(useGameStore.getState().gold).toBe(50);
    expect(useGameStore.getState().inventory.items.WOOD ?? 0).toBe(0);
  });

  it('non-Kael member at correct step + logging-site → no-op', () => {
    const { memberId, facilityId } = setupFirstHaulState({
      memberName: 'Morgana',
      gold: 50,
    });

    handleFirstHaul(memberId, facilityId);

    expect(useGameStore.getState().gold).toBe(50);
    expect(useGameStore.getState().inventory.items.WOOD ?? 0).toBe(0);
    expect(useGameStore.getState().tutorialStep).toBe('assign-kael');
  });

  it('Kael at correct step but wrong facility (workshop) → no-op', () => {
    // Activate workshop at level 1
    const { memberId } = setupFirstHaulState({ facilityType: 'workshop', gold: 50 });
    const workshopFacility = useGameStore.getState().facilities.find((f) => f.type === 'workshop');

    handleFirstHaul(memberId, workshopFacility!.id);

    expect(useGameStore.getState().gold).toBe(50);
    expect(useGameStore.getState().inventory.items.WOOD ?? 0).toBe(0);
    expect(useGameStore.getState().tutorialStep).toBe('assign-kael');
  });

  it('facilityId does not exist in store → no-op', () => {
    const { memberId } = setupFirstHaulState({ gold: 50 });

    handleFirstHaul(memberId, 'nonexistent-facility-id');

    expect(useGameStore.getState().gold).toBe(50);
    expect(useGameStore.getState().inventory.items.WOOD ?? 0).toBe(0);
  });
});
