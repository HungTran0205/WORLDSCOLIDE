import type { StateCreator, StoreApi } from 'zustand';
import type { GuildHall, GameSettings, TavernState, Member, FloorTile, PlacedFurniture, GridCell, Rotation, FurnitureType, GuildRank, FacilityType, GuildFacility, SyringeLoadout, AlchemyCraftJob, MemberEquipment, MedicineSlot, MedicineCondition } from './game-state';
import type { InventoryState } from './game-state';
import type { InventorySlice } from './inventory-slice';
import type { RosterSlice } from './roster-slice';
import type { ClockSlice } from './clock-slice';
import type { ItemID } from '@/game/data/items';
import type { EquipmentSlot } from '@/game/data/equipment-templates';
import { getEquipmentTemplate } from '@/game/data/equipment-templates';
import type { FacilityProductionResult, LoggingTickResult } from '@/game/systems/facility-production-system';
import type { StoneQuarryTickResult } from '@/game/systems/stone-quarry-production-system';
import type { AcXpGain } from '@/game/systems/alchemy-production-system';
import { calcAcLevel } from '@/game/systems/alchemy-production-system';
import { FACILITY_DEFINITIONS, LOGGING_SITE_CONFIG } from '@/game/data/facility-definitions';
import { FLOOR_TILE_COST } from '@/game/data/buildings';
import { getFurnitureDefinition } from '@/game/data/furniture';
import { checkTileAdjacency, isCellOccupiedByFurniture } from '@/game/systems/building-system';
import { canPlaceFurnitureOnFloor } from '@/game/systems/furniture-system';
import { GUILD_RANKS, getNextRank } from '@/game/data/ranks';
import { createWorkshopActions, type WorkshopActions } from './guild-slice-workshop';
import type { WorkshopOfflineSummary } from '@/game/systems/workshop-offline-system';

export interface GuildSlice extends WorkshopActions {
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
  /** Build a new instance of a facility type (max 3 per type). Returns the new instance id, or null if failed. */
  buildFacility: (type: FacilityType) => string | null;
  /** Place a built-but-unplaced facility instance into a slot. */
  placeFacility: (id: string, slotIndex: number) => boolean;
  upgradeFacility: (id: string) => boolean;
  assignMemberToFacility: (memberId: string, id: string) => boolean;
  unassignMemberFromFacility: (memberId: string, id: string) => boolean;
  /** Apply per-tick logging site production results (WC XP, reserve depletion) */
  applyLoggingProduction: (result: LoggingTickResult) => void;
  /** Apply per-tick stone quarry production results (MC XP gains) */
  applyStoneQuarryProduction: (result: StoneQuarryTickResult) => void;
  /** Apply alchemy lab AC skill XP gains (used by offline catch-up). */
  applyAlchemyProduction: (result: { acXpGains: AcXpGain[] }) => void;
  /** Set or clear a member's syringe loadout (auto-use config) */
  setSyringeLoadout: (memberId: string, loadout: SyringeLoadout | null) => void;
  /** Equip an item from equipmentInventory onto a member. Swaps if slot occupied. Returns success. */
  equipGear: (memberId: string, equipmentItemId: string) => boolean;
  /** Unequip a gear slot from a member — item returns to equipmentInventory. Returns success. */
  unequipGear: (memberId: string, slot: EquipmentSlot) => boolean;
  /** Remove a facility instance by id. Primary (id===type) resets to level 0; secondaries are removed. */
  removeFacility: (id: string) => void;
  /** Add a craft job to an alchemy lab queue (ingredients already consumed) */
  addAlchemyCraftJob: (id: string, job: AlchemyCraftJob) => void;
  /** Tick all alchemy craft queues by 1s; adds output items for completed jobs */
  tickAlchemyQueues: () => void;
  /** Set one medicine slot on a member */
  setMedicineSlot: (memberId: string, slotIdx: 0 | 1, slot: MedicineSlot) => void;
  /** Clear one medicine slot on a member — itemId → null, condition stays */
  clearMedicineSlot: (memberId: string, slotIdx: 0 | 1) => void;
  // Ephemeral offline facility report — not persisted in save
  offlineFacilityReport: FacilityProductionResult[] | null;
  offlineElapsedHours: number;
  clearOfflineFacilityReport: () => void;
  /** Ephemeral workshop offline summary (cleared after popup display) */
  offlineWorkshopSummary: WorkshopOfflineSummary | null;
  clearOfflineWorkshopSummary: () => void;
}

export const DEFAULT_MEDICINE_SLOTS: [MedicineSlot, MedicineSlot] = [
  { itemId: null, condition: 'start' as MedicineCondition },
  { itemId: null, condition: 'start' as MedicineCondition },
];

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
const ATMOSPHERIC_KEY = 'atmospheric-enabled';

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

/** HD-2D atmospheric stack toggle. Browser-only — guards against `localStorage`
 *  being absent in test/SSR contexts. Default-on for high tier; default-off
 *  for low. Explicit user override (either value present in storage) wins.
 *  Intended to be called at Canvas mount, not at store module load. */
export function getStoredAtmospheric(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const v = localStorage.getItem(ATMOSPHERIC_KEY);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return getStoredGraphicsQuality() === 'high';
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  autoSkillDefault: true,
  graphicsQuality: 'high',
  shadowsEnabled: false,
  bloomEnabled: false,
  bloomThreshold: 0.85,
  atmosphericEnabled: true,
};

const DEFAULT_TAVERN: TavernState = {
  lastRefreshTime: 0,
  availableMercenaries: [],
};

const DEFAULT_FACILITIES: GuildFacility[] = [
  { id: 'tavern',        type: 'tavern',        level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  { id: 'training-yard', type: 'training-yard', level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  { id: 'infirmary',     type: 'infirmary',     level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  { id: 'workshop',      type: 'workshop',      level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  { id: 'logging-site',  type: 'logging-site',  level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  { id: 'stone-quarry',  type: 'stone-quarry',  level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
  { id: 'alchemy-lab',   type: 'alchemy-lab',   level: 0, assignedMemberIds: [], placedSlot: null, woodReserve: null },
];

export const createGuildSlice: StateCreator<GuildSlice & InventorySlice & RosterSlice & ClockSlice, [], [], GuildSlice> = (set, get) => ({
  ...createWorkshopActions(
    set as unknown as StoreApi<GuildSlice & InventorySlice & RosterSlice & ClockSlice>['setState'],
  ),
  guildName: '',
  guildLevel: 1,
  gold: 100,
  guildHall: createDefaultFloor(),
  settings: DEFAULT_SETTINGS,
  tavern: DEFAULT_TAVERN,
  facilities: DEFAULT_FACILITIES,
  offlineFacilityReport: null,
  offlineElapsedHours: 0,
  offlineWorkshopSummary: null,

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
    if (partial.atmosphericEnabled !== undefined) {
      localStorage.setItem(ATMOSPHERIC_KEY, String(partial.atmosphericEnabled));
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
    let newId: string | null = null;
    set((s) => {
      // Max 3 active instances per type
      const activeCount = s.facilities.filter((f) => f.type === type && f.level > 0).length;
      if (activeCount >= 3) return s;

      const fullState = s as GuildSlice & { inventory: InventoryState };
      const permitKey: ItemID = 'LOGGING_SITE_ACCESS';
      const hasPermit = (fullState.inventory?.items[permitKey] ?? 0) > 0;

      if (type === 'logging-site') {
        if (!hasPermit) return s;
        const primary = s.facilities.find((f) => f.id === type && f.level === 0);
        const instanceId = primary ? type : `${type}-${Date.now()}`;
        newId = instanceId;
        const newItems = { ...fullState.inventory.items };
        newItems[permitKey] = (newItems[permitKey] ?? 0) - 1;
        const newEntry: GuildFacility = { id: instanceId, type, level: 1, assignedMemberIds: [], placedSlot: null, woodReserve: LOGGING_SITE_CONFIG.woodReserve };
        return {
          facilities: primary
            ? s.facilities.map((f) => f.id === type ? newEntry : f)
            : [...s.facilities, newEntry],
          inventory: { ...fullState.inventory, items: newItems },
        } as unknown as Partial<GuildSlice>;
      }

      const cost = FACILITY_DEFINITIONS[type].buildCost;
      if (cost > 0 && s.guildLevel < 2) return s;
      if (s.gold < cost) return s;

      const primary = s.facilities.find((f) => f.id === type && f.level === 0);
      const instanceId = primary ? type : `${type}-${Date.now()}`;
      newId = instanceId;
      const newEntry: GuildFacility = { id: instanceId, type, level: 1, assignedMemberIds: [], placedSlot: null, woodReserve: null };
      return {
        gold: s.gold - cost,
        facilities: primary
          ? s.facilities.map((f) => f.id === type ? newEntry : f)
          : [...s.facilities, newEntry],
      };
    });
    return newId;
  },

  placeFacility: (id, slotIndex) => {
    let success = false;
    set((s) => {
      const facility = s.facilities.find((f) => f.id === id);
      if (!facility || facility.level === 0) return s;
      if (slotIndex < 0 || slotIndex > 11) return s;
      if (s.facilities.some((f) => f.placedSlot === slotIndex)) return s;
      success = true;
      return {
        facilities: s.facilities.map((f) =>
          f.id === id ? { ...f, placedSlot: slotIndex } : f,
        ),
      };
    });
    return success;
  },

  upgradeFacility: (id) => {
    let success = false;
    set((s) => {
      const facility = s.facilities.find((f) => f.id === id);
      if (!facility || facility.level === 0 || facility.level >= 3) return s;
      const upgradeCosts = FACILITY_DEFINITIONS[facility.type].upgradeCosts;
      if (!upgradeCosts) return s;
      const cost = upgradeCosts[facility.level - 1];
      if (s.gold < cost) return s;
      success = true;
      return {
        gold: s.gold - cost,
        facilities: s.facilities.map((f) => f.id === id ? { ...f, level: f.level + 1 } : f),
      };
    });
    return success;
  },

  assignMemberToFacility: (memberId, id) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      const member = fullState.founder?.id === memberId
        ? fullState.founder
        : fullState.roster.find((m) => m.id === memberId);
      if (!member) return s;
      if (member.status === 'on-mission' || member.status === 'injured' || member.status === 'assigned') return s;

      const facility = s.facilities.find((f) => f.id === id);
      if (!facility || facility.level === 0) return s;

      const maxSlots = FACILITY_DEFINITIONS[facility.type].maxSlots[facility.level - 1];
      if (facility.assignedMemberIds.length >= maxSlots) return s;

      if (s.facilities.some((f) => f.assignedMemberIds.includes(memberId))) return s;

      success = true;
      const updatedFacilities = s.facilities.map((f) =>
        f.id === id ? { ...f, assignedMemberIds: [...f.assignedMemberIds, memberId] } : f,
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

      // Collect member IDs to auto-unassign — only from the SPECIFIC depleted facility(ies),
      // matched by facility id. Matching by facility type would cascade unassign across all
      // logging-sites of same type when only one depleted.
      const depletedFacilityIds = new Set<string>(
        result.reserveUpdates.filter((u) => u.depleted).map((u) => u.facilityId),
      );
      const depletedMemberIds = new Set<string>();
      for (const f of s.facilities) {
        if (depletedFacilityIds.has(f.id)) {
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
        const update = result.reserveUpdates.find((u) => u.facilityId === f.id);
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

  equipGear: (memberId, equipmentItemId) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null; inventory: InventoryState };
      const eqInv = fullState.inventory.equipmentInventory ?? [];
      const item = eqInv.find((i) => i.id === equipmentItemId);
      if (!item) return s;

      const template = getEquipmentTemplate(item.templateId);
      const slot = template.slot;

      const member = fullState.founder?.id === memberId
        ? fullState.founder
        : fullState.roster.find((m) => m.id === memberId);
      if (!member) return s;

      const displaced = member.equipment?.[slot] ?? null;
      const newEquipment: MemberEquipment = { ...member.equipment, [slot]: item };
      const newEqInv = eqInv.filter((i) => i.id !== equipmentItemId);
      if (displaced) newEqInv.push(displaced);

      success = true;
      const newInventory = { ...fullState.inventory, equipmentInventory: newEqInv };

      if (fullState.founder?.id === memberId) {
        return {
          founder: { ...fullState.founder, equipment: newEquipment },
          inventory: newInventory,
        } as unknown as Partial<GuildSlice>;
      }
      return {
        roster: fullState.roster.map((m) => m.id === memberId ? { ...m, equipment: newEquipment } : m),
        inventory: newInventory,
      } as unknown as Partial<GuildSlice>;
    });
    return success;
  },

  unequipGear: (memberId, slot) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null; inventory: InventoryState };
      const member = fullState.founder?.id === memberId
        ? fullState.founder
        : fullState.roster.find((m) => m.id === memberId);
      if (!member?.equipment?.[slot]) return s;

      const removed = member.equipment[slot]!;
      const newEquipment = { ...member.equipment, [slot]: null };
      const newInventory = {
        ...fullState.inventory,
        equipmentInventory: [...(fullState.inventory.equipmentInventory ?? []), removed],
      };

      success = true;
      if (fullState.founder?.id === memberId) {
        return {
          founder: { ...fullState.founder, equipment: newEquipment },
          inventory: newInventory,
        } as unknown as Partial<GuildSlice>;
      }
      return {
        roster: fullState.roster.map((m) => m.id === memberId ? { ...m, equipment: newEquipment } : m),
        inventory: newInventory,
      } as unknown as Partial<GuildSlice>;
    });
    return success;
  },

  addAlchemyCraftJob: (id, job) => {
    set((s) => ({
      facilities: s.facilities.map((f) =>
        f.id === id
          ? { ...f, craftQueue: [...(f.craftQueue ?? []), job] }
          : f,
      ),
    }));
  },

  tickAlchemyQueues: () => {
    const completed: { itemId: string; qty: number }[] = [];
    // memberId → AC XP credited this tick (split among assigned alchemists per facility)
    const xpAccum = new Map<string, number>();

    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      const updatedFacilities = s.facilities.map((f) => {
        if (f.type !== 'alchemy-lab' || !f.craftQueue?.length) return f;
        const assignedIds = f.assignedMemberIds;
        const newQueue: AlchemyCraftJob[] = [];
        for (const job of f.craftQueue) {
          if (job.remainingSeconds <= 1) {
            completed.push({ itemId: job.outputItemId, qty: job.outputQuantity });
            // AC XP only for healing-syringe completions, split across assigned alchemists
            if (job.outputItemId === 'HEALING_SYRINGE' && assignedIds.length > 0) {
              const xpPerMember = job.outputQuantity / assignedIds.length;
              for (const id of assignedIds) {
                xpAccum.set(id, (xpAccum.get(id) ?? 0) + xpPerMember);
              }
            }
          } else {
            newQueue.push({ ...job, remainingSeconds: job.remainingSeconds - 1 });
          }
        }
        return { ...f, craftQueue: newQueue };
      });

      if (xpAccum.size === 0) {
        return { facilities: updatedFacilities } as unknown as Partial<GuildSlice>;
      }

      const updateMember = (m: Member): Member => {
        const xp = xpAccum.get(m.id);
        if (!xp) return m;
        const currentXp = m.craftSkills?.alchemy?.xpAccumulated ?? 0;
        const newXp = currentXp + xp;
        return {
          ...m,
          craftSkills: {
            woodcutting: m.craftSkills?.woodcutting ?? { level: 0, xpAccumulated: 0 },
            mining: m.craftSkills?.mining ?? { level: 0, xpAccumulated: 0 },
            alchemy: { level: calcAcLevel(newXp), xpAccumulated: newXp },
          },
        };
      };

      return {
        facilities: updatedFacilities,
        roster: fullState.roster.map(updateMember),
        ...(fullState.founder ? { founder: updateMember(fullState.founder) } : {}),
      } as unknown as Partial<GuildSlice>;
    });

    for (const { itemId, qty } of completed) {
      get().addItem(itemId as ItemID, qty);
    }
  },

  removeFacility: (id) => {
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      const facility = s.facilities.find((f) => f.id === id);
      if (!facility || facility.level === 0) return s;

      const assignedIds = new Set(facility.assignedMemberIds);
      // Primary instance (id === type): reset to level 0 to preserve template slot
      // Secondary instances: remove from array entirely
      // Workshop v2: also wipe queue + blueprints so tasks don't freeze on a level-0 workshop
      const isPrimary = id === facility.type;
      return {
        facilities: isPrimary
          ? s.facilities.map((f) => f.id === id ? { ...f, level: 0, placedSlot: null, assignedMemberIds: [], woodReserve: null, workshopQueue: [], workshopBlueprints: [], craftQueue: [] } : f)
          : s.facilities.filter((f) => f.id !== id),
        roster: fullState.roster.map((m) => assignedIds.has(m.id) ? { ...m, status: 'idle' as const } : m),
        ...(fullState.founder && assignedIds.has(fullState.founder.id)
          ? { founder: { ...fullState.founder, status: 'idle' as const } }
          : {}),
      } as unknown as Partial<GuildSlice>;
    });
  },

  clearOfflineFacilityReport: () => set({ offlineFacilityReport: null, offlineElapsedHours: 0 }),

  clearOfflineWorkshopSummary: () => set({ offlineWorkshopSummary: null }),

  setMedicineSlot: (memberId, slotIdx, slot) => {
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      const member = fullState.founder?.id === memberId ? fullState.founder : fullState.roster.find(m => m.id === memberId);
      if (!member) return s;
      const next: [MedicineSlot, MedicineSlot] = [...(member.medicineSlots ?? DEFAULT_MEDICINE_SLOTS)] as [MedicineSlot, MedicineSlot];
      next[slotIdx] = slot;
      if (fullState.founder?.id === memberId) return { founder: { ...fullState.founder, medicineSlots: next } } as unknown as Partial<GuildSlice>;
      return { roster: fullState.roster.map(m => m.id === memberId ? { ...m, medicineSlots: next } : m) } as unknown as Partial<GuildSlice>;
    });
  },

  clearMedicineSlot: (memberId, slotIdx) => {
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      const member = fullState.founder?.id === memberId ? fullState.founder : fullState.roster.find(m => m.id === memberId);
      if (!member) return s;
      const next: [MedicineSlot, MedicineSlot] = [...(member.medicineSlots ?? DEFAULT_MEDICINE_SLOTS)] as [MedicineSlot, MedicineSlot];
      next[slotIdx] = { ...next[slotIdx], itemId: null };
      if (fullState.founder?.id === memberId) return { founder: { ...fullState.founder, medicineSlots: next } } as unknown as Partial<GuildSlice>;
      return { roster: fullState.roster.map(m => m.id === memberId ? { ...m, medicineSlots: next } : m) } as unknown as Partial<GuildSlice>;
    });
  },

  unassignMemberFromFacility: (memberId, id) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      const facility = s.facilities.find((f) => f.id === id);
      if (!facility || !facility.assignedMemberIds.includes(memberId)) return s;

      success = true;
      const updatedFacilities = s.facilities.map((f) =>
        f.id === id
          ? { ...f, assignedMemberIds: f.assignedMemberIds.filter((mid) => mid !== memberId) }
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
