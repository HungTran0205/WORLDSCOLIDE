import type { StateCreator } from 'zustand';
import type { GuildHall, GameSettings, TavernState, Member, FloorTile, PlacedFurniture, GridCell, Rotation, FurnitureType, GuildRank } from './game-state';
import type { InventoryState } from './game-state';
import { FLOOR_TILE_COST } from '@/game/data/buildings';
import { getFurnitureDefinition } from '@/game/data/furniture';
import { checkTileAdjacency, isCellOccupiedByFurniture } from '@/game/systems/building-system';
import { canPlaceFurnitureOnFloor } from '@/game/systems/furniture-system';
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
  /** Place a single floor tile at position with color. Costs 5g. */
  placeFloorTile: (x: number, z: number, color: string) => boolean;
  /** Erase a floor tile. Blocked if furniture occupies that cell. */
  eraseFloorTile: (x: number, z: number) => boolean;
  /** Place furniture at position. Validates floor coverage + guild level unlock. */
  placeFurniture: (furnitureType: FurnitureType, position: GridCell, rotation: Rotation) => boolean;
  /** Remove furniture by ID. */
  removeFurniture: (furnitureId: string) => boolean;
  /** Upgrade a core furniture piece (= level up). Spends resources. */
  upgradeFurniture: (furnitureId: string) => boolean;
  /** Invite a mercenary to become an official guild member (cost: level * 100g) */
  inviteMercenary: (memberId: string) => boolean;
  /** Promote a guild member to next rank. Costs gold. Returns success. */
  promoteMember: (memberId: string) => boolean;
}

/** Generate the default 6x6 gold floor + quest-board at center */
export function createDefaultFloor(): GuildHall {
  const floorTiles: FloorTile[] = [];
  for (let x = 0; x < 6; x++) {
    for (let z = 0; z < 6; z++) {
      floorTiles.push({ x, z, color: '#DAA520' });
    }
  }
  const furniture: PlacedFurniture[] = [{
    id: crypto.randomUUID(),
    type: 'quest-board',
    level: 1,
    position: { x: 3, z: 3 },
    rotation: 0,
  }];
  return { level: 1, floorTiles, furniture };
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
  guildHall: createDefaultFloor(),
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
      guildHall: { ...s.guildHall },
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

  placeFloorTile: (x, z, color) => {
    let success = false;
    set((s) => {
      if (s.guildHall.floorTiles.some((t) => t.x === x && t.z === z)) return s;
      if (!checkTileAdjacency(s.guildHall.floorTiles, x, z)) return s;
      if (s.gold < FLOOR_TILE_COST) return s;
      success = true;
      return {
        gold: s.gold - FLOOR_TILE_COST,
        guildHall: {
          ...s.guildHall,
          floorTiles: [...s.guildHall.floorTiles, { x, z, color }],
        },
      };
    });
    return success;
  },

  eraseFloorTile: (x, z) => {
    let success = false;
    set((s) => {
      if (isCellOccupiedByFurniture(s.guildHall.furniture, x, z)) return s;
      if (s.guildHall.floorTiles.length <= 1) return s;
      const exists = s.guildHall.floorTiles.some((t) => t.x === x && t.z === z);
      if (!exists) return s;
      success = true;
      return {
        guildHall: {
          ...s.guildHall,
          floorTiles: s.guildHall.floorTiles.filter((t) => !(t.x === x && t.z === z)),
        },
      };
    });
    return success;
  },

  placeFurniture: (furnitureType, position, rotation) => {
    let success = false;
    set((s) => {
      const validation = canPlaceFurnitureOnFloor(
        s.guildHall, furnitureType, position, rotation, s.guildLevel,
      );
      if (!validation.success) return s;

      const def = getFurnitureDefinition(furnitureType);
      if (!def || s.gold < def.cost.gold) return s;

      // Consume items if needed
      if (def.cost.items) {
        const fullState = s as GuildSlice & { inventory: InventoryState };
        const inv = fullState.inventory;
        for (const [id, needed] of Object.entries(def.cost.items)) {
          if (needed && needed > 0 && ((inv.items as Record<string, number>)[id] ?? 0) < needed) {
            return s;
          }
        }
        const newItems = { ...inv.items };
        for (const [id, needed] of Object.entries(def.cost.items)) {
          if (needed && needed > 0) {
            (newItems as Record<string, number>)[id] = ((newItems as Record<string, number>)[id] ?? 0) - needed;
          }
        }
        success = true;
        const newFurniture: PlacedFurniture = {
          id: crypto.randomUUID(), type: furnitureType,
          level: 1, position, rotation,
        };
        return {
          gold: s.gold - def.cost.gold,
          inventory: { ...inv, items: newItems },
          guildHall: {
            ...s.guildHall,
            furniture: [...s.guildHall.furniture, newFurniture],
          },
        } as unknown as Partial<GuildSlice>;
      }

      success = true;
      const newFurniture: PlacedFurniture = {
        id: crypto.randomUUID(), type: furnitureType,
        level: 1, position, rotation,
      };
      return {
        gold: s.gold - def.cost.gold,
        guildHall: {
          ...s.guildHall,
          furniture: [...s.guildHall.furniture, newFurniture],
        },
      };
    });
    return success;
  },

  removeFurniture: (furnitureId) => {
    let success = false;
    set((s) => {
      const exists = s.guildHall.furniture.some((f) => f.id === furnitureId);
      if (!exists) return s;
      success = true;
      return {
        guildHall: {
          ...s.guildHall,
          furniture: s.guildHall.furniture.filter((f) => f.id !== furnitureId),
        },
      };
    });
    return success;
  },

  upgradeFurniture: (furnitureId) => {
    let success = false;
    set((s) => {
      const furniture = s.guildHall.furniture.find((f) => f.id === furnitureId);
      if (!furniture) return s;
      const def = getFurnitureDefinition(furniture.type);
      if (!def?.upgradeCosts) return s;
      const nextIdx = furniture.level - 1;
      if (nextIdx >= def.upgradeCosts.length) return s;
      const cost = def.upgradeCosts[nextIdx];
      if (s.gold < (cost.gold ?? 0)) return s;

      // Validate + deduct items
      if (cost.items) {
        const fullState = s as GuildSlice & { inventory: InventoryState };
        const inv = fullState.inventory;
        for (const [id, needed] of Object.entries(cost.items)) {
          if (needed && needed > 0 && ((inv.items as Record<string, number>)[id] ?? 0) < needed) {
            return s;
          }
        }
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
            furniture: s.guildHall.furniture.map((f) =>
              f.id === furnitureId ? { ...f, level: f.level + 1 } : f,
            ),
          },
        } as unknown as Partial<GuildSlice>;
      }

      success = true;
      return {
        gold: s.gold - (cost.gold ?? 0),
        guildHall: {
          ...s.guildHall,
          furniture: s.guildHall.furniture.map((f) =>
            f.id === furnitureId ? { ...f, level: f.level + 1 } : f,
          ),
        },
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
          m.id === memberId ? { ...m, rank: 'RECRUIT' as const } : m,
        ),
      } as unknown as Partial<GuildSlice>;
    });
    return success;
  },

  promoteMember: (memberId) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };

      const member = fullState.founder?.id === memberId
        ? fullState.founder
        : fullState.roster.find((m) => m.id === memberId);
      if (!member || member.rank === 'MERCENARY') return s;

      if (member.status === 'on-mission' || member.status === 'injured') return s;

      const currentRank = member.rank as GuildRank;
      const def = GUILD_RANKS[currentRank];
      if (!def?.promotion) return s;

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
});
