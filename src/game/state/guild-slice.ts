import type { StateCreator } from 'zustand';
import type { GuildHall, GameSettings, TavernState, Member, RoomType, GridCell, GuildRank } from './game-state';
import { ROOM_DEFINITIONS } from '@/game/data/buildings';
import { canPlaceRoom, placeRoom, generateRoomCells, checkCellOverlap, checkAdjacency } from '@/game/systems/building-system';
import { autoPlaceCoreFurniture, upgradeCoreFurniture } from '@/game/systems/furniture-system';
import { GUILD_RANKS, getNextRank } from '@/game/data/ranks';

export interface GuildSlice {
  guildName: string;
  guildLevel: number;
  gold: number;
  guildHall: GuildHall;
  settings: GameSettings;
  tavern: TavernState;
  setGuildName: (name: string) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  upgradeGuild: () => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
  refreshTavern: (mercenaries: Member[]) => void;
  hireMercenary: (memberId: string) => void;
  /** Place a new room: validates cost, creates room with core furniture, spends resources */
  buildRoom: (type: RoomType, cells: GridCell[]) => boolean;
  /** Upgrade a room's core furniture (= room level up), spends resources */
  upgradeRoom: (roomId: string) => boolean;
  /** Invite a mercenary to become an official guild member (cost: level * 100g) */
  inviteMercenary: (memberId: string) => boolean;
  /** Promote a guild member to next rank. Costs gold. Returns success. */
  promoteMember: (memberId: string) => boolean;
}

/** Generate the default guild-hall room with cells and core furniture */
export function createDefaultGuildHall(): GuildHall {
  const cells = generateRoomCells(0, 0, 6, 6);
  const rawRoom = placeRoom('guild-hall', cells);
  const roomWithCore = autoPlaceCoreFurniture({ ...rawRoom, id: 'room-guild-hall' });
  return {
    level: 1,
    rooms: [roomWithCore],
    maxRooms: 3,
  };
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  autoSkillDefault: true,
};

const DEFAULT_TAVERN: TavernState = {
  lastRefreshTime: 0,
  availableMercenaries: [],
};

export const createGuildSlice: StateCreator<GuildSlice> = (set) => ({
  guildName: '',
  guildLevel: 1,
  gold: 100,
  guildHall: createDefaultGuildHall(),
  settings: DEFAULT_SETTINGS,
  tavern: DEFAULT_TAVERN,

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

  refreshTavern: (mercenaries) =>
    set({ tavern: { lastRefreshTime: Date.now(), availableMercenaries: mercenaries } }),

  hireMercenary: (memberId) =>
    set((s) => {
      const merc = s.tavern.availableMercenaries.find((m) => m.id === memberId);
      if (!merc) return {};
      const fullState = s as GuildSlice & { roster: Member[] };
      return {
        tavern: {
          ...s.tavern,
          availableMercenaries: s.tavern.availableMercenaries.filter((m) => m.id !== memberId),
        },
        roster: [...fullState.roster, merc],
      } as unknown as Partial<GuildSlice>;
    }),

  buildRoom: (type, cells) => {
    let success = false;
    set((s) => {
      // Access full store for inventory
      const fullState = s as GuildSlice & { inventory: import('./game-state').InventoryState; consumeItems: (cost: Partial<Record<import('@/game/data/items').ItemID, number>>) => boolean; addGold: (amount: number) => void };
      const validation = canPlaceRoom(s.guildHall, type, s.gold, fullState.inventory);
      if (!validation.success) return s;

      // Cell validation: no overlap + must be adjacent
      if (cells.length === 0) return s;
      if (checkCellOverlap(s.guildHall.rooms, cells)) return s;
      if (!checkAdjacency(s.guildHall.rooms, cells)) return s;

      const def = ROOM_DEFINITIONS.find((r) => r.type === type);
      if (!def) return s;

      // Create room with auto-placed core furniture
      const rawRoom = placeRoom(type, cells);
      const roomWithCore = autoPlaceCoreFurniture(rawRoom);

      // Spend gold
      const newGold = s.gold - def.cost.gold;

      // Consume items (check inside set for atomicity)
      if (def.cost.items) {
        const inv = fullState.inventory;
        for (const [id, needed] of Object.entries(def.cost.items)) {
          if (needed && needed > 0 && ((inv.items as Record<string, number>)[id] ?? 0) < needed) {
            return s; // insufficient items
          }
        }
        // Deduct items
        const newItems = { ...inv.items };
        for (const [id, needed] of Object.entries(def.cost.items)) {
          if (needed && needed > 0) {
            (newItems as Record<string, number>)[id] = ((newItems as Record<string, number>)[id] ?? 0) - needed;
          }
        }
        success = true;
        return {
          gold: newGold,
          inventory: { ...inv, items: newItems },
          guildHall: { ...s.guildHall, rooms: [...s.guildHall.rooms, roomWithCore] },
        } as unknown as Partial<GuildSlice>;
      }

      success = true;
      return {
        gold: newGold,
        guildHall: { ...s.guildHall, rooms: [...s.guildHall.rooms, roomWithCore] },
      };
    });
    return success;
  },

  inviteMercenary: (memberId) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[] };
      const member = fullState.roster.find((m) => m.id === memberId);
      if (!member || member.rank !== 'MERCENARY') return s;

      const cost = member.level * 100;
      if (s.gold < cost) return s;

      success = true;
      return {
        gold: s.gold - cost,
        roster: fullState.roster.map((m) =>
          m.id === memberId ? { ...m, rank: 'RECRUIT' as const } : m
        ),
      } as unknown as Partial<GuildSlice>;
    });
    return success;
  },

  promoteMember: (memberId) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };

      // Find member (could be founder or roster)
      const member = fullState.founder?.id === memberId
        ? fullState.founder
        : fullState.roster.find((m) => m.id === memberId);
      if (!member || member.rank === 'MERCENARY') return s;

      // Block promotion while on-mission or injured
      if (member.status === 'on-mission' || member.status === 'injured') return s;

      const currentRank = member.rank as GuildRank;
      const def = GUILD_RANKS[currentRank];
      if (!def?.promotion) return s; // already max rank

      const req = def.promotion;
      if (member.level < req.minLevel || member.missionsCompleted < req.minMissionsCompleted) return s;
      if (s.gold < req.goldCost) return s;

      const nextRank = getNextRank(currentRank);
      if (!nextRank) return s;

      success = true;
      const promoted = { ...member, rank: nextRank };

      if (fullState.founder?.id === memberId) {
        return { gold: s.gold - req.goldCost, founder: promoted } as unknown as Partial<GuildSlice>;
      }
      return {
        gold: s.gold - req.goldCost,
        roster: fullState.roster.map((m) => m.id === memberId ? promoted : m),
      } as unknown as Partial<GuildSlice>;
    });
    return success;
  },

  upgradeRoom: (roomId) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { inventory: import('./game-state').InventoryState };
      const room = s.guildHall.rooms.find((r) => r.id === roomId);
      if (!room) return s;

      const result = upgradeCoreFurniture(room);
      if (!result) return s; // max level

      const { room: upgradedRoom, cost } = result;

      // Validate gold
      if (s.gold < (cost.gold ?? 0)) return s;

      // Validate items
      if (cost.items) {
        const inv = fullState.inventory;
        for (const [id, needed] of Object.entries(cost.items)) {
          if (needed && needed > 0 && ((inv.items as Record<string, number>)[id] ?? 0) < needed) {
            return s;
          }
        }
        // Deduct items
        const newItems = { ...inv.items };
        for (const [id, needed] of Object.entries(cost.items)) {
          if (needed && needed > 0) {
            (newItems as Record<string, number>)[id] = ((newItems as Record<string, number>)[id] ?? 0) - needed;
          }
        }
        success = true;
        return {
          gold: s.gold - (cost.gold ?? 0),
          inventory: { ...inv, items: newItems },
          guildHall: {
            ...s.guildHall,
            rooms: s.guildHall.rooms.map((r) => r.id === roomId ? upgradedRoom : r),
          },
        } as unknown as Partial<GuildSlice>;
      }

      success = true;
      return {
        gold: s.gold - (cost.gold ?? 0),
        guildHall: {
          ...s.guildHall,
          rooms: s.guildHall.rooms.map((r) => r.id === roomId ? upgradedRoom : r),
        },
      };
    });
    return success;
  },
});
