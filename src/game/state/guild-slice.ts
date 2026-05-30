import type { StateCreator, StoreApi } from 'zustand';
import type { GuildHall, GameSettings, TavernState, Member, FloorTile, PlacedFurniture, GridCell, Rotation, FurnitureType, FacilityType, GuildFacility, SyringeLoadout, AlchemyCraftJob, MemberEquipment, MedicineSlot, MedicineCondition, TavernVisitor } from './game-state';
import { GUILD_HALL_GRID_WIDTH, GUILD_HALL_GRID_DEPTH } from './guild-hall-grid';
import {
  generateTavernRoster,
  getEffectiveKeeperStats,
  rerollSeedForDay,
  type TavernLevel,
} from '@/game/systems/tavern-spawn';
import { dailyTavernSeed, mulberry32, attemptSeed, hashSeed } from '@/game/systems/seeded-rng';
import {
  buildModifierBundle,
  hireMercCost,
  keeperNegotiation,
  rollNegotiation,
  targetDemand,
  type NegotiationResult,
  type TavernGameSnapshot,
} from '@/game/systems/tavern-negotiation';
import {
  applyMercDeath,
  applyMercSurvival,
  clampRep,
  concurrentMercCap,
  makeMercContract,
  materializeVisitorFromVeteran,
  type MercQuestOutcome,
} from '@/game/systems/tavern-merc-lifecycle';
import { promoteMercToMember, REINVITE_SUCCESS_REP_BONUS } from '@/game/systems/tavern-audition';
import { TUTORIAL_RECRUIT_VISITOR } from '@/game/data/tutorial-data';
import type { InventoryState } from './game-state';
import type { InventorySlice } from './inventory-slice';
import type { RosterSlice } from './roster-slice';
import type { ClockSlice } from './clock-slice';
import { MS_PER_GAME_DAY } from './clock-slice';
import { resolveInjuryQueue, SKIP_THRESHOLD_MS } from '@/game/systems/infirmary-recovery';
import type { ItemID } from '@/game/data/items';
import type { EquipmentSlot } from '@/game/data/equipment-templates';
import { getEquipmentTemplate } from '@/game/data/equipment-templates';
import type { FacilityProductionResult, LoggingTickResult } from '@/game/systems/facility-production-system';
import type { StoneQuarryTickResult } from '@/game/systems/stone-quarry-production-system';
import type { AcXpGain } from '@/game/systems/alchemy-production-system';
import { calcAcLevel } from '@/game/systems/alchemy-production-system';
import { FACILITY_DEFINITIONS, LOGGING_SITE_CONFIG } from '@/game/data/facility-definitions';
import { RANK_COSTS, MAX_RANK_BY_FACILITY_LEVEL } from '@/game/data/skill-rank-costs';
import type { TrainingResult } from '@/game/systems/skill-training-system';
import { FLOOR_TILE_COST } from '@/game/data/buildings';
import { getFurnitureDefinition } from '@/game/data/furniture';
import { checkTileAdjacency, isCellOccupiedByFurniture } from '@/game/systems/building-system';
import { canPlaceFurnitureOnFloor } from '@/game/systems/furniture-system';
import { gradeIndex } from '@/game/data/grades';
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
  /** Invite a mercenary to become an official guild member. Cost: (gradeIndex+1) * 150g */
  inviteMercenary: (memberId: string) => boolean;
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
  /** Guild-wide once-per-game-day Skip: instantly recover one injured member whose
   *  remaining time is ≤ 5 min. Requires a built infirmary. Sets `lastSkipDay` on the
   *  primary infirmary. Returns false when blocked (no infirmary / used today / >5 min). */
  skipMemberRecovery: (memberId: string) => boolean;
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
  // --- Skill-rank training (Training Yard) ---
  /** Start training a member's skill toward the next rank. Deducts gold + material upfront.
   *  Returns false if: member not idle, slot full, rank cap exceeded, insufficient resources. */
  startSkillTraining: (memberId: string, skillId: string, facilityId: string) => boolean;
  /** Cancel an in-progress training slot. No refund (sunk cost per GDD). */
  cancelSkillTraining: (memberId: string, facilityId: string) => boolean;
  /** Apply batch training results produced by processSkillTraining(). Called by game tick. */
  applySkillTrainingResults: (results: TrainingResult[]) => void;

  // --- Tavern daily lifecycle (phase 02) ---
  /** Day-tick driver. Idempotent — guards on tavern.lastDayProcessed. */
  tickTavernDay: (currentDay: number) => void;
  /** Tutorial-only: place the scripted guaranteed visitor into the roster immediately (skips the next-day wait). */
  spawnTutorialRecruit: () => void;
  /** Spend `100 × level` gold to regenerate today's roster with the deterministic reroll seed.
   *  Max 1 per game-day. Returns false on insufficient gold or already rerolled. */
  rerollTavernRoster: () => boolean;

  // --- Tavern merc lifecycle (phase 04) ---
  /** Hire a tavern visitor as a temporary mercenary contract.
   *  Spends gold, removes visitor from currentRoster, pushes a contract into mercContracts.
   *  Returns false if visitor missing, cap reached, or insufficient gold. */
  hireMerc: (visitorId: string, mercFeeMultiplier?: number) => boolean;
  /** Adjust Tavern Reputation by `delta`, clamped to [-5, +5]. */
  adjustTavernRep: (delta: number) => void;
  /** Drop a contract without quest outcome (player abandoned mid-quest etc.). No refund. */
  releaseMerc: (contractId: string) => void;
  /** Mark mercs as on-quest at dispatch time — sets status='on-quest', questId. */
  markMercsOnQuest: (contractIds: string[], missionId: string) => void;
  /** Resolve a single merc's quest outcome. Routes to applyMercDeath/applyMercSurvival. */
  applyMercQuestResult: (contractId: string, outcome: MercQuestOutcome, currentDay: number) => void;

  // --- Tavern audition / re-invite (phase 05) ---
  /** Hire a visitor as a merc at +20% cost (counter-offer flow, spec §6.1). Wraps `hireMerc`. */
  acceptCounterOffer: (visitorId: string) => boolean;
  /**
   * Resolve a queued re-invite prompt.
   *   accept=true  → roll negotiation with +25 bonus; on success addMember + rep +2.
   *   accept=false → discard the prompt (contract already in veteranPool from survival).
   * Returns the negotiation result on accept (null on decline or missing prompt).
   * ONE-SHOT: the prompt is removed regardless of outcome (no retry).
   */
  executeReinvite: (contractId: string, accept: boolean) => NegotiationResult | null;
}

export const DEFAULT_MEDICINE_SLOTS: [MedicineSlot, MedicineSlot] = [
  { itemId: null, condition: 'start' as MedicineCondition },
  { itemId: null, condition: 'start' as MedicineCondition },
];

/** Generate the default diorama floor (no default furniture — quest board is a static scene prop) */
export function createDefaultFloor(): GuildHall {
  const floorTiles: FloorTile[] = [];
  for (let x = 0; x < GUILD_HALL_GRID_WIDTH; x++) {
    for (let z = 0; z < GUILD_HALL_GRID_DEPTH; z++) {
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
  bloomEnabled: true,
  bloomThreshold: 0.85,
  atmosphericEnabled: true,
};

/**
 * Resolve all dependent graphics flags from a single tier choice.
 * High = atmospheric + bloom on (shadows stay off — WebGPU sampler limit).
 * Low  = everything off for max perf.
 * Used by both title-screen-settings and the in-game settings panel so the
 * two stay in lockstep and saves don't drift between tier and flags.
 */
export function graphicsTierFlags(quality: 'high' | 'low'): Pick<
  GameSettings,
  'graphicsQuality' | 'shadowsEnabled' | 'bloomEnabled' | 'atmosphericEnabled'
> {
  return quality === 'high'
    ? { graphicsQuality: 'high', shadowsEnabled: false, bloomEnabled: true, atmosphericEnabled: true }
    : { graphicsQuality: 'low', shadowsEnabled: false, bloomEnabled: false, atmosphericEnabled: false };
}

const DEFAULT_TAVERN: TavernState = {
  level: 1,
  keeperId: null,
  reputation: 0,
  currentRoster: [],
  rerolledToday: false,
  factionBias: null,
  rumor: null,
  mercContracts: [],
  pendingPrompts: [],
  lastDayProcessed: 0,
  reputationLastTickWeek: 0,
  globalNegotiationDebuffUntilDay: null,
  veteranPool: [],
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
      if (!member || !member.isMercenary) return s;

      const cost = (gradeIndex(member.grade) + 1) * 150;
      if (s.gold < cost) return s;

      success = true;
      return {
        gold: s.gold - cost,
        roster: fullState.roster.map((m) =>
          m.id === memberId ? { ...m, isMercenary: false } : m,
        ),
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

      const def = FACILITY_DEFINITIONS[type];
      // Narrative gate: facility stays unbuildable until its unlock quest is completed.
      // Store-layer guard mirrors the UI gate so any caller is held to the same constraint.
      if (def.unlockQuestId) {
        const completed = (s as unknown as { completedMissions: string[] }).completedMissions ?? [];
        if (!completed.includes(def.unlockQuestId)) return s;
      }
      // Guild-level gate: facility stays unbuildable until the guild reaches the required level.
      if (def.requiredGuildLevel && s.guildLevel < def.requiredGuildLevel) return s;
      const cost = def.buildCost;
      if (cost > 0 && s.guildLevel < 2) return s;
      if (s.gold < cost) return s;

      // Generic material build-cost (e.g. tavern → 200 WOOD). Check + deduct inline so
      // wood and gold spend atomically in this single set() — mirrors the permit branch above.
      const materialCost = def.buildMaterialCost;
      let nextItems = fullState.inventory?.items;
      if (materialCost) {
        const items = fullState.inventory?.items ?? {};
        for (const [id, qty] of Object.entries(materialCost)) {
          if (qty && qty > 0 && (items[id as ItemID] ?? 0) < qty) return s; // insufficient → blocked
        }
        nextItems = { ...items };
        for (const [id, qty] of Object.entries(materialCost)) {
          if (qty && qty > 0) nextItems[id as ItemID] = (nextItems[id as ItemID] ?? 0) - qty;
        }
        for (const key of Object.keys(nextItems)) {
          if ((nextItems[key as ItemID] ?? 0) <= 0) delete nextItems[key as ItemID];
        }
      }

      const primary = s.facilities.find((f) => f.id === type && f.level === 0);
      const instanceId = primary ? type : `${type}-${Date.now()}`;
      newId = instanceId;
      const newEntry: GuildFacility = { id: instanceId, type, level: 1, assignedMemberIds: [], placedSlot: null, woodReserve: null };
      const facilities = primary
        ? s.facilities.map((f) => f.id === type ? newEntry : f)
        : [...s.facilities, newEntry];
      if (materialCost) {
        return {
          gold: s.gold - cost,
          facilities,
          inventory: { ...fullState.inventory, items: nextItems },
        } as unknown as Partial<GuildSlice>;
      }
      return { gold: s.gold - cost, facilities };
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

  skipMemberRecovery: (memberId) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null; gameTime: number };
      const members = fullState.founder ? [fullState.founder, ...fullState.roster] : fullState.roster;
      const { beds, rows } = resolveInjuryQueue(members, s.facilities);
      if (beds === 0) return s; // no infirmary built → skip unavailable

      // Day gate is guild-wide; the flag lives on the primary infirmary (always built first).
      const primary = s.facilities.find((f) => f.id === 'infirmary');
      if (!primary) return s;
      const currentDay = Math.floor(fullState.gameTime / MS_PER_GAME_DAY);
      if (primary.lastSkipDay === currentDay) return s; // already used this game-day

      const row = rows.find((r) => r.member.id === memberId);
      if (!row || row.remainingMs > SKIP_THRESHOLD_MS) return s; // not injured / too far out

      success = true;
      // Same reset as applyInjuryRecovery's recovered path.
      const clearInjury = (m: Member): Member => ({
        ...m,
        status: 'idle',
        injuredAt: null,
        baseRecoveryMs: null,
        injuredUntil: null,
        recoveryProgress: 0,
      });
      const facilities = s.facilities.map((f) =>
        f.id === 'infirmary' ? { ...f, lastSkipDay: currentDay } : f,
      );
      if (fullState.founder?.id === memberId) {
        return { facilities, founder: clearInjury(fullState.founder) } as unknown as Partial<GuildSlice>;
      }
      return {
        facilities,
        roster: fullState.roster.map((m) => (m.id === memberId ? clearInjury(m) : m)),
      } as unknown as Partial<GuildSlice>;
    });
    return success;
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
            // AC XP for any healing-syringe tier, split across assigned alchemists
            const SYRINGE_IDS = new Set(['HEALING_SYRINGE', 'HEALING_SYRINGE_2', 'HEALING_SYRINGE_3']);
            if (SYRINGE_IDS.has(job.outputItemId) && assignedIds.length > 0) {
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

  startSkillTraining: (memberId, skillId, facilityId) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null; inventory: InventoryState };
      const member = fullState.founder?.id === memberId
        ? fullState.founder
        : fullState.roster.find((m) => m.id === memberId);
      if (!member) return s;
      if (member.status !== 'idle') return s;
      if (!member.skill || member.skill.id !== skillId) return s;

      const facility = s.facilities.find((f) => f.id === facilityId && f.type === 'training-yard');
      if (!facility || facility.level === 0) return s;

      const maxRank = MAX_RANK_BY_FACILITY_LEVEL[facility.level] ?? 2;
      const currentRank = member.skillRanks?.[skillId]?.rank ?? 1;
      const targetRank = currentRank + 1;
      if (targetRank > maxRank || targetRank > 5) return s;

      // Slot availability check
      const maxSlots = FACILITY_DEFINITIONS['training-yard'].maxSlots[facility.level - 1];
      if ((facility.trainingQueue?.length ?? 0) >= maxSlots) return s;

      const rankCost = RANK_COSTS[targetRank];
      if (!rankCost) return s;
      if (s.gold < rankCost.gold) return s;

      // Validate material cost
      const inv = fullState.inventory;
      if (rankCost.material && rankCost.quantity > 0) {
        const have = (inv.items[rankCost.material] ?? 0);
        if (have < rankCost.quantity) return s;
      }

      // Deduct gold
      let newGold = s.gold - rankCost.gold;

      // Deduct material
      let newItems = inv.items;
      if (rankCost.material && rankCost.quantity > 0) {
        newItems = { ...inv.items };
        newItems[rankCost.material] = (newItems[rankCost.material] ?? 0) - rankCost.quantity;
        if ((newItems[rankCost.material] ?? 0) <= 0) delete newItems[rankCost.material];
      }

      const slot = {
        memberId,
        skillId,
        targetRank,
        goldPaid: rankCost.gold,
        materialPaid: rankCost.material !== null && rankCost.quantity > 0,
      };

      const updatedFacilities = s.facilities.map((f) =>
        f.id === facilityId
          ? {
              ...f,
              trainingQueue: [...(f.trainingQueue ?? []), slot],
              assignedMemberIds: [...f.assignedMemberIds, memberId],
            }
          : f,
      );

      const updateMember = (m: Member): Member =>
        m.id === memberId ? { ...m, status: 'training' as const } : m;

      success = true;
      const patch: Partial<GuildSlice> = {
        gold: newGold,
        facilities: updatedFacilities,
        inventory: { ...inv, items: newItems },
      };

      if (fullState.founder?.id === memberId) {
        return { ...patch, founder: updateMember(fullState.founder) } as unknown as Partial<GuildSlice>;
      }
      return {
        ...patch,
        roster: fullState.roster.map(updateMember),
      } as unknown as Partial<GuildSlice>;
    });
    return success;
  },

  cancelSkillTraining: (memberId, facilityId) => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      const facility = s.facilities.find((f) => f.id === facilityId && f.type === 'training-yard');
      if (!facility) return s;
      const slot = facility.trainingQueue?.find((sl) => sl.memberId === memberId);
      if (!slot) return s;

      const updatedFacilities = s.facilities.map((f) =>
        f.id === facilityId
          ? {
              ...f,
              trainingQueue: (f.trainingQueue ?? []).filter((sl) => sl.memberId !== memberId),
              assignedMemberIds: f.assignedMemberIds.filter((id) => id !== memberId),
            }
          : f,
      );

      const updateMember = (m: Member): Member =>
        m.id === memberId ? { ...m, status: 'idle' as const } : m;

      success = true;
      if (fullState.founder?.id === memberId) {
        return {
          facilities: updatedFacilities,
          founder: updateMember(fullState.founder),
        } as unknown as Partial<GuildSlice>;
      }
      return {
        facilities: updatedFacilities,
        roster: fullState.roster.map(updateMember),
      } as unknown as Partial<GuildSlice>;
    });
    return success;
  },

  applySkillTrainingResults: (results) => {
    if (results.length === 0) return;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };

      // Collect which members completed rank-up (for facility cleanup)
      const completedMemberIds = new Set<string>(
        results.filter((r) => r.rankReached !== null).map((r) => r.memberId),
      );

      const updateMember = (m: Member): Member => {
        const result = results.find((r) => r.memberId === m.id);
        if (!result) return m;

        const currentEntry = m.skillRanks?.[result.skillId];
        if (result.rankReached !== null) {
          // Rank-up completed
          return {
            ...m,
            status: 'idle' as const,
            skillRanks: {
              ...m.skillRanks,
              [result.skillId]: { rank: result.rankReached, progress: 0 },
            },
          };
        }
        // Still in progress — advance progress, clamp below 1.0 (not complete yet)
        const currentProgress = currentEntry?.progress ?? 0;
        const newProgress = Math.min(0.999, currentProgress + result.progressDelta);
        return {
          ...m,
          skillRanks: {
            ...m.skillRanks,
            [result.skillId]: {
              rank: currentEntry?.rank ?? 1,
              progress: newProgress,
            },
          },
        };
      };

      // Remove completed members from their training queue + assignedMemberIds
      const updatedFacilities = s.facilities.map((f) => {
        if (f.type !== 'training-yard' || !completedMemberIds.size) return f;
        const removedAny = (f.trainingQueue ?? []).some((sl) => completedMemberIds.has(sl.memberId));
        if (!removedAny) return f;
        return {
          ...f,
          trainingQueue: (f.trainingQueue ?? []).filter((sl) => !completedMemberIds.has(sl.memberId)),
          assignedMemberIds: f.assignedMemberIds.filter((id) => !completedMemberIds.has(id)),
        };
      });

      return {
        facilities: updatedFacilities,
        roster: fullState.roster.map(updateMember),
        ...(fullState.founder ? { founder: updateMember(fullState.founder) } : {}),
      } as unknown as Partial<GuildSlice>;
    });
  },

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

  tickTavernDay: (currentDay) => {
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      // AD5: stable seed per-save; pre-tutorial returns empty roster, no crash.
      if (!fullState.founder) return s;
      // Tutorial: never regenerate over the scripted guaranteed recruit — a day
      // boundary or offline catch-up must not wipe the visitor the player must recruit.
      if (s.tavern.currentRoster.some((v) => v.guaranteedRecruit)) return s;
      if (s.tavern.lastDayProcessed === currentDay && s.tavern.currentRoster.length > 0) return s;

      const tavernFacility = s.facilities.find((f) => f.type === 'tavern');
      // If tavern not built (level 0), skip — no spawn until at least Lv1.
      if (!tavernFacility || tavernFacility.level === 0) {
        return {
          tavern: { ...s.tavern, lastDayProcessed: currentDay, currentRoster: [], rerolledToday: false },
        };
      }

      const level = Math.min(3, Math.max(1, tavernFacility.level)) as TavernLevel;
      const keeperIds = tavernFacility.assignedMemberIds;
      const memberLookup = (id: string): Member | undefined => {
        if (fullState.founder?.id === id) return fullState.founder;
        return fullState.roster.find((m) => m.id === id);
      };
      const keeperStats = getEffectiveKeeperStats(keeperIds, memberLookup);

      const saveSlotId = fullState.founder.id ?? 'pre-tutorial';
      const seed = dailyTavernSeed(saveSlotId, currentDay);
      const roster: TavernVisitor[] = generateTavernRoster({
        level,
        keeperStats,
        daySeed: seed,
        spawnedDay: currentDay,
      });

      // Passive Tavern Reputation recovery: every 7 game-days, +1 (capped at +5).
      let reputation = s.tavern.reputation;
      let reputationLastTickWeek = s.tavern.reputationLastTickWeek;
      const weeksElapsed = Math.floor((currentDay - reputationLastTickWeek) / 7);
      if (weeksElapsed > 0) {
        reputation = Math.min(5, reputation + weeksElapsed);
        reputationLastTickWeek = reputationLastTickWeek + weeksElapsed * 7;
      }

      // Phase 04 (AD10): 5%/day per-veteran chance to re-appear in roster, max
      // 1 bonus visitor per day. Uses a derived sub-seed so reload-determinism
      // is preserved (same daySeed → same veteran roll).
      const baseTavern: TavernState = {
        ...s.tavern,
        currentRoster: roster,
        rerolledToday: false,
        lastDayProcessed: currentDay,
        reputation,
        reputationLastTickWeek,
      };
      const tavern = maybeAppendVeteranVisitor(baseTavern, seed, currentDay);
      // Recompute derivedDemand for the veteran (mood/rep may have shifted).
      if (tavern.currentRoster.length > roster.length) {
        const last = tavern.currentRoster[tavern.currentRoster.length - 1];
        last.derivedDemand = targetDemand(last);
      }

      return { tavern };
    });
  },

  spawnTutorialRecruit: () =>
    set((s) => {
      // Idempotent: the step gate also guards, but never double-add the scripted visitor.
      if (s.tavern.currentRoster.some((v) => v.id === TUTORIAL_RECRUIT_VISITOR.id)) return s;
      const visitor: TavernVisitor = { ...TUTORIAL_RECRUIT_VISITOR, spawnedDay: s.tavern.lastDayProcessed };
      visitor.derivedDemand = targetDemand(visitor);
      return { tavern: { ...s.tavern, currentRoster: [visitor] } };
    }),

  rerollTavernRoster: () => {
    let success = false;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      if (!fullState.founder) return s;
      if (s.tavern.rerolledToday) return s;

      const tavernFacility = s.facilities.find((f) => f.type === 'tavern');
      if (!tavernFacility || tavernFacility.level === 0) return s;

      const level = Math.min(3, Math.max(1, tavernFacility.level)) as TavernLevel;
      const cost = 100 * level;
      if (s.gold < cost) return s;

      const keeperIds = tavernFacility.assignedMemberIds;
      const memberLookup = (id: string): Member | undefined => {
        if (fullState.founder?.id === id) return fullState.founder;
        return fullState.roster.find((m) => m.id === id);
      };
      const keeperStats = getEffectiveKeeperStats(keeperIds, memberLookup);

      const saveSlotId = fullState.founder.id ?? 'pre-tutorial';
      const baseSeed = dailyTavernSeed(saveSlotId, s.tavern.lastDayProcessed);
      const altSeed = rerollSeedForDay(baseSeed);
      const roster: TavernVisitor[] = generateTavernRoster({
        level,
        keeperStats,
        daySeed: altSeed,
        spawnedDay: s.tavern.lastDayProcessed,
      });

      success = true;
      return {
        gold: s.gold - cost,
        tavern: {
          ...s.tavern,
          currentRoster: roster,
          rerolledToday: true,
        },
      };
    });
    return success;
  },

  // ── Phase 04: Merc lifecycle ─────────────────────────────────────────────

  hireMerc: (visitorId, mercFeeMultiplier = 1.0) => {
    let success = false;
    set((s) => {
      const visitor = s.tavern.currentRoster.find((v) => v.id === visitorId);
      if (!visitor) return s;
      if (s.tavern.mercContracts.length >= concurrentMercCap(s.tavern.level)) return s;

      const cost = hireMercCost(visitor, mercFeeMultiplier);
      if (s.gold < cost) return s;

      const contract = makeMercContract(visitor, cost, s.tavern.lastDayProcessed);
      success = true;
      return {
        gold: s.gold - cost,
        tavern: {
          ...s.tavern,
          currentRoster: s.tavern.currentRoster.filter((v) => v.id !== visitorId),
          mercContracts: [...s.tavern.mercContracts, contract],
        },
      };
    });
    return success;
  },

  adjustTavernRep: (delta) => {
    set((s) => ({
      tavern: { ...s.tavern, reputation: clampRep(s.tavern.reputation + delta) },
    }));
  },

  releaseMerc: (contractId) => {
    set((s) => ({
      tavern: {
        ...s.tavern,
        mercContracts: s.tavern.mercContracts.filter((c) => c.id !== contractId),
      },
    }));
  },

  markMercsOnQuest: (contractIds, missionId) => {
    if (contractIds.length === 0) return;
    set((s) => ({
      tavern: {
        ...s.tavern,
        mercContracts: s.tavern.mercContracts.map((c) =>
          contractIds.includes(c.id)
            ? { ...c, status: 'on-quest' as const, questId: missionId }
            : c,
        ),
      },
    }));
  },

  applyMercQuestResult: (contractId, outcome, currentDay) => {
    set((s) => {
      const patch = outcome.defeated
        ? applyMercDeath(s.tavern, contractId)
        : applyMercSurvival(s.tavern, contractId, outcome, currentDay);
      if (Object.keys(patch).length === 0) return s;
      return { tavern: { ...s.tavern, ...patch } };
    });
  },

  // ── Phase 05: Audition / re-invite ─────────────────────────────────────────

  acceptCounterOffer: (visitorId) => {
    return get().hireMerc(visitorId, 1.2);
  },

  executeReinvite: (contractId, accept) => {
    let outcome: NegotiationResult | null = null;
    set((s) => {
      const fullState = s as GuildSlice & { roster: Member[]; founder: Member | null };
      const prompt = (s.tavern.pendingPrompts ?? []).find(
        (p) => p.contractId === contractId && p.kind === 'reinvite',
      );
      if (!prompt) return s;

      // Always strip the prompt — accept or decline both consume it (one-shot).
      const remainingPrompts = s.tavern.pendingPrompts.filter(
        (p) => p.contractId !== contractId,
      );

      if (!accept) {
        return { tavern: { ...s.tavern, pendingPrompts: remainingPrompts } };
      }

      // Resolve best-keeper for the roll (AD13). Falls back to founder if no
      // tavern keepers assigned — prevents the reinvite from dead-ending when
      // the player has unstaffed the tavern.
      const tavernFacility = s.facilities.find((f) => f.type === 'tavern');
      const keeperIds = tavernFacility?.assignedMemberIds ?? [];
      const memberLookup = (id: string): Member | undefined => {
        if (fullState.founder?.id === id) return fullState.founder;
        return fullState.roster.find((m) => m.id === id);
      };
      const keepers = keeperIds.map(memberLookup).filter((m): m is Member => Boolean(m));
      const negotiator: Member | null =
        (keepers.length > 0
          ? keepers.reduce((best, k) =>
              keeperNegotiation(k) > keeperNegotiation(best) ? k : best,
            )
          : null) ?? fullState.founder;
      if (!negotiator) {
        return { tavern: { ...s.tavern, pendingPrompts: remainingPrompts } };
      }

      const visitor = prompt.visitorSnapshot;
      const snapshot: TavernGameSnapshot = {
        gold: s.gold,
        guildLevel: s.guildLevel,
        tavernLevel: s.tavern.level,
        tavernReputation: s.tavern.reputation,
        globalNegotiationDebuffUntilDay: s.tavern.globalNegotiationDebuffUntilDay,
        currentDay: s.tavern.lastDayProcessed,
      };
      const mods = buildModifierBundle(negotiator, visitor, snapshot, { reinvite: true });
      const seed = attemptSeed(
        hashSeed('reinvite', s.tavern.lastDayProcessed),
        contractId,
        (visitor.attemptHistory?.length ?? 0) + 1,
      );
      outcome = rollNegotiation(negotiator, visitor, mods, seed);

      // Locate the veteran entry left behind by phase-04 survival promotion.
      const veteranPool = s.tavern.veteranPool ?? [];
      const veteranIdx = veteranPool.findIndex((v) => v.contractId === contractId);

      if (outcome.outcome.kind === 'success') {
        // Reconstruct a synthetic contract for promotion — visitorSnapshot
        // is identical so member fidelity (stats/civ/archetype/traits/rarity)
        // is preserved.
        const syntheticContract = {
          id: contractId,
          visitorSnapshot: visitor,
          hireCost: 0,
          hireDay: prompt.createdDay,
          questId: null,
          relationshipPoints:
            veteranIdx >= 0 ? veteranPool[veteranIdx].relationshipPoints : 0,
          status: 'completed' as const,
        };
        const newMember = promoteMercToMember(syntheticContract);
        const nextVeteranPool =
          veteranIdx >= 0
            ? veteranPool.filter((_, i) => i !== veteranIdx)
            : veteranPool;
        return {
          tavern: {
            ...s.tavern,
            pendingPrompts: remainingPrompts,
            veteranPool: nextVeteranPool,
            reputation: clampRep(s.tavern.reputation + REINVITE_SUCCESS_REP_BONUS),
          },
          roster: [...fullState.roster, newMember],
        } as unknown as Partial<GuildSlice>;
      }

      // Roll failed — visitor stays in veteranPool (phase-04 already placed them).
      return { tavern: { ...s.tavern, pendingPrompts: remainingPrompts } };
    });
    return outcome;
  },
});

/**
 * Helper hoisted from `tickTavernDay` — used by the phase-04 veteran reappear
 * path. Exposed at module scope so future callers (UI debug, tests) can reuse.
 *
 * AD10: max 1 bonus visitor per day; on a hit we splice the veteran out of
 * the pool and append a freshly-materialized visitor to the day's roster.
 */
export function maybeAppendVeteranVisitor(
  tavern: TavernState,
  daySeed: number,
  currentDay: number,
): TavernState {
  // Defensive: in-flight v24 saves predate the veteranPool field. Save-migrate
  // v24→v25 backfills it, but HMR or hand-edited stores may still hit this path
  // with an undefined pool.
  const pool = tavern.veteranPool ?? [];
  if (pool.length === 0) {
    return pool === tavern.veteranPool ? tavern : { ...tavern, veteranPool: [] };
  }
  const rng = mulberry32(daySeed ^ 0xfeedbeef);
  for (let i = 0; i < pool.length; i++) {
    if (rng() < 0.05) {
      const vet = pool[i];
      const visitor = materializeVisitorFromVeteran(vet, currentDay);
      const remainingPool = [...pool];
      remainingPool.splice(i, 1);
      return {
        ...tavern,
        currentRoster: [...tavern.currentRoster, visitor],
        veteranPool: remainingPool,
      };
    }
  }
  return { ...tavern, veteranPool: pool };
}
