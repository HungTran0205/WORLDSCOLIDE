/**
 * skipMemberRecovery — once-per-game-day guild-wide skip gate.
 *
 * Covers the four failure modes laid out in the GDD bed/queue spec:
 *  - no infirmary built (button never available)
 *  - member's remaining time still exceeds the 5-minute threshold
 *  - already used this game day (gated by `lastSkipDay` on the primary)
 *  - day rollover resets the lock
 *
 * Drives the real Zustand store so the gating logic + state shape stay aligned.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, resetGameState } from './store';
import { MS_PER_GAME_DAY } from './clock-slice';
import type { Member } from './game-state';

const FOUNDER_ID = 'founder-001';

function makeInjuredFounder(remainingMs: number): Member {
  return {
    id: FOUNDER_ID,
    name: 'Founder',
    grade: 'D',
    isMercenary: false,
    stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    unallocatedPoints: 0,
    skill: null,
    status: 'injured',
    injuredUntil: null,
    injuredAt: 0,
    // Pick base = remainingMs so progress=0 + passive ×1.0 → remaining ≈ remainingMs.
    baseRecoveryMs: remainingMs,
    recoveryProgress: 0,
    civilization: 'LinhSon',
    isFounder: true,
    missionsCompleted: 0,
  };
}

function setInfirmaryLevel(level: number) {
  useGameStore.setState((s) => ({
    facilities: s.facilities.map((f) =>
      f.id === 'infirmary' ? { ...f, level, lastSkipDay: null } : f,
    ),
  }));
}

function setGameTime(ms: number) {
  useGameStore.setState({ gameTime: ms });
}

describe('skipMemberRecovery', () => {
  beforeEach(() => {
    resetGameState();
    useGameStore.setState({ founder: makeInjuredFounder(60_000) });
    setGameTime(0);
  });

  it('returns false when no infirmary is built', () => {
    // infirmary stays at level 0 from resetGameState defaults
    const ok = useGameStore.getState().skipMemberRecovery(FOUNDER_ID);
    expect(ok).toBe(false);
    expect(useGameStore.getState().founder?.status).toBe('injured');
  });

  it('returns false when remaining time exceeds the 5-minute threshold', () => {
    setInfirmaryLevel(1);
    // 10-min remaining at passive rate → over the 5-min skip threshold.
    useGameStore.setState({ founder: makeInjuredFounder(10 * 60 * 1000) });
    const ok = useGameStore.getState().skipMemberRecovery(FOUNDER_ID);
    expect(ok).toBe(false);
    expect(useGameStore.getState().founder?.status).toBe('injured');
  });

  it('succeeds and stamps lastSkipDay when remaining ≤ 5 min', () => {
    setInfirmaryLevel(1);
    useGameStore.setState({ founder: makeInjuredFounder(4 * 60 * 1000) });
    const ok = useGameStore.getState().skipMemberRecovery(FOUNDER_ID);
    expect(ok).toBe(true);

    const founder = useGameStore.getState().founder!;
    expect(founder.status).toBe('idle');
    expect(founder.injuredAt).toBeNull();
    expect(founder.baseRecoveryMs).toBeNull();
    expect(founder.recoveryProgress).toBe(0);

    const infirmary = useGameStore.getState().facilities.find((f) => f.id === 'infirmary');
    expect(infirmary?.lastSkipDay).toBe(0); // gameTime = 0 → day 0
  });

  it('blocks a second skip on the same game day', () => {
    setInfirmaryLevel(1);
    useGameStore.setState({ founder: makeInjuredFounder(4 * 60 * 1000) });
    expect(useGameStore.getState().skipMemberRecovery(FOUNDER_ID)).toBe(true);

    // Re-injure the founder and try again on the same game day → blocked.
    useGameStore.setState({ founder: makeInjuredFounder(4 * 60 * 1000) });
    expect(useGameStore.getState().skipMemberRecovery(FOUNDER_ID)).toBe(false);
    expect(useGameStore.getState().founder?.status).toBe('injured');
  });

  it('re-enables skip after a game-day rollover', () => {
    setInfirmaryLevel(1);
    useGameStore.setState({ founder: makeInjuredFounder(4 * 60 * 1000) });
    expect(useGameStore.getState().skipMemberRecovery(FOUNDER_ID)).toBe(true);

    // Advance one full game day; lastSkipDay (0) is now stale, so skip is allowed again.
    setGameTime(MS_PER_GAME_DAY);
    useGameStore.setState({ founder: makeInjuredFounder(4 * 60 * 1000) });
    expect(useGameStore.getState().skipMemberRecovery(FOUNDER_ID)).toBe(true);
    const infirmary = useGameStore.getState().facilities.find((f) => f.id === 'infirmary');
    expect(infirmary?.lastSkipDay).toBe(1);
  });
});
