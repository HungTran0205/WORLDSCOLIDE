/**
 * Panel slice tests — ui-store panel manager state machine.
 *
 * Covers:
 *  - openPanel: sets mainPanel + clears facilityPanel (mutual exclusion)
 *  - openFacilityPanel: sets facilityPanel + clears mainPanel (mutual exclusion)
 *  - closePanel: clears mainPanel only
 *  - closeFacilityPanel: clears facilityPanel only
 *  - closeAllPanels: clears both axes
 *  - mutual exclusion holds across rapid axis switches
 *  - idempotency: closing when already null is safe; opening same panel twice keeps it open
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createPanelSlice, type PanelSlice } from './panel-slice';

// Instantiate the slice in isolation as its own tiny store.
const usePanelStore = create<PanelSlice>(createPanelSlice);

beforeEach(() => {
  // Reset to a fresh slice between tests.
  usePanelStore.setState(createPanelSlice(usePanelStore.setState, usePanelStore.getState, usePanelStore), true);
});

describe('panel slice — initial state', () => {
  it('mainPanel and facilityPanel default to null', () => {
    const state = usePanelStore.getState();
    expect(state.mainPanel).toBeNull();
    expect(state.facilityPanel).toBeNull();
  });
});

describe('panel slice — openPanel (main axis)', () => {
  it('sets mainPanel to the given id', () => {
    usePanelStore.getState().openPanel('quests');

    const state = usePanelStore.getState();
    expect(state.mainPanel).toBe('quests');
  });

  it('clears facilityPanel when opening a main panel', () => {
    // Arrange: set up a facility panel first
    usePanelStore.getState().openFacilityPanel('workshop');
    expect(usePanelStore.getState().facilityPanel).toBe('workshop');

    // Act: open a main panel
    usePanelStore.getState().openPanel('quests');

    // Assert: main panel is set, facility panel is cleared
    const state = usePanelStore.getState();
    expect(state.mainPanel).toBe('quests');
    expect(state.facilityPanel).toBeNull();
  });

  it('allows switching between different main panels', () => {
    usePanelStore.getState().openPanel('quests');
    expect(usePanelStore.getState().mainPanel).toBe('quests');

    usePanelStore.getState().openPanel('roster');
    expect(usePanelStore.getState().mainPanel).toBe('roster');

    usePanelStore.getState().openPanel('settings');
    expect(usePanelStore.getState().mainPanel).toBe('settings');
  });

  it('opening the same main panel twice keeps it open (idempotent)', () => {
    usePanelStore.getState().openPanel('quests');
    usePanelStore.getState().openPanel('quests');

    expect(usePanelStore.getState().mainPanel).toBe('quests');
  });
});

describe('panel slice — closePanel (main axis)', () => {
  it('clears mainPanel only', () => {
    // Arrange: set up both axes
    usePanelStore.getState().openPanel('quests');
    // Note: can't have both simultaneously, but we can verify the state is clean
    expect(usePanelStore.getState().mainPanel).toBe('quests');

    // Act: close main panel
    usePanelStore.getState().closePanel();

    // Assert: main is cleared
    const state = usePanelStore.getState();
    expect(state.mainPanel).toBeNull();
    expect(state.facilityPanel).toBeNull();
  });

  it('closing an already-null mainPanel is a no-op', () => {
    const state1 = usePanelStore.getState();
    expect(state1.mainPanel).toBeNull();

    // Act: close when already closed
    expect(() => usePanelStore.getState().closePanel()).not.toThrow();

    const state2 = usePanelStore.getState();
    expect(state2.mainPanel).toBeNull();
  });
});

describe('panel slice — openFacilityPanel (facility axis)', () => {
  it('sets facilityPanel to the given type', () => {
    usePanelStore.getState().openFacilityPanel('workshop');

    const state = usePanelStore.getState();
    expect(state.facilityPanel).toBe('workshop');
  });

  it('clears mainPanel when opening a facility panel', () => {
    // Arrange: set up a main panel first
    usePanelStore.getState().openPanel('quests');
    expect(usePanelStore.getState().mainPanel).toBe('quests');

    // Act: open a facility panel
    usePanelStore.getState().openFacilityPanel('workshop');

    // Assert: facility panel is set, main panel is cleared
    const state = usePanelStore.getState();
    expect(state.facilityPanel).toBe('workshop');
    expect(state.mainPanel).toBeNull();
  });

  it('allows switching between different facility panels', () => {
    usePanelStore.getState().openFacilityPanel('workshop');
    expect(usePanelStore.getState().facilityPanel).toBe('workshop');

    usePanelStore.getState().openFacilityPanel('alchemy-lab');
    expect(usePanelStore.getState().facilityPanel).toBe('alchemy-lab');

    usePanelStore.getState().openFacilityPanel('tavern');
    expect(usePanelStore.getState().facilityPanel).toBe('tavern');

    usePanelStore.getState().openFacilityPanel('training-yard');
    expect(usePanelStore.getState().facilityPanel).toBe('training-yard');
  });

  it('opening the same facility panel twice keeps it open (idempotent)', () => {
    usePanelStore.getState().openFacilityPanel('workshop');
    usePanelStore.getState().openFacilityPanel('workshop');

    expect(usePanelStore.getState().facilityPanel).toBe('workshop');
  });
});

describe('panel slice — closeFacilityPanel (facility axis)', () => {
  it('clears facilityPanel only', () => {
    // Arrange: set up facility panel
    usePanelStore.getState().openFacilityPanel('workshop');
    expect(usePanelStore.getState().facilityPanel).toBe('workshop');

    // Act: close facility panel
    usePanelStore.getState().closeFacilityPanel();

    // Assert: facility is cleared, main remains null
    const state = usePanelStore.getState();
    expect(state.facilityPanel).toBeNull();
    expect(state.mainPanel).toBeNull();
  });

  it('closing an already-null facilityPanel is a no-op', () => {
    const state1 = usePanelStore.getState();
    expect(state1.facilityPanel).toBeNull();

    // Act: close when already closed
    expect(() => usePanelStore.getState().closeFacilityPanel()).not.toThrow();

    const state2 = usePanelStore.getState();
    expect(state2.facilityPanel).toBeNull();
  });
});

describe('panel slice — closeAllPanels', () => {
  it('clears both mainPanel and facilityPanel', () => {
    // Arrange: set a main panel (facility will be cleared due to mutual exclusion)
    usePanelStore.getState().openPanel('quests');
    expect(usePanelStore.getState().mainPanel).toBe('quests');

    // Act: close all
    usePanelStore.getState().closeAllPanels();

    // Assert: both are cleared
    const state = usePanelStore.getState();
    expect(state.mainPanel).toBeNull();
    expect(state.facilityPanel).toBeNull();
  });

  it('closeAllPanels when both are already null is a no-op', () => {
    const state1 = usePanelStore.getState();
    expect(state1.mainPanel).toBeNull();
    expect(state1.facilityPanel).toBeNull();

    // Act
    expect(() => usePanelStore.getState().closeAllPanels()).not.toThrow();

    const state2 = usePanelStore.getState();
    expect(state2.mainPanel).toBeNull();
    expect(state2.facilityPanel).toBeNull();
  });
});

describe('panel slice — mutual exclusion', () => {
  it('rapid axis switches enforce mutual exclusion: main → facility → main', () => {
    // Open main panel
    usePanelStore.getState().openPanel('quests');
    expect(usePanelStore.getState().mainPanel).toBe('quests');
    expect(usePanelStore.getState().facilityPanel).toBeNull();

    // Switch to facility panel
    usePanelStore.getState().openFacilityPanel('workshop');
    expect(usePanelStore.getState().mainPanel).toBeNull();
    expect(usePanelStore.getState().facilityPanel).toBe('workshop');

    // Switch back to main panel
    usePanelStore.getState().openPanel('roster');
    expect(usePanelStore.getState().mainPanel).toBe('roster');
    expect(usePanelStore.getState().facilityPanel).toBeNull();

    // Switch to facility again
    usePanelStore.getState().openFacilityPanel('alchemy-lab');
    expect(usePanelStore.getState().mainPanel).toBeNull();
    expect(usePanelStore.getState().facilityPanel).toBe('alchemy-lab');
  });

  it('opening main panel while facility is open clears facility', () => {
    usePanelStore.getState().openFacilityPanel('tavern');
    expect(usePanelStore.getState().facilityPanel).toBe('tavern');

    usePanelStore.getState().openPanel('settings');

    const state = usePanelStore.getState();
    expect(state.mainPanel).toBe('settings');
    expect(state.facilityPanel).toBeNull();
  });

  it('opening facility panel while main is open clears main', () => {
    usePanelStore.getState().openPanel('quests');
    expect(usePanelStore.getState().mainPanel).toBe('quests');

    usePanelStore.getState().openFacilityPanel('training-yard');

    const state = usePanelStore.getState();
    expect(state.facilityPanel).toBe('training-yard');
    expect(state.mainPanel).toBeNull();
  });
});

describe('panel slice — closure combinations', () => {
  it('closePanel does not affect facilityPanel if only main was open', () => {
    usePanelStore.getState().openPanel('quests');
    usePanelStore.getState().closePanel();

    expect(usePanelStore.getState().mainPanel).toBeNull();
    expect(usePanelStore.getState().facilityPanel).toBeNull();
  });

  it('closeFacilityPanel does not affect mainPanel if only facility was open', () => {
    usePanelStore.getState().openFacilityPanel('workshop');
    usePanelStore.getState().closeFacilityPanel();

    expect(usePanelStore.getState().facilityPanel).toBeNull();
    expect(usePanelStore.getState().mainPanel).toBeNull();
  });

  it('closePanel + closeFacilityPanel in sequence equals closeAllPanels', () => {
    // Arrange: set main panel
    usePanelStore.getState().openPanel('quests');

    // Act: close main then facility
    usePanelStore.getState().closePanel();
    usePanelStore.getState().closeFacilityPanel();

    // Assert: both are null
    const state = usePanelStore.getState();
    expect(state.mainPanel).toBeNull();
    expect(state.facilityPanel).toBeNull();
  });
});
