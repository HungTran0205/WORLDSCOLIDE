/**
 * Lightweight save scheduler — decouples "a meaningful state change happened"
 * from the SaveManager so store actions can request a prompt save without
 * importing the manager (which imports the store → would be circular).
 *
 * Store actions call `requestSave()` after a user-driven mutation (assign a
 * member, start/cancel training, equip a skill, …). The request is debounced so
 * a burst of rapid actions coalesces into one write. `app`/`SaveManager` registers
 * the actual save handler via `registerSaveHandler` while a slot is active.
 *
 * This closes the "did an action, closed the tab, lost it" gap: the 60s autosave
 * interval and the (async, unreliable-on-close) visibility save are no longer the
 * only persistence paths for fresh actions.
 */

const DEBOUNCE_MS = 2_000;

let handler: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Register (or clear with null) the function that performs the actual save. */
export function registerSaveHandler(fn: (() => void) | null): void {
  handler = fn;
}

/** Schedule a debounced save. No-op when no handler is registered (e.g. at title). */
export function requestSave(): void {
  if (!handler) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    handler?.();
  }, DEBOUNCE_MS);
}

/**
 * Save immediately — for discrete, costly actions (learn/cancel training, recruit…)
 * where the player expects instant persistence + the "saved" badge. Cancels any
 * pending debounce so it doesn't double-fire.
 */
export function saveNow(): void {
  if (timer) { clearTimeout(timer); timer = null; }
  handler?.();
}

/** Run any pending save immediately (e.g. on pagehide). Alias of saveNow. */
export function flushSave(): void {
  saveNow();
}
