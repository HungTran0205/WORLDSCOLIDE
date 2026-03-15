import type { StateCreator } from 'zustand';
import type { GuildHall, GameSettings } from './game-state';

export interface GuildSlice {
  guildName: string;
  guildLevel: number;
  gold: number;
  guildHall: GuildHall;
  settings: GameSettings;
  setGuildName: (name: string) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  upgradeGuild: () => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
}

const DEFAULT_GUILD_HALL: GuildHall = {
  level: 1,
  rooms: [
    { id: 'room-quest-board', type: 'quest-board', level: 1, position: { x: 0, z: 0 }, rotation: 0 },
  ],
  maxRooms: 3,
};

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  autoSkillDefault: true,
};

export const createGuildSlice: StateCreator<GuildSlice> = (set) => ({
  guildName: '',
  guildLevel: 1,
  gold: 100,
  guildHall: DEFAULT_GUILD_HALL,
  settings: DEFAULT_SETTINGS,

  setGuildName: (name) => set({ guildName: name }),

  addGold: (amount) => set((s) => ({ gold: s.gold + amount })),

  spendGold: (amount) => {
    let success = false;
    set((s) => {
      if (s.gold >= amount) {
        success = true;
        return { gold: s.gold - amount };
      }
      return s;
    });
    return success;
  },

  upgradeGuild: () =>
    set((s) => ({
      guildLevel: s.guildLevel + 1,
      guildHall: { ...s.guildHall, maxRooms: s.guildHall.maxRooms + 1 },
    })),

  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
});
