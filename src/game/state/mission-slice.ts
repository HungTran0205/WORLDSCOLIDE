import type { StateCreator } from 'zustand';
import type { ActiveMission, MissionPhase, TutorialStep } from './game-state';
import type { MissionResult } from '@/game/systems/mission-resolver';
import type { CombatResult } from '@/game/systems/combat-types';

export interface MissionSlice {
  activeMissions: ActiveMission[];
  completedMissions: string[];
  tutorialStep: TutorialStep;
  /** Ephemeral queue of mission results for display — excluded from save */
  pendingResults: MissionResult[];
  /** Combat replay selected for manual viewing in combat-view */
  currentCombatReplay: CombatResult | null;

  dispatchMission: (mission: ActiveMission) => void;
  completeMission: (missionId: string) => void;
  failMission: (missionId: string) => void;
  setTutorialStep: (step: TutorialStep) => void;
  updateMissionPhase: (missionId: string, phase: MissionPhase, arrivalTime?: number) => void;
  setCombatMode: (missionId: string, mode: 'auto' | 'manual') => void;
  pushMissionResult: (result: MissionResult) => void;
  setCurrentCombatReplay: (replay: CombatResult | null) => void;
  dismissResult: () => void;
}

export const createMissionSlice: StateCreator<MissionSlice> = (set) => ({
  activeMissions: [],
  completedMissions: [],
  tutorialStep: 'char-creation',
  pendingResults: [],
  currentCombatReplay: null,

  dispatchMission: (mission) =>
    set((s) => ({ activeMissions: [...s.activeMissions, mission] })),

  completeMission: (missionId) =>
    set((s) => ({
      activeMissions: s.activeMissions.filter((m) => m.missionId !== missionId),
      completedMissions: [...s.completedMissions, missionId],
    })),

  failMission: (missionId) =>
    set((s) => ({
      activeMissions: s.activeMissions.filter((m) => m.missionId !== missionId),
    })),

  setTutorialStep: (step) => set({ tutorialStep: step }),

  updateMissionPhase: (missionId, phase, arrivalTime) =>
    set((s) => ({
      activeMissions: s.activeMissions.map((m) =>
        m.missionId === missionId
          ? { ...m, phase, ...(arrivalTime !== undefined ? { arrivalTime } : {}) }
          : m,
      ),
    })),

  setCombatMode: (missionId, mode) =>
    set((s) => ({
      activeMissions: s.activeMissions.map((m) =>
        m.missionId === missionId ? { ...m, combatMode: mode } : m,
      ),
    })),

  pushMissionResult: (result) =>
    set((s) => ({ pendingResults: [...s.pendingResults, result] })),

  setCurrentCombatReplay: (replay) => set({ currentCombatReplay: replay }),

  dismissResult: () =>
    set((s) => ({
      pendingResults: s.pendingResults.slice(1),
      currentCombatReplay: null,
    })),

});
