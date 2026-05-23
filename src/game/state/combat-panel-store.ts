/**
 * Combat panel UI store — ephemeral state for the idle combat panel overlay.
 * Does NOT persist to IndexedDB. Lives outside the main game store so panel
 * lifecycle (open/close, phase) is decoupled from save state.
 *
 * The actual combat formation + entities are still owned by combat-arena-slice
 * during Phase 3 (legacy bridge); panel store just orchestrates which sub-phase
 * (formation / battle / result) is visible.
 */

import { create } from 'zustand';
import type { MissionResult } from '@/game/systems/mission-resolver';
import type { DialogLine } from '@/game/state/game-state';

export type CombatPanelPhase = 'formation' | 'battle' | 'story-dialog' | 'result';

interface CombatPanelStore {
  isOpen: boolean;
  phase: CombatPanelPhase | null;
  /** Template id (MISSIONS lookup, tutorial check, map select) — may be shared. */
  missionId: string | null;
  /** Unique active-mission instance id — identifies WHICH party is fighting. */
  instanceId: string | null;
  resultData: MissionResult | null;
  /** Post-combat dialog lines shown during the 'story-dialog' phase. */
  dialogLines: DialogLine[] | null;
  /** Result held back while the post-combat dialog plays; revealed on confirm. */
  pendingResult: MissionResult | null;

  /** Called by arrival modal — opens panel in formation phase */
  openCombatPanel: (missionId: string, instanceId: string) => void;
  setPhase: (phase: CombatPanelPhase) => void;
  setResult: (result: MissionResult) => void;
  /** Enter the post-combat dialog phase, holding `result` until confirmed. */
  showStoryDialog: (lines: DialogLine[], result: MissionResult) => void;
  /** Dismiss the post-combat dialog → reveal the held result. */
  confirmStoryDialog: () => void;
  closeCombatPanel: () => void;
}

export const useCombatPanelStore = create<CombatPanelStore>()((set) => ({
  isOpen: false,
  phase: null,
  missionId: null,
  instanceId: null,
  resultData: null,
  dialogLines: null,
  pendingResult: null,

  openCombatPanel: (missionId, instanceId) =>
    set({ isOpen: true, phase: 'formation', missionId, instanceId, resultData: null, dialogLines: null, pendingResult: null }),

  setPhase: (phase) => set({ phase }),

  setResult: (result) => set({ phase: 'result', resultData: result }),

  showStoryDialog: (lines, result) =>
    set({ phase: 'story-dialog', dialogLines: lines, pendingResult: result }),

  confirmStoryDialog: () =>
    set((s) => ({ phase: 'result', resultData: s.pendingResult, dialogLines: null, pendingResult: null })),

  closeCombatPanel: () =>
    set({ isOpen: false, phase: null, missionId: null, instanceId: null, resultData: null, dialogLines: null, pendingResult: null }),
}));
