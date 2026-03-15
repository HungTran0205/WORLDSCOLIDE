/**
 * SaveManager — orchestrates save/load/export/import with multi-slot storage.
 * Uses IndexedDB via save-storage, validates via save-validation,
 * reports status via Zustand save-status slice.
 */

import { saveSlot, loadSlot } from './save-storage';
import { extractGameSaveData, createSaveEnvelope } from './save-types';
import type { SaveEnvelope } from './save-types';
import { migrateSave } from './save-migrations';
import { validateAndMigrate, type ValidationResult } from './save-validation';
import { useGameStore } from '@/game/state/store';

const AUTO_SAVE_INTERVAL = 60_000;
const SAVE_DEBOUNCE_MS = 5_000;

export class SaveManager {
  private activeSlotId: number | null = null;
  private autoSaveTimer: number | null = null;
  private lastSaveTime = 0;
  private visibilityHandler: (() => void) | null = null;
  /** Metadata from last load — used for play time tracking */
  private lastMeta: import('./save-types').SaveSlotMetadata | undefined;

  setActiveSlot(slotId: number): void {
    this.activeSlotId = slotId;
  }

  getActiveSlot(): number | null {
    return this.activeSlotId;
  }

  /** Save current store state to active slot. Pass force=true for manual saves to bypass debounce. */
  async save(getState: () => Record<string, unknown>, force = false): Promise<void> {
    if (!this.activeSlotId) return;

    // Debounce (skip for manual/forced saves)
    const now = Date.now();
    if (!force && now - this.lastSaveTime < SAVE_DEBOUNCE_MS) return;

    const { setSaveStatus } = useGameStore.getState();
    setSaveStatus('saving');

    try {
      const gameData = extractGameSaveData(getState());
      const envelope = createSaveEnvelope(this.activeSlotId, gameData, this.lastMeta);
      await saveSlot(this.activeSlotId, envelope);
      this.lastMeta = envelope.metadata;
      this.lastSaveTime = Date.now();
      setSaveStatus('saved');
    } catch (e) {
      setSaveStatus('error', (e as Error).message);
    }
  }

  /** Load and migrate envelope from a slot */
  async load(slotId: number): Promise<SaveEnvelope | null> {
    const envelope = await loadSlot(slotId);
    if (!envelope) return null;
    try {
      const migrated = migrateSave(envelope);
      this.lastMeta = migrated.metadata;
      return migrated;
    } catch {
      return null;
    }
  }

  /** Export a slot's save as downloadable JSON */
  async exportToFile(slotId: number): Promise<void> {
    const envelope = await loadSlot(slotId);
    if (!envelope) return;
    const json = JSON.stringify(envelope, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worldcolide-slot${slotId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Validate and parse an imported file (max 5MB) */
  async importFromFile(file: File): Promise<ValidationResult> {
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, errors: ['File too large (max 5MB)'] };
    }
    const text = await file.text();
    return validateAndMigrate(text);
  }

  /** Start auto-save timer + visibility change listener */
  startAutoSave(getState: () => Record<string, unknown>): void {
    this.stopAutoSave();
    this.autoSaveTimer = window.setInterval(() => {
      this.save(getState);
    }, AUTO_SAVE_INTERVAL);

    this.visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.save(getState);
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  /** Stop auto-save timer and visibility listener */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
}

export const saveManager = new SaveManager();
