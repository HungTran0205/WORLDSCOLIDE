import type { StateCreator } from 'zustand';
import type { RoomType, Rotation } from './game-state';

/** Active item being placed or moved in build mode */
export interface ActiveBuildItem {
  /** 'new' = purchasing new room, 'existing' = moving an already-placed room */
  type: 'new' | 'existing';
  /** Room type being placed/moved */
  roomType: RoomType;
  /** Current rotation for placement preview */
  rotation: Rotation;
  /** ID of room being moved (only for 'existing') */
  roomId?: string;
  /** Original position saved for cancel (only for 'existing') */
  originalPosition?: { x: number; z: number };
  /** Original rotation saved for cancel (only for 'existing') */
  originalRotation?: Rotation;
}

export interface BuildModeSlice {
  /** Whether build mode is active (grid visible, members hidden) */
  isBuildMode: boolean;
  /** Room type currently being placed, null = not placing */
  activeBuildType: RoomType | null;
  /** Current rotation for placement preview */
  buildRotation: Rotation;
  /** Active build item with move metadata */
  activeItem: ActiveBuildItem | null;

  /** Toggle build mode on/off */
  toggleBuildMode: (on: boolean) => void;
  /** Enter build placement mode for a new room type */
  startPlacement: (type: RoomType) => void;
  /** Pick up an existing room to move it */
  startMovingRoom: (roomId: string, roomType: RoomType, position: { x: number; z: number }, rotation: Rotation) => void;
  /** Rotate placement preview by 90 degrees */
  rotatePlacement: () => void;
  /** Cancel placement or move (restores original position for moves) */
  cancelPlacement: () => void;
}

const ROTATION_CYCLE: Rotation[] = [0, 90, 180, 270];

export const createBuildModeSlice: StateCreator<BuildModeSlice> = (set) => ({
  isBuildMode: false,
  activeBuildType: null,
  buildRotation: 0,
  activeItem: null,

  toggleBuildMode: (on) =>
    set({
      isBuildMode: on,
      activeBuildType: null,
      buildRotation: 0,
      activeItem: null,
    }),

  startPlacement: (type) =>
    set({
      isBuildMode: true,
      activeBuildType: type,
      buildRotation: 0,
      activeItem: { type: 'new', roomType: type, rotation: 0 },
    }),

  startMovingRoom: (roomId, roomType, position, rotation) =>
    set({
      isBuildMode: true,
      activeBuildType: roomType,
      buildRotation: rotation,
      activeItem: {
        type: 'existing',
        roomType,
        rotation,
        roomId,
        originalPosition: { ...position },
        originalRotation: rotation,
      },
    }),

  rotatePlacement: () =>
    set((s) => {
      const idx = ROTATION_CYCLE.indexOf(s.buildRotation);
      const nextRotation = ROTATION_CYCLE[(idx + 1) % 4];
      return {
        buildRotation: nextRotation,
        activeItem: s.activeItem ? { ...s.activeItem, rotation: nextRotation } : null,
      };
    }),

  cancelPlacement: () =>
    set({ activeBuildType: null, buildRotation: 0, activeItem: null }),
});
