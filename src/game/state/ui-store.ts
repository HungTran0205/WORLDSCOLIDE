import { create } from 'zustand';

/** UI-only navigation state — not persisted to save */
interface UiStore {
  inventoryMode: 'default' | 'equip';
  equipModeMemberId: string | null;
  openEquipMode: (memberId: string) => void;
  closeEquipMode: () => void;
}

export const useUiStore = create<UiStore>()((set) => ({
  inventoryMode: 'default',
  equipModeMemberId: null,
  openEquipMode: (memberId) => set({ inventoryMode: 'equip', equipModeMemberId: memberId }),
  closeEquipMode: () => set({ inventoryMode: 'default', equipModeMemberId: null }),
}));
