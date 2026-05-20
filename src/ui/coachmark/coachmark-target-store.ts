/**
 * Coachmark target store — bridges the in-Canvas world projector to the DOM overlay.
 *
 * Pattern mirrors combat-projection-store.ts:
 *   R3F projector (in Canvas) writes screen coords → zustand → DOM coachmark reads
 *
 * Flow:
 *   <TutorialCoachmark> sets worldTarget when targetType === 'world'
 *   <CoachmarkWorldProjector> reads worldTarget each frame, writes screen coords back
 *   <TutorialCoachmark> reads screen to position its overlay children
 */

import { create } from 'zustand';

/** Screen-space position in CSS pixels, mirroring combat-projection-store.ScreenPos */
export interface ScreenPos {
  x: number;     // CSS pixels from viewport left
  y: number;     // CSS pixels from viewport top
  visible: boolean;
}

interface CoachmarkTargetStore {
  /**
   * World-space target set by the DOM coachmark component (null = no active world coachmark).
   *
   * INVARIANT: only ONE world coachmark may be active at a time. Mounting a second
   * <TutorialCoachmark targetType="world"> will clobber this value. If Phase 06 ever
   * needs simultaneous world coachmarks, key by step-id instead of using a single slot.
   */
  worldTarget: [number, number, number] | null;
  /** Screen-space result written back by the in-Canvas projector */
  screen: ScreenPos | null;

  setWorldTarget: (pos: [number, number, number] | null) => void;
  setScreen: (pos: ScreenPos | null) => void;
}

export const useCoachmarkTargetStore = create<CoachmarkTargetStore>()((set) => ({
  worldTarget: null,
  screen: null,

  setWorldTarget: (pos) => set({ worldTarget: pos }),
  setScreen: (pos) => set({ screen: pos }),
}));
