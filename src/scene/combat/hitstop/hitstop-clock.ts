/**
 * hitstop-clock — presentation-layer freeze for hit feedback.
 *
 * Decouples sprite/mesh-FX time from engine time: engine keeps running its
 * logical clock; this module tracks how much wall-clock was spent frozen so
 * `presentationNow` appears to stand still for ~80–150ms on impact.
 *
 * Two mechanisms work in lockstep:
 *   (a) Tick-gate — controller skips `engine.tick` each frame while active,
 *       so snapshot-driven sprites freeze (no new positions pushed to store).
 *   (b) Presentation clock — mesh-FX read `presentationNow` instead of raw
 *       `clock.elapsedTime`, so their progress also stalls for the window.
 */

/** Clamp hitstop requests to this range (ms). */
const MIN_MS = 80;
const MAX_MS = 150;

/** Monotonic wall-clock (ms) when the current freeze expires. 0 = inactive. */
let pauseUntilMs = 0;

/**
 * Accumulated seconds subtracted from raw R3F elapsed time so that
 * `presentationNow` stands still during freeze windows.
 */
let pausedAccumS = 0;

/**
 * Request a hitstop freeze of `durationMs` milliseconds.
 * Clamped to [MIN_MS, MAX_MS]. If a freeze is already in progress,
 * extends it (never shortens).
 */
export function triggerHitstop(durationMs: number): void {
  const clamped = Math.min(Math.max(durationMs, MIN_MS), MAX_MS);
  const expiry = performance.now() + clamped;
  if (expiry > pauseUntilMs) pauseUntilMs = expiry;
}

/**
 * Returns true while a hitstop window is active.
 * @param nowMs - current wall-clock ms (typically `performance.now()`)
 */
export function isHitstopActive(nowMs: number): boolean {
  return nowMs < pauseUntilMs;
}

/**
 * Called once per R3F frame by the controller.
 * While freeze is active, accumulates the raw frame delta into `pausedAccumS`
 * so `presentationNow` stalls by exactly that amount.
 *
 * @param rawDeltaS - R3F frame delta in seconds (the `delta` arg in useFrame)
 * @param nowMs     - current wall-clock ms (`performance.now()`)
 */
export function tickAccum(rawDeltaS: number, nowMs: number): void {
  if (isHitstopActive(nowMs)) {
    pausedAccumS += rawDeltaS;
  }
}

/**
 * Returns the presentation-layer time (seconds) — identical to R3F
 * `clock.elapsedTime` except it does not advance during freeze windows.
 *
 * @param rawElapsedS - R3F `clock.elapsedTime`
 */
export function presentationNow(rawElapsedS: number): number {
  return rawElapsedS - pausedAccumS;
}

/**
 * Reset all hitstop state — call when exiting combat so a stale freeze
 * from a previous fight cannot bleed into the next.
 */
export function resetHitstop(): void {
  pauseUntilMs = 0;
  pausedAccumS = 0;
}
