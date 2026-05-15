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

export type CombatPanelPhase = 'formation' | 'battle' | 'result';

interface CombatPanelStore {
  isOpen: boolean;
  phase: CombatPanelPhase | null;
  missionId: string | null;
  resultData: MissionResult | null;

  /** Called by arrival modal — opens panel in formation phase */
  openCombatPanel: (missionId: string) => void;
  setPhase: (phase: CombatPanelPhase) => void;
  setResult: (result: MissionResult) => void;
  closeCombatPanel: () => void;
}

export const useCombatPanelStore = create<CombatPanelStore>()((set) => ({
  isOpen: false,
  phase: null,
  missionId: null,
  resultData: null,

  openCombatPanel: (missionId) =>
    set({ isOpen: true, phase: 'formation', missionId, resultData: null }),

  setPhase: (phase) => set({ phase }),

  setResult: (result) => set({ phase: 'result', resultData: result }),

  closeCombatPanel: () =>
    set({ isOpen: false, phase: null, missionId: null, resultData: null }),
}));
