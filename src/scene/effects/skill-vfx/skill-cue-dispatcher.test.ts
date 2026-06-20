/**
 * skill-cue-dispatcher unit test — verifies imperative cues fire at their
 * scheduled atMs, in order, with the right payload, and only for the cue types
 * the dispatcher owns (particles / shake / hitstop / sound). Mesh & trail cues
 * are owned by the layer and must be ignored here.
 *
 * The three singleton sinks (camera-impulse / hitstop / audio) are mocked so the
 * pure scheduler can be tested without R3F, howler, or store state.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const pushCameraImpulse = vi.fn();
const triggerHitstop = vi.fn();
const playSFX = vi.fn();

vi.mock('@/scene/combat/camera-impulse/camera-impulse-store', () => ({
  pushCameraImpulse: (...a: unknown[]) => pushCameraImpulse(...a),
}));
vi.mock('@/scene/combat/hitstop/hitstop-clock', () => ({
  triggerHitstop: (...a: unknown[]) => triggerHitstop(...a),
}));
vi.mock('@/audio/audio-manager', () => ({
  playSFX: (...a: unknown[]) => playSFX(...a),
}));

import { dispatchImperativeCues } from './skill-cue-dispatcher';
import type { Cue } from './cue-sheet-types';

const POS: [number, number, number] = [1, 2, 3];

describe('dispatchImperativeCues', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pushCameraImpulse.mockClear();
    triggerHitstop.mockClear();
    playSFX.mockClear();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('fires nothing before any cue time elapses', () => {
    const emitParticles = vi.fn();
    dispatchImperativeCues(
      [{ atMs: 100, type: 'particles', presetId: 'gen-hit', count: 10 }],
      POS,
      { emitParticles },
    );
    vi.advanceTimersByTime(99);
    expect(emitParticles).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(emitParticles).toHaveBeenCalledTimes(1);
    expect(emitParticles).toHaveBeenCalledWith('gen-hit', POS, 10);
  });

  it('fires cues in atMs order with correct payloads', () => {
    const calls: string[] = [];
    const emitParticles = vi.fn(() => { calls.push('particles'); });
    pushCameraImpulse.mockImplementation(() => { calls.push('shake'); });
    triggerHitstop.mockImplementation(() => { calls.push('hitstop'); });
    playSFX.mockImplementation(() => { calls.push('sound'); });

    const cues: Cue[] = [
      { atMs: 0,   type: 'mesh',      kind: 'thrust-lance',   durationMs: 450 }, // ignored
      { atMs: 0,   type: 'trail',     durationMs: 450 },                          // ignored
      { atMs: 300, type: 'particles', presetId: 'gen-burst', count: 20 },
      { atMs: 100, type: 'shake',     amplitude: 0.15, frequency: 35, durationS: 0.18 },
      { atMs: 200, type: 'hitstop',   durationMs: 110 },
      { atMs: 250, type: 'sound',     audioKey: 'sfx-pierce' },
    ];
    const timers = dispatchImperativeCues(cues, POS, { emitParticles });

    // Only 4 imperative cues scheduled (mesh + trail ignored).
    expect(timers).toHaveLength(4);

    vi.advanceTimersByTime(300);
    // Ordered by their atMs: shake(100) → hitstop(200) → sound(250) → particles(300).
    expect(calls).toEqual(['shake', 'hitstop', 'sound', 'particles']);

    expect(pushCameraImpulse).toHaveBeenCalledWith({ amplitude: 0.15, frequency: 35, durationS: 0.18 });
    expect(triggerHitstop).toHaveBeenCalledWith(110);
    expect(playSFX).toHaveBeenCalledWith('sfx-pierce');
    expect(emitParticles).toHaveBeenCalledWith('gen-burst', POS, 20);
  });

  it('returns timer handles that cancel pending cues when cleared', () => {
    const emitParticles = vi.fn();
    const timers = dispatchImperativeCues(
      [{ atMs: 200, type: 'sound', audioKey: 'sfx-pierce' }],
      POS,
      { emitParticles },
    );
    for (const t of timers) clearTimeout(t);
    vi.advanceTimersByTime(500);
    expect(playSFX).not.toHaveBeenCalled();
  });
});
