import { create } from 'zustand';
import { createPanelSlice, type PanelSlice } from './panel-slice';

export type { PanelId, FacilityFunctionType } from './panel-slice';

const TUTORIAL_SEEN_KEY = 'questBoardTutorialSeen';
const FACILITY_HINT_SEEN_KEY = 'facilityHintSeen';

/** Facility types that surface a function panel via their iconic 3D object. */
export type FacilityHintType = 'workshop' | 'alchemy-lab' | 'tavern' | 'training-yard';

type FacilityHintSeen = Record<FacilityHintType, boolean>;

const FACILITY_HINT_DEFAULT: FacilityHintSeen = {
  workshop: false,
  'alchemy-lab': false,
  tavern: false,
  'training-yard': false,
};

// Read once at module load. window guard keeps SSR / test env safe.
const readTutorialSeen = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
};

const writeTutorialSeen = (value: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    else window.localStorage.removeItem(TUTORIAL_SEEN_KEY);
  } catch {
    // localStorage may be unavailable (private mode, quota) — fail silently
  }
};

// Defaults to all-false so existing saves (past the tutorial) still get the hint
// once per room. Merges over defaults to stay forward-compatible if a key is added.
const readFacilityHintSeen = (): FacilityHintSeen => {
  if (typeof window === 'undefined') return { ...FACILITY_HINT_DEFAULT };
  try {
    const raw = window.localStorage.getItem(FACILITY_HINT_SEEN_KEY);
    if (!raw) return { ...FACILITY_HINT_DEFAULT };
    const parsed = JSON.parse(raw) as Partial<FacilityHintSeen>;
    return { ...FACILITY_HINT_DEFAULT, ...parsed };
  } catch {
    return { ...FACILITY_HINT_DEFAULT };
  }
};

const writeFacilityHintSeen = (value: FacilityHintSeen): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FACILITY_HINT_SEEN_KEY, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (private mode, quota) — fail silently
  }
};

const clearFacilityHintSeen = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(FACILITY_HINT_SEEN_KEY);
  } catch {
    // fail silently
  }
};

/** UI-only navigation state — not persisted to save */
interface UiStore extends PanelSlice {
  inventoryMode: 'default' | 'equip';
  equipModeMemberId: string | null;
  /** True once the first-visit drum hint has been dismissed. Persisted to localStorage. */
  questBoardTutorialSeen: boolean;
  /** Per-facility flag: true once the player has clicked that room's iconic object.
   *  Suppresses its first-visit coachmark forever. Persisted to localStorage. */
  facilityHintSeen: FacilityHintSeen;
  /** True once the 3D world has finished its initial WebGPU init + asset load.
   *  Gates tutorial modals so they don't appear (and swallow clicks) during the
   *  5–10s first-load main-thread freeze. Not persisted — re-set per World mount. */
  worldReady: boolean;
  openEquipMode: (memberId: string) => void;
  closeEquipMode: () => void;
  markQuestTutorialSeen: () => void;
  markFacilityHintSeen: (type: FacilityHintType) => void;
  setWorldReady: (ready: boolean) => void;
  resetTutorials: () => void;
}

export const useUiStore = create<UiStore>()((set, get, api) => ({
  ...createPanelSlice(set, get, api),
  inventoryMode: 'default',
  equipModeMemberId: null,
  questBoardTutorialSeen: readTutorialSeen(),
  facilityHintSeen: readFacilityHintSeen(),
  worldReady: false,
  openEquipMode: (memberId) => set({ inventoryMode: 'equip', equipModeMemberId: memberId }),
  closeEquipMode: () => set({ inventoryMode: 'default', equipModeMemberId: null }),
  setWorldReady: (ready) => set({ worldReady: ready }),
  markQuestTutorialSeen: () => {
    writeTutorialSeen(true);
    set({ questBoardTutorialSeen: true });
  },
  markFacilityHintSeen: (type) => {
    if (get().facilityHintSeen[type]) return; // already dismissed — skip write
    const next = { ...get().facilityHintSeen, [type]: true };
    writeFacilityHintSeen(next);
    set({ facilityHintSeen: next });
  },
  resetTutorials: () => {
    writeTutorialSeen(false);
    clearFacilityHintSeen();
    set({ questBoardTutorialSeen: false, facilityHintSeen: { ...FACILITY_HINT_DEFAULT } });
  },
}));

// Dev-only: expose uiStore for E2E test scripts to poll worldReady / other UI state.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { useUiStore: typeof useUiStore }).useUiStore = useUiStore;
}
