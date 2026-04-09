/** Zustand slice bridging R3F zone clicks → React UI panel state */

import type { StateCreator } from 'zustand';
import type { FacilityType } from '@/game/state/game-state';

export interface FacilityZoneSlice {
  /** Trigger to open facilities panel (cleared by GameScreen after opening) */
  pendingFacilityPanel: FacilityType | null;
  /** Scroll target for FacilitiesPanel (cleared on panel unmount) */
  focusFacilityType: FacilityType | null;
  setPendingFacilityPanel: (type: FacilityType) => void;
  clearPendingFacilityPanel: () => void;
  clearFocusFacilityType: () => void;
}

export const createFacilityZoneSlice: StateCreator<FacilityZoneSlice> = (set) => ({
  pendingFacilityPanel: null,
  focusFacilityType: null,

  /** Sets both trigger and scroll target simultaneously */
  setPendingFacilityPanel: (type) =>
    set({ pendingFacilityPanel: type, focusFacilityType: type }),

  clearPendingFacilityPanel: () =>
    set({ pendingFacilityPanel: null }),

  clearFocusFacilityType: () =>
    set({ focusFacilityType: null }),
});
