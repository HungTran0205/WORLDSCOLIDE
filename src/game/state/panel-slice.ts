/**
 * Panel visibility slice — owns which panels are open across TWO independent axes:
 *
 *   mainPanel:     HUD-toggle / drum-click driven (quests|roster|facilities|combat|settings)
 *   facilityPanel: proximity-driven (workshop|alchemy-lab|tavern|training-yard)
 *
 * The two axes are MUTUALLY EXCLUSIVE: opening a main panel closes any facility panel
 * and vice-versa. This mirrors the original boolean state semantics while giving a
 * clean single source of truth.
 *
 * COMBAT PANEL BOUNDARY: 'combat' appears in PanelId to allow the CombatView legacy
 * overlay (guild-hall scene) to be toggled via the same HUD mechanism. The new
 * CombatPanel (useCombatPanelStore) is a SEPARATE store managing the idle-combat
 * overlay — it is NOT owned here. Setting mainPanel='combat' does not affect
 * useCombatPanelStore.isOpen, and vice-versa.
 *
 * CAMERA-SETTLE COORDINATION: panel state is set immediately; game-screen passes
 * `cameraSettled` from the game store down to panels that need it (quest-board,
 * facility panels) so their content fade-in can wait for the camera to arrive.
 * Chrome (frame/title) appears right away — only inner content gates on settle.
 * This avoids the "panel pops up while camera is still flying" visual glitch without
 * introducing a timing delay in the store.
 */

import type { StateCreator } from 'zustand';

/** Panels driven by HUD toggle or drum click. */
export type PanelId = 'quests' | 'roster' | 'combat' | 'settings' | 'facilities' | null;

/** Facility function panels driven by proximity (camera in room) + object click. */
export type FacilityFunctionType = 'workshop' | 'alchemy-lab' | 'tavern' | 'training-yard';

export interface PanelSlice {
  /** Currently open HUD-toggle panel. Null = no main panel open. */
  mainPanel: PanelId;
  /** Currently open proximity-based facility panel. Null = no facility panel open. */
  facilityPanel: FacilityFunctionType | null;

  /** Open a main panel. Clears facilityPanel (mutual exclusion across axes). */
  openPanel: (id: NonNullable<PanelId>) => void;
  /** Close the active main panel. */
  closePanel: () => void;
  /** Open a facility panel. Clears mainPanel (mutual exclusion across axes). */
  openFacilityPanel: (type: FacilityFunctionType) => void;
  /** Close the active facility panel. */
  closeFacilityPanel: () => void;
  /** Close both axes simultaneously (e.g. Esc key). */
  closeAllPanels: () => void;
}

export const createPanelSlice: StateCreator<PanelSlice> = (set) => ({
  mainPanel: null,
  facilityPanel: null,

  openPanel: (id) => set({ mainPanel: id, facilityPanel: null }),

  closePanel: () => set({ mainPanel: null }),

  openFacilityPanel: (type) => set({ facilityPanel: type, mainPanel: null }),

  closeFacilityPanel: () => set({ facilityPanel: null }),

  closeAllPanels: () => set({ mainPanel: null, facilityPanel: null }),
});
