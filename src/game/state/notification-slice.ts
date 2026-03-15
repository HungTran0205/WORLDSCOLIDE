/**
 * Notification slice — stores recent mission events for toast display.
 * Ephemeral: excluded from save serialization.
 */

import type { StateCreator } from 'zustand';
import type { MissionResult } from '@/game/systems/mission-resolver';

export interface MissionNotification {
  id: string;
  /** null for arrival notifications; set for combat-complete notifications */
  result: MissionResult | null;
  missionName: string;
  timestamp: number;
  dismissed: boolean;
  notificationType: 'arrival' | 'completion';
}

export interface NotificationSlice {
  notifications: MissionNotification[];
  addNotification: (n: MissionNotification) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const MAX_NOTIFICATIONS = 10;

export const createNotificationSlice: StateCreator<NotificationSlice> = (set) => ({
  notifications: [],
  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications.filter((x) => !x.dismissed)].slice(0, MAX_NOTIFICATIONS),
    })),
  dismissNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, dismissed: true } : n,
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
});
