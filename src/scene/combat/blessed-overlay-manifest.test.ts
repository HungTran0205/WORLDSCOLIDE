/**
 * Tests for blessed-overlay-manifest.ts — descriptor lookup + segment layout.
 *
 * Validates the LS-SWORD-M (POC) overlay descriptor matches the on-disk sheet
 * layout (single row: idle 0/8, attack 8/8, blocking 16/4) so the composite
 * builder slices the correct cells.
 */

import { describe, it, expect } from 'vitest';
import {
  getBlessedOverlayDescriptor,
  hasBlessedOverlay,
} from './blessed-overlay-manifest';
import {
  COMBAT_IDLE_FRAME_COUNT,
  COMBAT_ATTACK_FRAME_COUNT,
  COMBAT_BLOCKING_FRAME_COUNT,
} from '@/scene/sprites/combat-sprite-resolver';

describe('blessed-overlay-manifest', () => {
  it('LS-SWORD-M has an overlay descriptor', () => {
    expect(hasBlessedOverlay('LS-SWORD-M')).toBe(true);
    expect(getBlessedOverlayDescriptor('LS-SWORD-M')).toBeDefined();
  });

  it('unknown char has no overlay', () => {
    expect(hasBlessedOverlay('LS-WARRIOR-M')).toBe(false);
    expect(getBlessedOverlayDescriptor('LS-WARRIOR-M')).toBeUndefined();
    expect(getBlessedOverlayDescriptor('')).toBeUndefined();
  });

  it('LS-SWORD-M segments match the 20-cell single-row layout', () => {
    const d = getBlessedOverlayDescriptor('LS-SWORD-M')!;
    expect(d.frameSize).toBe(128);
    expect(d.path).toContain('Ancestral-lv1-overlay.png');
    expect(d.segments.idle).toEqual({ offset: 0, count: 8 });
    expect(d.segments.attack).toEqual({ offset: 8, count: 8 });
    expect(d.segments.blocking).toEqual({ offset: 16, count: 4 });
  });

  it('segments are contiguous and fit within 20 cells', () => {
    const d = getBlessedOverlayDescriptor('LS-SWORD-M')!;
    const { idle, attack, blocking } = d.segments;
    // idle → attack → blocking lay out back-to-back without gaps/overlap.
    expect(idle.offset + idle.count).toBe(attack.offset);
    expect(attack.offset + attack.count).toBe(blocking.offset);
    expect(blocking.offset + blocking.count).toBeLessThanOrEqual(20);
  });

  it('segment counts match the body combat frame counts (overlay aligns per frame)', () => {
    // Each overlay segment must have one cell per body frame or the composite
    // builder would clamp/hold frames — keep them locked to the body anim lengths.
    const d = getBlessedOverlayDescriptor('LS-SWORD-M')!;
    expect(d.segments.idle.count).toBe(COMBAT_IDLE_FRAME_COUNT);
    expect(d.segments.attack.count).toBe(COMBAT_ATTACK_FRAME_COUNT);
    expect(d.segments.blocking.count).toBe(COMBAT_BLOCKING_FRAME_COUNT);
  });
});
