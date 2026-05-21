/** Zustand slice for programmatic camera navigation between rooms */

import type { StateCreator } from 'zustand';

export const GUILD_HALL_CAMERA_TARGET: [number, number, number] = [5, 1.5, 3.5];

/** Camera framing modes. 'quest-board' zooms tighter on the drum for the
 *  diegetic quest panel; default uses standard isometric offset. */
export type CameraFocus = 'default' | 'quest-board';

export interface CameraSlice {
  /** World-space target the camera animates toward. Default = guild hall center. */
  cameraTarget: [number, number, number];
  /** True once the camera has finished lerping to cameraTarget. Resets to false on each navigation. */
  cameraSettled: boolean;
  /** Active framing mode — drives the offset chosen by CameraController. */
  cameraFocus: CameraFocus;
  /** R3F → React bridge: drum click sets this; GameScreen opens quest panel and clears it. */
  pendingQuestPanel: boolean;
  setCameraTarget: (target: [number, number, number]) => void;
  setCameraSettled: (settled: boolean) => void;
  resetCameraToGuildHall: () => void;
  setCameraFocus: (focus: CameraFocus) => void;
  requestQuestPanel: () => void;
  clearPendingQuestPanel: () => void;
}

export const createCameraSlice: StateCreator<CameraSlice> = (set) => ({
  cameraTarget: GUILD_HALL_CAMERA_TARGET,
  cameraSettled: true,
  cameraFocus: 'default',
  pendingQuestPanel: false,

  setCameraTarget: (target) => set({ cameraTarget: target, cameraSettled: false }),

  setCameraSettled: (settled) => set({ cameraSettled: settled }),

  resetCameraToGuildHall: () => set({ cameraTarget: GUILD_HALL_CAMERA_TARGET, cameraSettled: false }),

  setCameraFocus: (focus) => set({ cameraFocus: focus, cameraSettled: false }),

  requestQuestPanel: () =>
    set({
      pendingQuestPanel: true,
      cameraFocus: 'quest-board',
      cameraTarget: GUILD_HALL_CAMERA_TARGET,
      cameraSettled: false,
    }),

  clearPendingQuestPanel: () => set({ pendingQuestPanel: false }),
});
