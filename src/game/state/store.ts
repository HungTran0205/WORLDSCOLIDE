import { create } from 'zustand';
import { createClockSlice, type ClockSlice } from './clock-slice';
import { createGuildSlice, createDefaultFloor, type GuildSlice } from './guild-slice';
import { createRosterSlice, type RosterSlice } from './roster-slice';
import { createMissionSlice, type MissionSlice } from './mission-slice';
import { createSaveStatusSlice, type SaveStatusSlice } from './save-status-slice';
import { createNotificationSlice, type NotificationSlice } from './notification-slice';
import { createBuildModeSlice, type BuildModeSlice } from './build-mode-slice';
import { createInventorySlice, type InventorySlice } from './inventory-slice';
import { createCombatArenaSlice, type CombatArenaSlice } from './combat-arena-slice';
import { createFacilityZoneSlice, type FacilityZoneSlice } from './facility-zone-slice';
import { createCameraSlice, type CameraSlice } from './camera-slice';

export type GameStore = ClockSlice & GuildSlice & RosterSlice & MissionSlice & SaveStatusSlice & NotificationSlice & BuildModeSlice & InventorySlice & CombatArenaSlice & FacilityZoneSlice & CameraSlice;

export const useGameStore = create<GameStore>()((...a) => ({
  ...createClockSlice(...a),
  ...createGuildSlice(...a),
  ...createRosterSlice(...a),
  ...createMissionSlice(...a),
  ...createSaveStatusSlice(...a),
  ...createNotificationSlice(...a),
  ...createBuildModeSlice(...a),
  ...createInventorySlice(...a),
  ...createCombatArenaSlice(...a),
  ...createFacilityZoneSlice(...a),
  ...createCameraSlice(...a),
}));

/** Reset all game data to fresh-game defaults (preserves action functions) */
export function resetGameState(): void {
  useGameStore.setState({
    gameTime: 0,
    realTimeLastTick: Date.now(),
    guildName: '',
    guildLevel: 1,
    gold: 100,
    guildHall: createDefaultFloor(),
    settings: { musicVolume: 0.5, sfxVolume: 0.7, autoSkillDefault: true, graphicsQuality: 'high' },
    tavern: { lastRefreshTime: 0, availableMercenaries: [] },
    facilities: [
      { type: 'tavern' as const,        level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
      { type: 'training-yard' as const, level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
      { type: 'infirmary' as const,     level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
      { type: 'workshop' as const,      level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
      { type: 'logging-site' as const,  level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
      { type: 'stone-quarry' as const,  level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
    ],
    offlineFacilityReport: null,
    offlineElapsedHours: 0,
    founder: null,
    roster: [],
    activeMissions: [],
    completedMissions: [],
    tutorialStep: 'char-creation' as const,
    pendingResults: [],
    currentCombatReplay: null,
    inventory: { items: {} },
    // Combat arena defaults
    gameScene: 'guild-hall' as const,
    arenaPhase: 'idle' as const,
    arenaMissionId: null,
    formation: [null, null, null, null, null, null],
    arenaEntities: [],
    arenaTime: 0,
    speedMultiplier: 1,
    recentEvents: [],
    arenaResult: null,
    pendingFacilityPanel: null,
    focusFacilityType: null,
    cameraTarget: [5, 0, 3.5] as [number, number, number],
  });
}
