import { create } from 'zustand';
import { createClockSlice, type ClockSlice } from './clock-slice';
import { createGuildSlice, type GuildSlice } from './guild-slice';
import { createRosterSlice, type RosterSlice } from './roster-slice';
import { createMissionSlice, type MissionSlice } from './mission-slice';
import { createSaveStatusSlice, type SaveStatusSlice } from './save-status-slice';
import { createNotificationSlice, type NotificationSlice } from './notification-slice';
import { createBuildModeSlice, type BuildModeSlice } from './build-mode-slice';
import { createInventorySlice, type InventorySlice } from './inventory-slice';

export type GameStore = ClockSlice & GuildSlice & RosterSlice & MissionSlice & SaveStatusSlice & NotificationSlice & BuildModeSlice & InventorySlice;

export const useGameStore = create<GameStore>()((...a) => ({
  ...createClockSlice(...a),
  ...createGuildSlice(...a),
  ...createRosterSlice(...a),
  ...createMissionSlice(...a),
  ...createSaveStatusSlice(...a),
  ...createNotificationSlice(...a),
  ...createBuildModeSlice(...a),
  ...createInventorySlice(...a),
}));
