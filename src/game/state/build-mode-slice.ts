import type { StateCreator } from 'zustand';
import type { Rotation, FurnitureType } from './game-state';

/** 3 build modes: floor-tile | erase-tile | furniture */
export type BuildItemType = 'floor-tile' | 'erase-tile' | 'furniture';

/** Active item being placed in build mode */
export interface ActiveBuildItem {
  type: BuildItemType;
  furnitureType?: FurnitureType;
  rotation: Rotation;
  /** Hex color for floor-tile paint mode */
  selectedColor: string;
}

export interface BuildModeSlice {
  /** Whether build mode is active (grid visible, members hidden) */
  isBuildMode: boolean;
  /** Active build item with placement metadata */
  activeItem: ActiveBuildItem | null;

  toggleBuildMode: (on: boolean) => void;
  startFloorPaint: (color: string) => void;
  startFloorErase: () => void;
  startFurniturePlacement: (furnitureType: FurnitureType) => void;
  rotatePlacement: () => void;
  cancelPlacement: () => void;
}

const ROTATION_CYCLE: Rotation[] = [0, 90, 180, 270];

export const createBuildModeSlice: StateCreator<BuildModeSlice> = (set) => ({
  isBuildMode: false,
  activeItem: null,

  toggleBuildMode: (on) =>
    set({ isBuildMode: on, activeItem: null }),

  startFloorPaint: (color) =>
    set({
      isBuildMode: true,
      activeItem: { type: 'floor-tile', rotation: 0, selectedColor: color },
    }),

  startFloorErase: () =>
    set({
      isBuildMode: true,
      activeItem: { type: 'erase-tile', rotation: 0, selectedColor: '' },
    }),

  startFurniturePlacement: (furnitureType) =>
    set({
      isBuildMode: true,
      activeItem: { type: 'furniture', furnitureType, rotation: 0, selectedColor: '' },
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
