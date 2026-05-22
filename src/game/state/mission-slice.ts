import type { StateCreator } from 'zustand';
import type { ActiveMission, MissionPhase, TutorialStep } from './game-state';
import type { MissionResult } from '@/game/systems/mission-resolver';
import type { CombatResult, CombatEntity } from '@/game/systems/combat-types';
import type { TargetPriority } from '@/game/systems/combat-arena-types';

export interface MissionSlice {
  activeMissions: ActiveMission[];
  completedMissions: string[];
  tutorialStep: TutorialStep;
  /** Ephemeral queue of mission results for display — excluded from save */
  pendingResults: MissionResult[];
  /** Combat replay selected for manual viewing in combat-view */
  currentCombatReplay: CombatResult | null;

  dispatchMission: (mission: ActiveMission) => void;
  /** Identity ops below take the unique `instanceId` (NOT the template missionId)
   *  so two parties running the same quest template resolve independently. */
  completeMission: (instanceId: string) => void;
  failMission: (instanceId: string) => void;
  setTutorialStep: (step: TutorialStep) => void;
  updateMissionPhase: (instanceId: string, phase: MissionPhase, arrivalTime?: number) => void;
  setTargetPriority: (instanceId: string, priority: TargetPriority) => void;
  /** Autosave the live engine entity list onto an active mission (D12).
   *  Pass `null` to clear (combat finished or mission removed). */
  saveCombatSnapshot: (instanceId: string, snapshot: CombatEntity[] | null, snapshotTime: number) => void;
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

  completeMission: (instanceId) =>
    set((s) => {
      // Record the TEMPLATE id (not instanceId) in completedMissions so quest
      // prerequisite/tutorial checks keep working; remove only THIS instance.
      const done = s.activeMissions.find((m) => m.instanceId === instanceId);
      return {
        activeMissions: s.activeMissions.filter((m) => m.instanceId !== instanceId),
        completedMissions: done
          ? [...s.completedMissions, done.missionId]
          : s.completedMissions,
      };
    }),

  failMission: (instanceId) =>
    set((s) => ({
      activeMissions: s.activeMissions.filter((m) => m.instanceId !== instanceId),
    })),

  setTutorialStep: (step) => set({ tutorialStep: step }),

  updateMissionPhase: (instanceId, phase, arrivalTime) =>
    set((s) => ({
      activeMissions: s.activeMissions.map((m) =>
        m.instanceId === instanceId
          ? { ...m, phase, ...(arrivalTime !== undefined ? { arrivalTime } : {}) }
          : m,
      ),
    })),

  setTargetPriority: (instanceId, priority) =>
    set((s) => ({
      activeMissions: s.activeMissions.map((m) =>
        m.instanceId === instanceId ? { ...m, targetPriority: priority } : m,
      ),
    })),

  saveCombatSnapshot: (instanceId, snapshot, snapshotTime) =>
    set((s) => ({
      activeMissions: s.activeMissions.map((m) => {
        if (m.instanceId !== instanceId) return m;
        if (snapshot === null) {
          // Clear snapshot — mid-fight resume should fall through to normal resolver.
          const { combatSnapshot: _drop, combatSnapshotTime: _dropT, ...rest } = m;
          return rest;
        }
        return { ...m, combatSnapshot: snapshot, combatSnapshotTime: snapshotTime };
      }),
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
