/**
 * Parity guard for the `ui` namespace.
 *
 * English is the source of truth; Vietnamese is the translation overlay. Every
 * key present in ui.en.json MUST have a counterpart in ui.vi.json and vice
 * versa — a missing key would fall back to English mid-interface, an orphan key
 * is dead weight that drifts out of sync. This test fails loud so neither can
 * ship.
 */

import { describe, expect, it } from 'vitest';

import uiEn from './ui.en.json';
import uiVi from './ui.vi.json';

/** Flattens a nested translation object to dotted leaf-key paths. */
function leafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? leafKeys(value as Record<string, unknown>, path)
      : [path];
  });
}

describe('ui namespace EN/VN parity', () => {
  const enKeys = leafKeys(uiEn as Record<string, unknown>);
  const viKeys = leafKeys(uiVi as Record<string, unknown>);

  it('every English key has a Vietnamese translation', () => {
    const missingInVi = enKeys.filter((k) => !viKeys.includes(k));
    expect(missingInVi).toEqual([]);
  });

  it('every Vietnamese key maps to an English key (no orphans)', () => {
    const orphanInVi = viKeys.filter((k) => !enKeys.includes(k));
    expect(orphanInVi).toEqual([]);
  });
});
