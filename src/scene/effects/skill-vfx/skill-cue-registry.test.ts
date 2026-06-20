/**
 * skill-cue-registry test — the 4 Templar skills resolve to dedicated full
 * sheets with the correct trigger, and the cheap civ-preset entries for
 * cleave/riposte/rally were removed (no stale single-particle fallback).
 */

import { describe, it, expect } from 'vitest';
import { hasCueSheet, getCueSheet } from './skill-cue-registry';

describe('skill-cue-registry', () => {
  it('resolves all four Templar skills', () => {
    for (const id of ['pierce', 'cleave', 'riposte', 'rally']) {
      expect(hasCueSheet(id)).toBe(true);
    }
  });

  it('Cleave is a cast-scoped, skill-use-triggered sheet using the cleave-arc mesh', () => {
    const sheet = getCueSheet('cleave')!;
    expect(sheet.castScoped).toBe(true);
    expect(sheet.trigger ?? 'skill-use').toBe('skill-use');
    expect(sheet.cues.some((c) => c.type === 'mesh' && c.kind === 'cleave-arc')).toBe(true);
  });

  it('Riposte fires on the riposte stance event', () => {
    expect(getCueSheet('riposte')!.trigger).toBe('effect-applied:riposte');
  });

  it('Rally fires on the buff-applied event', () => {
    expect(getCueSheet('rally')!.trigger).toBe('skill-buff-applied');
  });

  it('keeps non-Templar civ-preset sheets intact (e.g. sunder)', () => {
    expect(hasCueSheet('sunder')).toBe(true);
  });

  it('returns null / false for unknown skills', () => {
    expect(hasCueSheet('not-a-skill')).toBe(false);
    expect(getCueSheet(undefined)).toBeNull();
  });
});
