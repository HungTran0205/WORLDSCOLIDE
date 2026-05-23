/**
 * Per-frame pixel anchors for combat mask compositing.
 *
 * All coordinates are in 128×128 frame space, top-left origin.
 * `x/y` = mask center; composite builder converts to draw rect via:
 *   drawX = anchor.x - anchor.size / 2
 *   drawY = anchor.y - anchor.size / 2
 *
 * Initial values are seeded to a rough head-center ({x:64, y:40, size:38}).
 * Exact per-frame values are authored live in Phase 4 via combat-mask-dev-tuner.
 */

export type CombatMaskAnim = 'idle' | 'attack' | 'blocking';

export interface CombatMaskAnchor {
  /** Mask center X in 128×128 frame pixels. */
  x: number;
  /** Mask center Y in 128×128 frame pixels. */
  y: number;
  /** Mask draw size in pixels (square). */
  size: number;
}

// Rough head-center seed — all frames start here; tune in Phase 4.
const HEAD: CombatMaskAnchor = { x: 64, y: 40, size: 38 };

/** Build an array of N copies of a seed anchor. */
function seed(n: number, s: CombatMaskAnchor = HEAD): CombatMaskAnchor[] {
  return Array.from({ length: n }, () => ({ ...s }));
}

type AnchorTable = Record<CombatMaskAnim, CombatMaskAnchor[]>;

const ANCHOR_TABLE: Record<string, AnchorTable> = {
  'LS-SWORD-M': {
    idle: [
      { x: 68, y: 66, size: 38 },
      { x: 70, y: 65, size: 38 },
      { x: 74, y: 67, size: 38 },
      { x: 74, y: 68, size: 38 },
      { x: 73, y: 67, size: 38 },
      { x: 71, y: 65, size: 38 },
      { x: 68, y: 64, size: 38 },
      { x: 68, y: 64, size: 38 },
    ],
    attack: [
      { x: 73, y: 62, size: 38 },
      { x: 74, y: 64, size: 38 },
      { x: 75, y: 64, size: 38 },
      { x: 75, y: 65, size: 38 },
      { x: 70, y: 63, size: 38 },
      { x: 68, y: 63, size: 38 },
      { x: 75, y: 63, size: 38 },
      { x: 77, y: 63, size: 38 },
    ],
    blocking: [
      { x: 68, y: 66, size: 38 },
      { x: 70, y: 65, size: 38 },
      { x: 74, y: 67, size: 38 },
      { x: 74, y: 68, size: 38 }
    ],
  },
  'LS-WARRIOR-M': {
    idle: [
      { x: 63, y: 59, size: 38 },
      { x: 62, y: 58, size: 38 },
      { x: 62, y: 59, size: 38 },
      { x: 61, y: 59, size: 38 },
      { x: 61, y: 59, size: 38 },
      { x: 62, y: 59, size: 38 },
      { x: 62, y: 58, size: 38 },
      { x: 62, y: 60, size: 38 },
    ],
    attack: [
      { x: 54, y: 52, size: 38 },
      { x: 54, y: 52, size: 38 },
      { x: 54, y: 52, size: 38 },
      { x: 54, y: 52, size: 38 },
      { x: 54, y: 52, size: 38 },
      { x: 76, y: 70, size: 38 },
      { x: 76, y: 70, size: 38 },
      { x: 76, y: 70, size: 38 },
    ],
    blocking: [
      { x: 63, y: 59, size: 38 },
      { x: 62, y: 58, size: 38 },
      { x: 62, y: 59, size: 38 },
      { x: 61, y: 59, size: 38 }
    ],
  },
  'LS-SCOUT-F': {
    idle: [
      { x: 64, y: 50, size: 38 },
      { x: 64, y: 50, size: 38 },
      { x: 66, y: 52, size: 38 },
      { x: 68, y: 53, size: 38 },
      { x: 69, y: 54, size: 38 },
      { x: 69, y: 54, size: 38 },
      { x: 69, y: 53, size: 38 },
      { x: 69, y: 54, size: 38 },
    ],
    attack: [
      { x: 69, y: 53, size: 38 },
      { x: 69, y: 53, size: 38 },
      { x: 69, y: 53, size: 38 },
      { x: 69, y: 53, size: 38 },
      { x: 69, y: 53, size: 38 },
      { x: 69, y: 53, size: 38 },
      { x: 69, y: 53, size: 38 },
      { x: 69, y: 53, size: 38 },
    ],
    blocking: [
      { x: 64, y: 50, size: 38 },
      { x: 64, y: 50, size: 38 },
      { x: 66, y: 52, size: 38 },
      { x: 68, y: 53, size: 38 }
    ],
  },
};

const FALLBACK_ANCHOR: CombatMaskAnchor = { x: 64, y: 40, size: 38 };

/**
 * Returns the pixel-space anchor for the mask center in a given frame.
 * Falls back to `FALLBACK_ANCHOR` for unknown charIds or out-of-bounds frames.
 */
export function resolveCombatMaskAnchor(
  charId: string,
  anim: CombatMaskAnim,
  frameIndex: number,
): CombatMaskAnchor {
  const table = ANCHOR_TABLE[charId];
  if (!table) return FALLBACK_ANCHOR;

  const frames = table[anim];
  if (!frames || frames.length === 0) return FALLBACK_ANCHOR;

  // Wrap frameIndex so callers can pass raw atlas frame without clamping.
  return frames[frameIndex % frames.length] ?? FALLBACK_ANCHOR;
}

// --- DEV helpers (used by combat-mask-dev-tuner.tsx) ---

/** Mutate one anchor in the live table. Caller must invalidate the cached atlas afterward. */
export function setDevAnchorOverride(
  charId: string,
  anim: CombatMaskAnim,
  frameIndex: number,
  anchor: CombatMaskAnchor,
): void {
  const table = ANCHOR_TABLE[charId];
  if (!table) return;
  const frames = table[anim];
  if (frames && frameIndex < frames.length) {
    frames[frameIndex] = { ...anchor };
  }
}

/** Return a snapshot of the anchor table for console export/paste-back. */
export function getAnchorTable(): Record<string, Record<CombatMaskAnim, CombatMaskAnchor[]>> {
  return ANCHOR_TABLE;
}
