import type { StateCreator } from 'zustand';
import type { GuildHall, GameSettings, TavernState, Member, FloorTile, PlacedFurniture, GridCell, Rotation, FurnitureType, GuildRank, FacilityType, GuildFacility, SyringeLoadout, AlchemyCraftJob } from './game-state';
import type { InventoryState } from './game-state';
import type { InventorySlice } from './inventory-slice';
import type { RosterSlice } from './roster-slice';
import type { ItemID } from '@/game/data/items';
import type { FacilityProductionResult, LoggingTickResult } from '@/game/systems/facility-production-system';
import type { StoneQuarryTickResult } from '@/game/systems/stone-quarry-production-system';
import type { AlchemyProductionResult } from '@/game/systems/alchemy-production-system';
import { FACILITY_DEFINITIONS, LOGGING_SITE_CONFIG } from '@/game/data/facility-definitions';
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
  // --- Facility system ---
  facilities: GuildFacility[];
  buildFacility: (type: FacilityType) => boolean;
  placeFacility: (type: FacilityType, slotIndex: number) => boolean;
  upgradeFacility: (type: FacilityType) => boolean;
  assignMemberToFacility: (memberId: string, type: FacilityType) => boolean;
  unassignMemberFromFacility: (memberId: string, type: FacilityType) => boolean;
  /** Apply per-tick logging site production results (WC XP, reserve depletion) */
  applyLoggingProduction: (result: LoggingTickResult) => void;
  /** Apply per-tick stone quarry production results (MC XP gains) */
  applyStoneQuarryProduction: (result: StoneQuarryTickResult) => void;
  /** Apply alchemy lab production results (AC XP gains) */
  applyAlchemyProduction: (result: AlchemyProductionResult) => void;
  /** Set or clear a member's syringe loadout (auto-use config) */
  setSyringeLoadout: (memberId: string, loadout: SyringeLoadout | null) => void;
  /** Remove a depleted (or manually removed) logging site — resets to level 0 */
  removeFacility: (type: FacilityType) => void;
  /** Add a craft job to an alchemy lab queue (ingredients already consumed) */
  addAlchemyCraftJob: (facilityType: FacilityType, job: AlchemyCraftJob) => void;
  /** Tick all alchemy craft queues by 1s; adds output items for completed jobs */
  tickAlchemyQueues: () => void;
  // Ephemeral offline facility report — not persisted in save
  offlineFacilityReport: FacilityProductionResult[] | null;
  offlineElapsedHours: number;
  clearOfflineFacilityReport: () => void;
}

/** Generate the default 10x7 diorama floor (no default furniture — quest board is a static scene prop) */
export function createDefaultFloor(): GuildHall {
  const floorTiles: FloorTile[] = [];
  for (let x = 0; x < 10; x++) {
    for (let z = 0; z < 7; z++) {
      floorTiles.push({ x, z, color: '#DAA520' });
    }
  }
  return { level: 1, floorTiles, furniture: [] };
}

const GRAPHICS_QUALITY_KEY = 'graphics-quality';
const SHADOWS_KEY = 'shadows-enabled';
const BLOOM_KEY = 'bloom-enabled';
const BLOOM_THRESHOLD_KEY = 'bloom-threshold';

/** Read graphics quality at module load — used by Canvas before store hydrates */
export function getStoredGraphicsQuality(): 'high' | 'low' {
  const v = localStorage.getItem(GRAPHICS_QUALITY_KEY);
  return v === 'low' ? 'low' : 'high';
}

export function getStoredShadows(): boolean {
  return localStorage.getItem(SHADOWS_KEY) === 'true';
}

export function getStoredBloom(): boolean {
  return localStorage.getItem(BLOOM_KEY) === 'true';
}

export function getStoredBloomThreshold(): number {
  const v = parseFloat(localStorage.getItem(BLOOM_THRESHOLD_KEY) ?? '');
  return isNaN(v) ? 0.85 : Math.max(0, Math.min(1, v));
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  autoSkillDefault: true,
  graphicsQuality: 'high',
  shadowsEnabled: false,
  bloomEnabled: false,
  bloomThreshold: 0.85,
};

const DEFAULT_TAVERN: TavernState = {
  lastRefreshTime: 0,
  availableMercenaries: [],
};

const DEFAULT_FACILITIES: GuildFacility[] = [
  { type: 'tavern',        level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  { type: 'training-yard', level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  { type: 'infirmary',     level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  { type: 'workshop',      level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  { type: 'logging-site',  level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  { type: 'stone-quarry',  level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  { type: 'alchemy-lab',   level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
];

export const createGuildSlice: StateCreator<GuildSlice & InventorySlice & RosterSlice, [], [], GuildSlice> = (set, get) => ({
  guildName: '',
  guildLevel: 1,
  gold: 100,
  guildHall: createDefaultFloor(),
  settings: DEFAULT_SETTINGS,
  tavern: DEFAULT_TAVERN,
  facilities: DEFAULT_FACILITIES,
  offlineFacilityReport: null,
  offlineElapsedHours: 0,

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

  updateSettings: (partial) => {
    if (partial.graphicsQuality !== undefined) {
      localStorage.setItem(GRAPHICS_QUALITY_KEY, partial.graphicsQuality);
    }
    if (partial.shadowsEnabled !== undefined) {
      localStorage.setItem(SHADOWS_KEY, String(partial.shadowsEnabled));
    }
    if (partial.bloomEnabled !== undefined) {
      localStorage.setItem(BLOOM_KEY, String(partial.bloomEnabled));
    }
    if (partial.bloomThreshold !== undefined) {
      localStorage.setItem(BLOOM_THRESHOLD_KEY, String(partial.bloomThreshold));
    }
    set((s) => ({ settings: { ...s.settings, ...partial } }));
  },

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

      if (member.status === 'on-mission' || member.status === 'injured' || member.status === 'assigned') return s;

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

  buildFacility: (type) => {
    let success = false;
    set((s) => {
      const facility = s.facilities.find((f) => f.type === type);
      if (!facility || facility.level !== 0) return s;

      const fullState = s as GuildSlice & { inventory: InventoryState };
      const permitKey: ItemID = 'LOGGING_SITE_ACCESS';
      const hasPermit = (fullState.inventory?.items[permitKey] ?? 0) > 0;

      if (type === 'logging-site') {
        // Logging site requires a permit — no gold path
        if (!hasPermit) return s;
        success = true;
        const newItems = { ...fullState.inventory.items };
        newItems[permitKey] = (newItems[permitKey] ?? 0) - 1;
        return {
          facilities: s.facilities.map((f) =>
            f.type === type ? { ...f, level: 1, woodReserve: LOGGING_SITE_CONFIG.woodReserve } : f,
          ),
          inventory: { ...fullState.inventory, items: newItems },
        } as unknown as Partial<GuildSlice>;
      }

      // Normal path: free facilities (buildCost=0) skip guildLevel + gold checks
      const cost = FACILITY_DEFINITIONS[type].buildCost;
      if (cost > 0 && s.guildLevel < 2) return s;
      if (s.gold < cost) return s;
      success = true;
      return {
        gold: s.gold - cost,
        facilities: s.facilities.map((f) => f.type === type ? { ...f, level: 1 } : f),
      };
    });
    return success;
  },

  placeFacility: (type, slotIndex) => {
    let success = false;
    set((s) => {
      const facility = s.facilities.find((f) => f.type === type);
      if (!facility || facility.level === 0) return s;
      if (slotIndex < 0 || slotIndex > 11) return s;
      // Reject if another facility already occupies this slot
      if (s.facilities.some((f) => f.placedSlot === slotIndex)) return s;
      success = true;
      return {
        facilities: s.facilities.map((f) =>
          f.type === type ? { ...f, placedSlot: slotIndex } : f,
        ),
      };
    });
    return success;
  },

  upgradeFacility: (type) => {
    let success = false;
    set((s) => {
      const facility = s.facilities.find((f) => f.type === type);
      if (!facility || facility.level === 0 || facility.level >= 3) return s;
      const upgradeCosts = FACILITY_DEFINITIONS[type].upgradeCosts;
      if (!upgradeCosts) return s; // no upgrade path (e.g. logging-site)
      const cost = upgradeCosts[facility.level - 1];
      if (s.gold < cost) return s;
      success = true;
      return {
        gold: s.gold - cost,
        facilities: s.facilities.map((f) => f.type === type ? { ...f, level: f.level + 1 } : f),
      };
    });
    return success;
  },

  assignMemberToFacility: (memberId, type) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      const member = fullState.founder?.id === memberId
        ? fullState.founder
        : fullState.roster.find((m) => m.id === memberId);
      if (!member) return s;
      if (member.status === 'on-mission' || member.status === 'injured' || member.status === 'assigned') return s;

      const facility = s.facilities.find((f) => f.type === type);
      if (!facility || facility.level === 0) return s;

      const maxSlots = FACILITY_DEFINITIONS[type].maxSlots[facility.level - 1];
      if (facility.assignedMemberIds.length >= maxSlots) return s;

      if (s.facilities.some((f) => f.assignedMemberIds.includes(memberId))) return s;

      success = true;
      const updatedFacilities = s.facilities.map((f) =>
        f.type === type ? { ...f, assignedMemberIds: [...f.assignedMemberIds, memberId] } : f,
      );

      if (fullState.founder?.id === memberId) {
        return {
          facilities: updatedFacilities,
          founder: { ...fullState.founder, status: 'assigned' as const },
        } as unknown as Partial<GuildSlice>;
      }
      return {
        facilities: updatedFacilities,
        roster: fullState.roster.map((m) =>
          m.id === memberId ? { ...m, status: 'assigned' as const } : m,
        ),
      } as unknown as Partial<GuildSlice>;
    });
    return success;
  },

  applyLoggingProduction: (result) => {
    if (result.wcXpGains.length === 0 && result.reserveUpdates.length === 0) return;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };

      // Build lookup for WC XP gains
      const wcGainMap = new Map(result.wcXpGains.map((g) => [g.memberId, g]));

      // Collect member IDs to auto-unassign from depleted facilities
      const depletedTypes = new Set<string>(result.reserveUpdates.filter((u) => u.depleted).map((u) => u.facilityType));
      const depletedMemberIds = new Set<string>();
      for (const f of s.facilities) {
        if (depletedTypes.has(f.type)) {
          for (const id of f.assignedMemberIds) depletedMemberIds.add(id);
        }
      }

      const updateMember = (m: Member): Member => {
        const gain = wcGainMap.get(m.id);
        const isDepleted = depletedMemberIds.has(m.id);
        if (!gain && !isDepleted) return m;
        return {
          ...m,
          ...(isDepleted ? { status: 'idle' as const } : {}),
          craftSkills: gain
            ? {
                woodcutting: { level: gain.newLevel, xpAccumulated: gain.newXp },
                mining: m.craftSkills?.mining ?? { level: 0, xpAccumulated: 0 },
                alchemy: m.craftSkills?.alchemy ?? { level: 0, xpAccumulated: 0 },
              }
            : m.craftSkills,
        };
      };

      const updatedFacilities = s.facilities.map((f) => {
        const update = result.reserveUpdates.find((u) => u.facilityType === f.type);
        if (!update) return f;
        return update.depleted
          ? { ...f, woodReserve: 0, assignedMemberIds: [] }
          : { ...f, woodReserve: update.newReserve };
      });

      return {
        facilities: updatedFacilities,
        roster: fullState.roster.map(updateMember),
        ...(fullState.founder ? { founder: updateMember(fullState.founder) } : {}),
      } as unknown as Partial<GuildSlice>;
    });
  },

  applyStoneQuarryProduction: (result) => {
    if (result.mcXpGains.length === 0) return;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };

      const mcGainMap = new Map(result.mcXpGains.map((g) => [g.memberId, g]));

      const updateMember = (m: Member): Member => {
        const gain = mcGainMap.get(m.id);
        if (!gain) return m;
        return {
          ...m,
          craftSkills: {
            woodcutting: m.craftSkills?.woodcutting ?? { level: 0, xpAccumulated: 0 },
            mining: { level: gain.newLevel, xpAccumulated: gain.newXp },
            alchemy: m.craftSkills?.alchemy ?? { level: 0, xpAccumulated: 0 },
          },
        };
      };

      return {
        roster: fullState.roster.map(updateMember),
        ...(fullState.founder ? { founder: updateMember(fullState.founder) } : {}),
      } as unknown as Partial<GuildSlice>;
    });
  },

  applyAlchemyProduction: (result) => {
    if (result.acXpGains.length === 0) return;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };

      const acGainMap = new Map(result.acXpGains.map((g) => [g.memberId, g]));

      const updateMember = (m: Member): Member => {
        const gain = acGainMap.get(m.id);
        if (!gain) return m;
        return {
          ...m,
          craftSkills: {
            woodcutting: m.craftSkills?.woodcutting ?? { level: 0, xpAccumulated: 0 },
            mining: m.craftSkills?.mining ?? { level: 0, xpAccumulated: 0 },
            alchemy: { level: gain.newLevel, xpAccumulated: gain.newXp },
          },
        };
      };

      return {
        roster: fullState.roster.map(updateMember),
        ...(fullState.founder ? { founder: updateMember(fullState.founder) } : {}),
      } as unknown as Partial<GuildSlice>;
    });
  },

  setSyringeLoadout: (memberId, loadout) => {
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };

      if (fullState.founder?.id === memberId) {
        return { founder: { ...fullState.founder, syringeLoadout: loadout } } as unknown as Partial<GuildSlice>;
      }
      return {
        roster: fullState.roster.map((m) =>
          m.id === memberId ? { ...m, syringeLoadout: loadout } : m,
        ),
      } as unknown as Partial<GuildSlice>;
    });
  },

  addAlchemyCraftJob: (facilityType, job) => {
    set((s) => ({
      facilities: s.facilities.map((f) =>
        f.type === facilityType
          ? { ...f, craftQueue: [...(f.craftQueue ?? []), job] }
          : f,
      ),
    }));
  },

  tickAlchemyQueues: () => {
    const completed: { itemId: string; qty: number }[] = [];
    set((s) => ({
      facilities: s.facilities.map((f) => {
        if (f.type !== 'alchemy-lab' || !f.craftQueue?.length) return f;
        const newQueue: AlchemyCraftJob[] = [];
        for (const job of f.craftQueue) {
          if (job.remainingSeconds <= 1) {
            completed.push({ itemId: job.outputItemId, qty: job.outputQuantity });
          } else {
            newQueue.push({ ...job, remainingSeconds: job.remainingSeconds - 1 });
          }
        }
        return { ...f, craftQueue: newQueue };
      }),
    }));
    for (const { itemId, qty } of completed) {
      get().addItem(itemId as ItemID, qty);
    }
  },

  removeFacility: (type) => {
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      const facility = s.facilities.find((f) => f.type === type);
      if (!facility || facility.level === 0) return s;

      // Reset assigned members to idle
      const assignedIds = new Set(facility.assignedMemberIds);
      return {
        facilities: s.facilities.map((f) =>
          f.type === type ? { ...f, level: 0, placedSlot: null, assignedMemberIds: [], woodReserve: null } : f,
        ),
        roster: fullState.roster.map((m) =>
          assignedIds.has(m.id) ? { ...m, status: 'idle' as const } : m,
        ),
        ...(fullState.founder && assignedIds.has(fullState.founder.id)
          ? { founder: { ...fullState.founder, status: 'idle' as const } }
          : {}),
      } as unknown as Partial<GuildSlice>;
    });
  },

  clearOfflineFacilityReport: () => set({ offlineFacilityReport: null, offlineElapsedHours: 0 }),

  unassignMemberFromFacility: (memberId, type) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      const facility = s.facilities.find((f) => f.type === type);
      if (!facility || !facility.assignedMemberIds.includes(memberId)) return s;

      success = true;
      const updatedFacilities = s.facilities.map((f) =>
        f.type === type
          ? { ...f, assignedMemberIds: f.assignedMemberIds.filter((id) => id !== memberId) }
          : f,
      );

      if (fullState.founder?.id === memberId) {
        return {
          facilities: updatedFacilities,
          founder: { ...fullState.founder, status: 'idle' as const },
        } as unknown as Partial<GuildSlice>;
      }
      return {
        facilities: updatedFacilities,
        roster: fullState.roster.map((m) =>
          m.id === memberId ? { ...m, status: 'idle' as const } : m,
        ),
      } as unknown as Partial<GuildSlice>;
    });
    return success;
  },
});
