import { create } from 'zustand';

const TUTORIAL_SEEN_KEY = 'questBoardTutorialSeen';

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

/** UI-only navigation state — not persisted to save */
interface UiStore {
  inventoryMode: 'default' | 'equip';
  equipModeMemberId: string | null;
  /** True once the first-visit drum hint has been dismissed. Persisted to localStorage. */
  questBoardTutorialSeen: boolean;
  openEquipMode: (memberId: string) => void;
  closeEquipMode: () => void;
  markQuestTutorialSeen: () => void;
  resetTutorials: () => void;
}

export const useUiStore = create<UiStore>()((set) => ({
  inventoryMode: 'default',
  equipModeMemberId: null,
  questBoardTutorialSeen: readTutorialSeen(),
  openEquipMode: (memberId) => set({ inventoryMode: 'equip', equipModeMemberId: memberId }),
  closeEquipMode: () => set({ inventoryMode: 'default', equipModeMemberId: null }),
  markQuestTutorialSeen: () => {
    writeTutorialSeen(true);
    set({ questBoardTutorialSeen: true });
  },
  resetTutorials: () => {
    writeTutorialSeen(false);
    set({ questBoardTutorialSeen: false });
  },
}));
