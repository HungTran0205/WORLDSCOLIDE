/**
 * Seeded RNG utilities for anti-save-scum systems (Tavern, future encounters).
 *
 * - `mulberry32(seed)` — fast 32-bit pure PRNG returning [0, 1) floats.
 * - `hashSeed(...keys)` — FNV-1a 32-bit string/number hash; namespace-safe combination of inputs.
 * - `dailyTavernSeed(saveSlotId, gameDay)` — deterministic per-day seed for tavern roster.
 * - `attemptSeed(daySeed, targetId, attemptCount)` — per-negotiation-attempt deterministic seed.
 *
 * All functions are pure and side-effect-free.
 */

/** Mulberry32 PRNG. Same seed → same sequence; cheap and well-distributed for game systems. */
export function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit hash of stringified keys, combined sequentially. Output is unsigned 32-bit. */
export function hashSeed(...keys: (string | number)[]): number {
  let h = 2166136261;
  for (const k of keys) {
    const s = String(k);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}

/** Daily tavern seed — namespaced by 'tavern' so different systems can share saveSlotId without collision. */
export function dailyTavernSeed(saveSlotId: string, gameDay: number): number {
  return hashSeed('tavern', saveSlotId, gameDay);
}

/** Per-attempt seed for negotiation rolls — keeps reload-before-negotiate deterministic. */
export function attemptSeed(daySeed: number, targetId: string, attemptCount: number): number {
  return hashSeed(daySeed, targetId, attemptCount);
}

/** Pick a uniformly-random element from `items` using the provided RNG. */
export function pickFromList<T>(items: readonly T[], rng: () => number): T {
  if (items.length === 0) throw new Error('pickFromList: empty list');
  return items[Math.floor(rng() * items.length)];
}

/** Pick `n` distinct elements without replacement (n ≤ items.length). */
export function pickDistinct<T>(items: readonly T[], n: number, rng: () => number): T[] {
  if (n > items.length) throw new Error(`pickDistinct: requested ${n} from ${items.length}`);
  const pool = [...items];
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

/** Weighted-table pick. Weights need not sum to 1; first match by cumulative threshold wins. */
export function weightedPick<T>(entries: readonly { value: T; weight: number }[], rng: () => number): T {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  if (total <= 0) throw new Error('weightedPick: non-positive total weight');
  let roll = rng() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll <= 0) return e.value;
  }
  return entries[entries.length - 1].value;
}
