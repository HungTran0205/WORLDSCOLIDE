/**
 * hitstop-clock unit test — verifies the presentation freeze:
 *   - duration clamps to [80, 150] ms
 *   - active window opens then auto-expires by wall-clock
 *   - a new request extends (never shortens) an in-flight freeze
 *   - presentationNow stalls by exactly the accumulated frozen wall-time
 *   - resetHitstop wipes state so a prior fight can't bleed into the next
 *
 * performance.now() is stubbed so time advances deterministically.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  triggerHitstop,
  isHitstopActive,
  tickAccum,
  presentationNow,
  resetHitstop,
} from './hitstop-clock';

let nowMs = 0;

beforeEach(() => {
  nowMs = 1_000;
  vi.spyOn(performance, 'now').mockImplementation(() => nowMs);
  resetHitstop();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('hitstop-clock', () => {
  it('clamps a too-short request up to the 80ms floor', () => {
    triggerHitstop(10);
    expect(isHitstopActive(nowMs + 79)).toBe(true);
    expect(isHitstopActive(nowMs + 80)).toBe(false);
  });

  it('clamps a too-long request down to the 150ms ceiling', () => {
    triggerHitstop(999);
    expect(isHitstopActive(nowMs + 149)).toBe(true);
    expect(isHitstopActive(nowMs + 150)).toBe(false);
  });

  it('auto-expires once wall-clock passes the window', () => {
    triggerHitstop(110);
    expect(isHitstopActive(nowMs)).toBe(true);
    expect(isHitstopActive(nowMs + 110)).toBe(false);
  });

  it('extends an in-flight freeze, never shortens it', () => {
    triggerHitstop(150);            // expires at now+150
    triggerHitstop(80);             // shorter — must NOT pull the expiry in
    expect(isHitstopActive(nowMs + 149)).toBe(true);
  });

  it('stalls presentationNow by the accumulated frozen time, then resumes', () => {
    // Raw elapsed clock advances 0.1s/tick; presentation should not advance
    // while frozen, then track raw again once the freeze ends.
    triggerHitstop(150);            // active for 150ms from nowMs (1000)

    // Two frozen ticks (0.1s each) accumulate 0.2s of stall.
    nowMs = 1_050; tickAccum(0.1, nowMs);
    nowMs = 1_100; tickAccum(0.1, nowMs);
    // presentation time = raw - accumulated stall.
    expect(presentationNow(5.0)).toBeCloseTo(5.0 - 0.2, 5);

    // After expiry, tickAccum no longer adds; stall total is frozen at 0.2s.
    nowMs = 1_200; tickAccum(0.1, nowMs);
    expect(presentationNow(6.0)).toBeCloseTo(6.0 - 0.2, 5);
  });

  it('resetHitstop clears active window and accumulated stall', () => {
    triggerHitstop(150);
    nowMs = 1_050; tickAccum(0.1, nowMs);
    resetHitstop();
    expect(isHitstopActive(1_000)).toBe(false);
    expect(presentationNow(7.0)).toBe(7.0);
  });
});
