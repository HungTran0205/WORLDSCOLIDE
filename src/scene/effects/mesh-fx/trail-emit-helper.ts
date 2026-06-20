/**
 * emitTrailAlong — pure, alloc-free helper for weapon-trail emission.
 *
 * Pattern: same as the Ancestral aura loop in combat-fight-controller (emit
 * at a live position each throttle tick). Callers resolve the emitter once via
 * `useVFXEmitter('gen-trail-fire')` and pass the stable `.emit` closure here.
 *
 * Zero per-call allocation: position is mutated into a module-scoped scratch
 * array instead of constructing a new tuple each tick.
 */

/** Scratch array reused on every call — never reallocated. */
const _pos: number[] = [0, 0, 0];

/**
 * r3f-vfx emit signature (from `useVFXEmitter`). The overrides argument is
 * typed `null` in r3f-vfx; callers that need overrides use `as unknown as null`.
 * Trail emission uses no overrides, so we narrow to just pos + count.
 */
type EmitFn = (position: number[], count?: number) => void;

/**
 * Emit fire-trail particles along a linear thrust path.
 *
 * @param emit    - Resolved `useVFXEmitter('gen-trail-fire').emit` closure.
 * @param from    - Thrust origin in world space.
 * @param to      - Thrust tip target in world space.
 * @param progress - Normalized lance progress 0→1 (drives tip advance).
 * @param count   - Particles to emit at the tip each throttle tick.
 *
 * Emits at two points to give the trail body some density:
 *   1. Current tip = lerp(from, to, progress).
 *   2. Mid-body    = lerp(from, to, progress × 0.45) — only when progress > 0.15
 *      so the trail doesn't double-up at the very start.
 */
export function emitTrailAlong(
  emit: EmitFn,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  progress: number,
  count: number,
): void {
  // ─── Tip point ───────────────────────────────────────────────────────────
  _pos[0] = from[0] + (to[0] - from[0]) * progress;
  _pos[1] = from[1] + (to[1] - from[1]) * progress;
  _pos[2] = from[2] + (to[2] - from[2]) * progress;
  emit(_pos, count);

  // ─── Mid-body point (denser trail along the shaft) ───────────────────────
  if (progress > 0.15) {
    const mid = progress * 0.45;
    _pos[0] = from[0] + (to[0] - from[0]) * mid;
    _pos[1] = from[1] + (to[1] - from[1]) * mid;
    _pos[2] = from[2] + (to[2] - from[2]) * mid;
    emit(_pos, 1);
  }
}
