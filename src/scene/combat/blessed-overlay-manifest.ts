/**
 * Descriptor for the Ancestral Blessings baked overlay sheet (gold outline + tattoo).
 *
 * The overlay is a single-row sheet of square frames authored 1:1 with the body
 * combat frames (same 128px). Per-animation segment offsets select the cell range
 * so the composite builder can draw the matching overlay frame full-frame over each
 * body frame (see combat-mask-composite-atlas.ts → BlessedOverlaySource).
 *
 * `lv1` in the asset name reserves space for future rank tiers — the POC ships lv1
 * only. Death has no overlay (excluded by design); casting uses its own dedicated
 * clip, so only idle/attack/blocking are mapped here.
 *
 * POC scope: LS-SWORD-M only. Add entries as overlay art lands for other archetypes.
 */

import { assetUrl } from '@/lib/asset-url';
import type { CombatMaskAnim } from './combat-mask-anchors';

export interface BlessedOverlaySegment {
  /** First overlay cell index for this animation within the single-row sheet. */
  offset: number;
  /** Overlay frame count for this animation (must match the body frame count). */
  count: number;
}

export interface BlessedOverlayDescriptor {
  /** Public URL to the overlay sheet PNG (already wrapped via assetUrl). */
  path: string;
  /**
   * Square frame size in px (matches the body combat frame size). Descriptive only —
   * the composite builder derives the actual draw size from the overlay sheet height,
   * so this stays self-correcting if art re-exports at a different resolution.
   */
  frameSize: number;
  /** Per-animation cell segments within the single-row sheet. */
  segments: Record<CombatMaskAnim, BlessedOverlaySegment>;
}

/**
 * charId → overlay descriptor. POC: LS-SWORD-M only.
 *
 * Ancestral-lv1-overlay.png = 2560×128 = 20 cols × 1 row (128px square frames):
 *   idle = cells 0..7 · attack = cells 8..15 · blocking = cells 16..19.
 */
const BLESSED_OVERLAY_MANIFEST: Record<string, BlessedOverlayDescriptor> = {
  'LS-SWORD-M': {
    path: assetUrl('/sprites/characters/LS-SWORD-M/animations/Ancestral-lv1-overlay.png'),
    frameSize: 128,
    segments: {
      idle: { offset: 0, count: 8 },
      attack: { offset: 8, count: 8 },
      blocking: { offset: 16, count: 4 },
    },
  },
};

/** Overlay descriptor for a character, or undefined when none is authored. */
export function getBlessedOverlayDescriptor(
  charId: string,
): BlessedOverlayDescriptor | undefined {
  return BLESSED_OVERLAY_MANIFEST[charId];
}

/** True when the character has a baked Ancestral Blessings overlay sheet. */
export function hasBlessedOverlay(charId: string): boolean {
  return charId in BLESSED_OVERLAY_MANIFEST;
}
