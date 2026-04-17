/** Zustand slice for programmatic camera navigation between rooms */

import type { StateCreator } from 'zustand';

export const GUILD_HALL_CAMERA_TARGET: [number, number, number] = [5, 0, 3.5];

export interface CameraSlice {
  /** World-space target the camera animates toward. Default = guild hall center. */
  cameraTarget: [number, number, number];
  /** True once the camera has finished lerping to cameraTarget. Resets to false on each navigation. */
  cameraSettled: boolean;
  setCameraTarget: (target: [number, number, number]) => void;
  setCameraSettled: (settled: boolean) => void;
  resetCameraToGuildHall: () => void;
}

export const createCameraSlice: StateCreator<CameraSlice> = (set) => ({
  cameraTarget: GUILD_HALL_CAMERA_TARGET,
  cameraSettled: true,

  setCameraTarget: (target) => set({ cameraTarget: target, cameraSettled: false }),

  setCameraSettled: (settled) => set({ cameraSettled: settled }),

  resetCameraToGuildHall: () => set({ cameraTarget: GUILD_HALL_CAMERA_TARGET, cameraSettled: false }),
});
