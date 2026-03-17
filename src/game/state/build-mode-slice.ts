import type { StateCreator } from 'zustand';
import type { RoomType, Rotation, FurnitureType, GridCell } from './game-state';

/** 3 build modes: new-room | new-furniture | move-room */
export type BuildItemType = 'new-room' | 'new-furniture' | 'move-room';

/** Active item being placed or moved in build mode */
export interface ActiveBuildItem {
  type: BuildItemType;
  roomType?: RoomType;
  furnitureType?: FurnitureType;
  targetRoomId?: string;
  rotation: Rotation;
  /** ID of room being moved (only for move-room) */
  roomId?: string;
  /** Original cells saved for cancel (only for move-room) */
  originalCells?: GridCell[];
}

export interface BuildModeSlice {
  /** Whether build mode is active (grid visible, members hidden) */
  isBuildMode: boolean;
  /** Active build item with placement metadata */
  activeItem: ActiveBuildItem | null;

  toggleBuildMode: (on: boolean) => void;
  startPlacement: (type: RoomType) => void;
  startMovingRoom: (roomId: string, roomType: RoomType, cells: GridCell[]) => void;
  startFurniturePlacement: (furnitureType: FurnitureType, targetRoomId: string) => void;
  rotatePlacement: () => void;
  cancelPlacement: () => void;
}

const ROTATION_CYCLE: Rotation[] = [0, 90, 180, 270];

export const createBuildModeSlice: StateCreator<BuildModeSlice> = (set) => ({
  isBuildMode: false,
  activeItem: null,

  toggleBuildMode: (on) =>
    set({ isBuildMode: on, activeItem: null }),

  startPlacement: (type) =>
    set({
      isBuildMode: true,
      activeItem: { type: 'new-room', roomType: type, rotation: 0 },
    }),

  startMovingRoom: (roomId, roomType, cells) =>
    set({
      isBuildMode: true,
      activeItem: {
        type: 'move-room',
        roomType,
        rotation: 0,
        roomId,
        originalCells: cells.map((c) => ({ ...c })),
      },
    }),

  startFurniturePlacement: (furnitureType, targetRoomId) =>
    set({
      isBuildMode: true,
      activeItem: { type: 'new-furniture', furnitureType, targetRoomId, rotation: 0 },
    }),

  rotatePlacement: () =>
    set((s) => {
      if (!s.activeItem) return s;
      const idx = ROTATION_CYCLE.indexOf(s.activeItem.rotation);
      const nextRotation = ROTATION_CYCLE[(idx + 1) % 4];
      return { activeItem: { ...s.activeItem, rotation: nextRotation } };
    }),

  cancelPlacement: () =>
    set({ activeItem: null }),
});
