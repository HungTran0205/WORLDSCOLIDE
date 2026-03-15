/**
 * Zustand slice for save operation status — drives HUD badge.
 * States: idle (hidden), saving (spinner), saved (brief checkmark), error (persistent).
 */

import type { StateCreator } from 'zustand';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveStatusSlice {
  saveStatus: SaveStatus;
  saveError: string | null;
  setSaveStatus: (status: SaveStatus, error?: string) => void;
}

export const createSaveStatusSlice: StateCreator<SaveStatusSlice> = (set) => ({
  saveStatus: 'idle',
  saveError: null,
  setSaveStatus: (status, error) =>
    set({ saveStatus: status, saveError: error ?? null }),
});
