/**
 * Camera impulse store — module singleton (not Zustand) for hot-path perf.
 *
 * Impulse model: each pushed impulse adds a decaying sine oscillator to the
 * camera offset. Multiple impulses are additive — two near-simultaneous hits
 * produce a stronger kick, not a replace.
 *
 * sampleOffset() is allocation-free: it writes into a caller-supplied scratch
 * object and prunes expired impulses via backward-iteration swap-remove (O(1)
 * per remove, no new array entries).
 *
 * Drive shake with wall-clock performance.now() — independent of
 * speedMultiplier so a 2× fight doesn't double shake frequency.
 */

interface Impulse {
  amp: number;
  freq: number;       // Hz
  startMs: number;    // wall-clock start (performance.now())
  durationS: number;
}

/** Active impulses — small live array, pruned in-place. */
const _impulses: Impulse[] = [];

/**
 * Push a new camera shake impulse.
 * Callable from the combat orchestrator on impact cues.
 */
export function pushCameraImpulse(p: {
  amplitude: number;
  frequency: number;
  durationS: number;
}): void {
  _impulses.push({
    amp: p.amplitude,
    freq: p.frequency,
    startMs: performance.now(),
    durationS: p.durationS,
  });
}

/**
 * Sample the current summed offset from all active impulses.
 * Writes into `out` (no allocation). Prunes expired impulses in-place.
 *
 * Formula per impulse: offset += amp * (1 - t/dur) * sin(freq * t * 2π)
 * where t = elapsed seconds from impulse start.
 *
 * @param nowMs  performance.now() — wall-clock, not engine time
 * @param out    caller-owned scratch object written in-place
 */
export function sampleOffset(
  nowMs: number,
  out: { x: number; y: number; zoom: number },
): void {
  out.x = 0;
  out.y = 0;
  out.zoom = 0;

  // Backward iteration so swap-remove doesn't skip un-sampled elements:
  // the element moved from the tail has already been sampled in this pass.
  let i = _impulses.length - 1;
  while (i >= 0) {
    const imp = _impulses[i];
    const tS = (nowMs - imp.startMs) / 1000;

    if (tS >= imp.durationS) {
      // Swap-remove expired impulse — O(1), no shifting
      _impulses[i] = _impulses[_impulses.length - 1];
      _impulses.pop();
      i--;
      continue;
    }

    const decay = 1 - tS / imp.durationS;      // linear fade 1→0
    const wave = Math.sin(imp.freq * tS * Math.PI * 2);
    out.x += imp.amp * decay * wave;
    out.y += imp.amp * 0.5 * decay * wave;      // y gets half the x amplitude
    i--;
  }
}

/** Discard all pending impulses — call on combat exit to avoid stale offsets. */
export function clearImpulses(): void {
  _impulses.length = 0;
}
