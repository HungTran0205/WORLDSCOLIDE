/**
 * UI store tests — facility-hint persistence + tutorial reset.
 *
 * Covers:
 *  - markFacilityHintSeen: flips in-store flag true + writes JSON to localStorage
 *  - markFacilityHintSeen: second call is a no-op (stays true, no throw)
 *  - resetTutorials: clears all three facility hints + clears localStorage key + resets quest tutorial
 *  - localStorage read-back: written JSON parses to reflect the flag
 *  - read-on-init: store seeds facilityHintSeen from pre-existing localStorage via re-import
 *
 * Environment is `node` (vitest.config.ts), so window/localStorage do not exist.
 * The store guards on `typeof window === 'undefined'`; a minimal localStorage mock
 * is stubbed onto window so the persistence paths execute.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUiStore } from './ui-store';

const FACILITY_HINT_SEEN_KEY = 'facilityHintSeen';
const TUTORIAL_SEEN_KEY = 'questBoardTutorialSeen';

/** Minimal in-memory localStorage shim sufficient for the store's get/set/remove usage. */
function makeLocalStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    key: (i: number) => Array.from(map.keys())[i] ?? null,
  } as Storage;
}

// Stub a window with localStorage before any store action runs.
vi.stubGlobal('window', { localStorage: makeLocalStorage() });

beforeEach(() => {
  // Fresh localStorage + reset store back to non-persisted defaults each test.
  window.localStorage.clear();
  useUiStore.setState({
    questBoardTutorialSeen: false,
    facilityHintSeen: { workshop: false, 'alchemy-lab': false, tavern: false, 'training-yard': false },
  });
});

describe('ui store — markFacilityHintSeen', () => {
  it('flips the facility flag true and persists JSON to localStorage', () => {
    useUiStore.getState().markFacilityHintSeen('tavern');

    expect(useUiStore.getState().facilityHintSeen.tavern).toBe(true);

    const raw = window.localStorage.getItem(FACILITY_HINT_SEEN_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as Record<string, boolean>;
    expect(parsed.tavern).toBe(true);
  });

  it('only flips the named facility; others stay false', () => {
    useUiStore.getState().markFacilityHintSeen('tavern');

    const state = useUiStore.getState();
    expect(state.facilityHintSeen.tavern).toBe(true);
    expect(state.facilityHintSeen.workshop).toBe(false);
    expect(state.facilityHintSeen['alchemy-lab']).toBe(false);
  });

  it('second call for the same facility is a no-op (stays true, no throw)', () => {
    useUiStore.getState().markFacilityHintSeen('tavern');
    expect(() => useUiStore.getState().markFacilityHintSeen('tavern')).not.toThrow();
    expect(useUiStore.getState().facilityHintSeen.tavern).toBe(true);

    // localStorage still reflects exactly the one true flag.
    const parsed = JSON.parse(
      window.localStorage.getItem(FACILITY_HINT_SEEN_KEY) as string,
    ) as Record<string, boolean>;
    expect(parsed.tavern).toBe(true);
  });
});

describe('ui store — resetTutorials', () => {
  it('clears all three facility hints, clears localStorage key, and resets quest tutorial', () => {
    // Arrange: mark hints + quest tutorial seen.
    useUiStore.getState().markFacilityHintSeen('workshop');
    useUiStore.getState().markFacilityHintSeen('alchemy-lab');
    useUiStore.getState().markFacilityHintSeen('tavern');
    useUiStore.getState().markQuestTutorialSeen();
    expect(window.localStorage.getItem(FACILITY_HINT_SEEN_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(TUTORIAL_SEEN_KEY)).toBe('true');

    // Act
    useUiStore.getState().resetTutorials();

    // Assert: all facility hints false
    const state = useUiStore.getState();
    expect(state.facilityHintSeen.workshop).toBe(false);
    expect(state.facilityHintSeen['alchemy-lab']).toBe(false);
    expect(state.facilityHintSeen.tavern).toBe(false);
    // quest tutorial reset
    expect(state.questBoardTutorialSeen).toBe(false);
    // localStorage keys cleared
    expect(window.localStorage.getItem(FACILITY_HINT_SEEN_KEY)).toBeNull();
    expect(window.localStorage.getItem(TUTORIAL_SEEN_KEY)).toBeNull();
  });
});

describe('ui store — localStorage read-on-init', () => {
  it('seeds facilityHintSeen from pre-existing localStorage on module re-import', async () => {
    // Pre-populate localStorage before the store module reads it at load.
    window.localStorage.setItem(
      FACILITY_HINT_SEEN_KEY,
      JSON.stringify({ workshop: true }),
    );

    vi.resetModules();
    const { useUiStore: freshStore } = await import('./ui-store');

    const seeded = freshStore.getState().facilityHintSeen;
    expect(seeded.workshop).toBe(true);
    // Unset keys merge over defaults → stay false.
    expect(seeded.tavern).toBe(false);
    expect(seeded['alchemy-lab']).toBe(false);
  });
});
