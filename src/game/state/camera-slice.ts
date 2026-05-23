/** Zustand slice for programmatic camera navigation between rooms */

import type { StateCreator } from 'zustand';
import type { FacilityType } from './game-state';
import { GUILD_HALL_GRID_WIDTH, GUILD_HALL_GRID_DEPTH } from './guild-hall-grid';

/** Room center, derived from the floor grid so it stays aligned on resize. */
export const GUILD_HALL_CAMERA_TARGET: [number, number, number] = [
  GUILD_HALL_GRID_WIDTH / 2,
  1.5,
  GUILD_HALL_GRID_DEPTH / 2,
];

/** Camera framing modes. 'quest-board' zooms tighter on the drum for the
 *  diegetic quest panel; 'facility-focus' frames a room's iconic object when
 *  its function panel is open; default uses standard isometric offset. */
export type CameraFocus = 'default' | 'quest-board' | 'facility-focus';

export interface CameraSlice {
  /** World-space target the camera animates toward. Default = guild hall center. */
  cameraTarget: [number, number, number];
  /** True once the camera has finished lerping to cameraTarget. Resets to false on each navigation. */
  cameraSettled: boolean;
  /** Active framing mode — drives the offset chosen by CameraController. */
  cameraFocus: CameraFocus;
  /** R3F → React bridge: drum click sets this; GameScreen opens quest panel and clears it. */
  pendingQuestPanel: boolean;
  /** R3F → React bridge: clicking a room's iconic object sets this to the facility
   *  type whose function panel should open. GameScreen consumes + clears it. */
  pendingFacilityFunctionPanel: FacilityType | null;
  /** World position of the object the camera is framing while in facility-focus.
   *  Stays inside the room footprint so the proximity finder resolves the instance. */
  facilityFocusTarget: [number, number, number] | null;
  setCameraTarget: (target: [number, number, number]) => void;
  setCameraSettled: (settled: boolean) => void;
  resetCameraToGuildHall: () => void;
  setCameraFocus: (focus: CameraFocus) => void;
  requestQuestPanel: () => void;
  clearPendingQuestPanel: () => void;
  requestFacilityPanel: (type: FacilityType, focusPos: [number, number, number]) => void;
  clearPendingFacilityFunctionPanel: () => void;
}

export const createCameraSlice: StateCreator<CameraSlice> = (set) => ({
  cameraTarget: GUILD_HALL_CAMERA_TARGET,
  cameraSettled: true,
  cameraFocus: 'default',
  pendingQuestPanel: false,
  pendingFacilityFunctionPanel: null,
  facilityFocusTarget: null,

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

  requestFacilityPanel: (type, focusPos) =>
    set({
      pendingFacilityFunctionPanel: type,
      cameraFocus: 'facility-focus',
      cameraTarget: focusPos,
      facilityFocusTarget: focusPos,
      cameraSettled: false,
    }),

  clearPendingFacilityFunctionPanel: () => set({ pendingFacilityFunctionPanel: null }),
});
