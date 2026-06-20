/**
 * Responsive zoom tests — guild-hall ortho camera.
 *
 * Covers:
 *  - desktop (>= breakpoint) is byte-identical: zoom 190, clamps 180/220
 *  - mobile shrinks zoom below 190 but never below MIN_ZOOM
 *  - short landscape phones are height-constrained
 *  - clamps scale proportionally with base zoom
 */

import { describe, it, expect } from 'vitest';
import {
  computeBaseZoom,
  computeZoomClamps,
  DESKTOP_ZOOM,
  DESKTOP_MIN_ZOOM,
  DESKTOP_MAX_ZOOM,
  MOBILE_BREAKPOINT,
  MIN_ZOOM,
  FIT_W,
  FIT_H,
} from '@/scene/responsive-zoom';

describe('computeBaseZoom — desktop path unchanged', () => {
  it('returns DESKTOP_ZOOM at and above the breakpoint', () => {
    expect(computeBaseZoom({ width: MOBILE_BREAKPOINT, height: 768 })).toBe(DESKTOP_ZOOM);
    expect(computeBaseZoom({ width: 1920, height: 1080 })).toBe(DESKTOP_ZOOM);
    expect(computeBaseZoom({ width: 2560, height: 1440 })).toBe(DESKTOP_ZOOM);
  });
});

describe('computeBaseZoom — mobile path fits the hall', () => {
  it('shrinks zoom below DESKTOP_ZOOM on a narrow portrait phone', () => {
    const z = computeBaseZoom({ width: 390, height: 844 });
    expect(z).toBeLessThan(DESKTOP_ZOOM);
    expect(z).toBeGreaterThanOrEqual(MIN_ZOOM);
    // Portrait → width is the binding axis.
    expect(z).toBeCloseTo(390 / FIT_W, 5);
  });

  it('never returns more than DESKTOP_ZOOM and never less than MIN_ZOOM', () => {
    for (const [w, h] of [
      [320, 480],
      [375, 667],
      [414, 896],
      [768, 1024],
      [100, 100],
    ] as const) {
      const z = computeBaseZoom({ width: w, height: h });
      expect(z).toBeLessThanOrEqual(DESKTOP_ZOOM);
      expect(z).toBeGreaterThanOrEqual(MIN_ZOOM);
    }
  });

  it('is height-constrained on a short landscape phone', () => {
    const z = computeBaseZoom({ width: 844, height: 390 });
    // Landscape, below breakpoint → height/FIT_H is the smaller of the two.
    expect(z).toBeCloseTo(390 / FIT_H, 5);
  });

  it('clamps to MIN_ZOOM on a degenerate viewport', () => {
    expect(computeBaseZoom({ width: 100, height: 100 })).toBe(MIN_ZOOM);
    expect(computeBaseZoom({ width: 0, height: 0 })).toBe(MIN_ZOOM);
  });
});

describe('computeZoomClamps — scales with base zoom', () => {
  it('returns the original 180/220 band at desktop zoom', () => {
    expect(computeZoomClamps(DESKTOP_ZOOM)).toEqual({
      minZoom: DESKTOP_MIN_ZOOM,
      maxZoom: DESKTOP_MAX_ZOOM,
    });
  });

  it('scales clamps proportionally below desktop zoom', () => {
    const base = DESKTOP_ZOOM / 2;
    const { minZoom, maxZoom } = computeZoomClamps(base);
    expect(minZoom).toBeCloseTo(DESKTOP_MIN_ZOOM / 2, 5);
    expect(maxZoom).toBeCloseTo(DESKTOP_MAX_ZOOM / 2, 5);
    // Base zoom stays within its own clamp band.
    expect(base).toBeGreaterThanOrEqual(minZoom);
    expect(base).toBeLessThanOrEqual(maxZoom);
  });
});
