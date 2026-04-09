/** Zustand slice for programmatic camera navigation between rooms */

import type { StateCreator } from 'zustand';

export const GUILD_HALL_CAMERA_TARGET: [number, number, number] = [5, 0, 3.5];

export interface CameraSlice {
  /** World-space target the camera animates toward. Default = guild hall center. */
  cameraTarget: [number, number, number];
  setCameraTarget: (target: [number, number, number]) => void;
  resetCameraToGuildHall: () => void;
}

export const createCameraSlice: StateCreator<CameraSlice> = (set) => ({
  cameraTarget: GUILD_HALL_CAMERA_TARGET,

  setCameraTarget: (target) => set({ cameraTarget: target }),

  resetCameraToGuildHall: () => set({ cameraTarget: GUILD_HALL_CAMERA_TARGET }),
});
