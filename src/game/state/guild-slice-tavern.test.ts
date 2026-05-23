/**
 * Tavern daily lifecycle — slice integration tests.
 * Verifies: tickTavernDay idempotency, pre-tutorial guard, day-jump catch-up, and reroll mechanics.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, resetGameState } from './store';
import type { Member } from './game-state';

const FOUNDER_ID = 'founder-001';

function makeFounder(): Member {
  return {
    id: FOUNDER_ID,
    name: 'Founder',
    level: 5,
    exp: 0,
    stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 10, LCK: 5, AGI: 5 },
    unallocatedPoints: 0,
    skill: null,
    status: 'idle',
    injuredUntil: null,
    civilization: 'LinhSon',
    isFounder: true,
    rank: 'COMMANDER',
    missionsCompleted: 0,
    rarity: 1,
  };
}

function setupTavern(opts: { level?: 1 | 2 | 3; gold?: number; withFounder?: boolean } = {}) {
  resetGameState();
  const { level = 1, gold = 500, withFounder = true } = opts;
  useGameStore.setState((s) => ({
    gold,
    founder: withFounder ? makeFounder() : null,
    facilities: s.facilities.map((f) =>
      f.type === 'tavern'
        ? { ...f, level, assignedMemberIds: [], placedSlot: 0 }
        : f,
    ),
  }));
}

describe('tickTavernDay', () => {
  beforeEach(() => setupTavern());

  it('spawns a roster on first call', () => {
    useGameStore.getState().tickTavernDay(1);
    const tavern = useGameStore.getState().tavern;
    expect(tavern.currentRoster.length).toBeGreaterThan(0);
    expect(tavern.lastDayProcessed).toBe(1);
  });

  it('is idempotent for the same day', () => {
    useGameStore.getState().tickTavernDay(1);
    const firstRosterIds = useGameStore.getState().tavern.currentRoster.map((v) => v.id);
    useGameStore.getState().tickTavernDay(1);
    const secondRosterIds = useGameStore.getState().tavern.currentRoster.map((v) => v.id);
    expect(secondRosterIds).toEqual(firstRosterIds);
  });

  it('regenerates roster when day advances', () => {
    useGameStore.getState().tickTavernDay(1);
    const day1Ids = useGameStore.getState().tavern.currentRoster.map((v) => v.id);
    useGameStore.getState().tickTavernDay(2);
    const day2Ids = useGameStore.getState().tavern.currentRoster.map((v) => v.id);
    expect(day2Ids).not.toEqual(day1Ids);
    expect(useGameStore.getState().tavern.lastDayProcessed).toBe(2);
  });

  it('pre-tutorial (no founder) leaves roster empty and does not throw', () => {
    setupTavern({ withFounder: false });
    useGameStore.getState().tickTavernDay(1);
    expect(useGameStore.getState().tavern.currentRoster).toEqual([]);
  });

  it('offline catch-up: jumps from day 3 → day 6 with one respawn (no backlog)', () => {
    setupTavern();
    useGameStore.getState().tickTavernDay(3);
    expect(useGameStore.getState().tavern.lastDayProcessed).toBe(3);

    // Simulate offline jump straight to day 6.
    useGameStore.getState().tickTavernDay(6);
    expect(useGameStore.getState().tavern.lastDayProcessed).toBe(6);
    expect(useGameStore.getState().tavern.currentRoster.length).toBeGreaterThan(0);

    // Should match the deterministic day-6 roster directly (skip days 4 & 5 entirely).
    const directIds = useGameStore.getState().tavern.currentRoster.map((v) => v.id);
    setupTavern();
    useGameStore.getState().tickTavernDay(6);
    const expectedIds = useGameStore.getState().tavern.currentRoster.map((v) => v.id);
    expect(directIds).toEqual(expectedIds);
  });

  it('skips spawn when tavern level=0 (not built)', () => {
    resetGameState();
    useGameStore.setState({ founder: makeFounder() });
    useGameStore.getState().tickTavernDay(1);
    expect(useGameStore.getState().tavern.currentRoster).toEqual([]);
    expect(useGameStore.getState().tavern.lastDayProcessed).toBe(1);
  });

  it('passive reputation +1 every 7 days, capped at +5', () => {
    setupTavern();
    useGameStore.setState((s) => ({
      tavern: { ...s.tavern, reputation: 0, reputationLastTickWeek: 0 },
    }));
    useGameStore.getState().tickTavernDay(7);
    expect(useGameStore.getState().tavern.reputation).toBe(1);
    useGameStore.getState().tickTavernDay(14);
    expect(useGameStore.getState().tavern.reputation).toBe(2);
    // Large jump caps at +5.
    useGameStore.setState((s) => ({
      tavern: { ...s.tavern, reputation: 0, reputationLastTickWeek: 0 },
    }));
    useGameStore.getState().tickTavernDay(100);
    expect(useGameStore.getState().tavern.reputation).toBe(5);
  });
});

describe('rerollTavernRoster', () => {
  beforeEach(() => setupTavern({ level: 2, gold: 1000 }));

  it('succeeds, spends `100 × level` gold and replaces roster', () => {
    useGameStore.getState().tickTavernDay(3);
    const baseIds = useGameStore.getState().tavern.currentRoster.map((v) => v.id);

    const ok = useGameStore.getState().rerollTavernRoster();
    expect(ok).toBe(true);
    expect(useGameStore.getState().gold).toBe(1000 - 200); // 100 × Lv2

    const altIds = useGameStore.getState().tavern.currentRoster.map((v) => v.id);
    expect(altIds).not.toEqual(baseIds);
    expect(useGameStore.getState().tavern.rerolledToday).toBe(true);
  });

  it('is capped at 1 per day', () => {
    useGameStore.getState().tickTavernDay(3);
    const first = useGameStore.getState().rerollTavernRoster();
    const second = useGameStore.getState().rerollTavernRoster();
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('rejects when insufficient gold', () => {
    useGameStore.setState({ gold: 50 });
    useGameStore.getState().tickTavernDay(3);
    expect(useGameStore.getState().rerollTavernRoster()).toBe(false);
  });

  it('does NOT advance the game day', () => {
    useGameStore.getState().tickTavernDay(3);
    useGameStore.getState().rerollTavernRoster();
    expect(useGameStore.getState().tavern.lastDayProcessed).toBe(3);
  });

  it('reroll is deterministic — reload before reroll yields same alt roster', () => {
    useGameStore.getState().tickTavernDay(3);
    useGameStore.getState().rerollTavernRoster();
    const altIdsA = useGameStore.getState().tavern.currentRoster.map((v) => v.id);

    setupTavern({ level: 2, gold: 1000 });
    useGameStore.getState().tickTavernDay(3);
    useGameStore.getState().rerollTavernRoster();
    const altIdsB = useGameStore.getState().tavern.currentRoster.map((v) => v.id);

    expect(altIdsA).toEqual(altIdsB);
  });

  it('rerolledToday resets when day advances', () => {
    useGameStore.getState().tickTavernDay(3);
    useGameStore.getState().rerollTavernRoster();
    expect(useGameStore.getState().tavern.rerolledToday).toBe(true);

    useGameStore.getState().tickTavernDay(4);
    expect(useGameStore.getState().tavern.rerolledToday).toBe(false);
  });
});
