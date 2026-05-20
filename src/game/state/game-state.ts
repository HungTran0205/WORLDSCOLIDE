/** Core type definitions for game state — all interfaces must be JSON-serializable */

import type { ItemID, InventoryCategory } from '@/game/data/items';
import type { EquipmentTemplateId } from '@/game/data/equipment-templates';
import type { TargetPriority } from '@/game/systems/combat-arena-types';
import type { CombatEntity } from '@/game/systems/combat-types';
import type {
  EquipmentSlotData,
  WorkshopTask,
  WorkshopBlueprint,
} from '@/game/data/workshop-types';
import type { TraitId } from '@/game/data/traits';
import type { Civilization, CivArchetype } from '@/game/data/civilization-config';

export interface EquipmentItem {
  /** Unique instance ID — uuid */
  id: string;
  templateId: EquipmentTemplateId;
  /** Current durability (0 = broken, gives no stat bonus) */
  durability: number;
  /** Workshop v2: rolled stat affixes (default [] for legacy/non-crafted items) */
  slots?: EquipmentSlotData[];
  /** Workshop v2: max affix slots (default 4 per spec §1.1.3.4) */
  maxSlots?: number;
}

export interface MemberEquipment {
  weapon?: EquipmentItem | null;
  armor?: EquipmentItem | null;
  headgear?: EquipmentItem | null;
}

export type StatKey = 'STR' | 'END' | 'INT' | 'DEX' | 'CHA' | 'LCK' | 'AGI';

export interface Stats {
  STR: number;
  END: number;
  INT: number;
  DEX: number;
  CHA: number;
  LCK: number;
  AGI: number;
}

export interface WoodcuttingSkill {
  level: number;         // 0–10
  xpAccumulated: number; // total wood harvested (acts as XP proxy)
}

export interface MiningSkill {
  level: number;         // 0–10
  xpAccumulated: number; // total stone mined (acts as XP proxy)
}

export interface AlchemySkill {
  level: number;         // 0–10
  xpAccumulated: number; // total syringes crafted (acts as XP proxy)
}

export interface CraftSkills {
  woodcutting: WoodcuttingSkill;
  mining: MiningSkill;
  alchemy: AlchemySkill;
}

export interface Skill {
  id: string;
  name: string;
  damageMultiplier: number;
  cooldownMs: number;
  autoEnabled: boolean;
  /** AOE telegraph radius (world units). Set only on skills that visualize a ground danger zone. */
  aoeRadius?: number;
  /** Telegraph shape; defaults to 'circle' when aoeRadius is set. */
  aoeShape?: import('@/game/systems/combat-types').AoeShape;
  /** Telegraph cast duration override in ms; defaults to engine ANIM_ATTACK_DURATION (600ms). MUST be ≥ 300ms. */
  aoeCastTimeMs?: number;
  /** Optional tint hex (e.g. '#ff5a5a' danger / '#5a9bff' beneficial). Defaults to red danger. */
  aoeColor?: string;
}

export type MemberStatus = 'idle' | 'on-mission' | 'injured' | 'training' | 'assigned';

export type MedicineCondition = 'start' | '80' | '50' | '30' | 'never';
export interface MedicineSlot { itemId: string | null; condition: MedicineCondition; }

export type FacilityType = 'tavern' | 'training-yard' | 'infirmary' | 'workshop' | 'logging-site' | 'stone-quarry' | 'alchemy-lab';

export interface SyringeLoadout {
  /** HP fraction (0–1) below which the syringe auto-fires in combat. e.g. 0.3 = 30% */
  autoUseThresholdPct: number;
}

export interface AlchemyCraftJob {
  id: string;
  recipeId: string;
  outputItemId: string;
  outputQuantity: number;
  remainingSeconds: number;
  totalSeconds: number;
}

export interface GuildFacility {
  /** Unique instance ID — equals type for the primary (first-built) instance. */
  id: string;
  type: FacilityType;
  /** 0 = locked/not built, 1–3 = active */
  level: number;
  assignedMemberIds: string[];
  /** Index into FACILITY_SLOTS (0–11). null = bought but not yet placed on map. */
  placedSlot: number | null;
  /** Wood remaining — null for non-harvesting facilities; 0–1000 for logging-site */
  woodReserve?: number | null;
  /** Active craft jobs queued at this alchemy lab */
  craftQueue?: AlchemyCraftJob[];
  /** Workshop v2: queued craft/enhance/repair tasks (workshop facilities only) */
  workshopQueue?: WorkshopTask[];
  /** Workshop v2: saved blueprint presets (workshop facilities only) */
  workshopBlueprints?: WorkshopBlueprint[];
}

/** Guild hierarchy ranks (promotable). MERCENARY is orthogonal — not in hierarchy. */
export type GuildRank = 'RECRUIT' | 'MEMBER' | 'VETERAN' | 'OFFICER' | 'COMMANDER';
export type MemberRank = GuildRank | 'MERCENARY';

export interface Member {
  id: string;
  name: string;
  level: number;
  exp: number;
  stats: Stats;
  unallocatedPoints: number;
  skill: Skill | null;
  status: MemberStatus;
  injuredUntil: number | null;
  civilization: string;
  archetype?: string;   // CivArchetype — maps to sprite folder (missing in old saves)
  gender?: 'M' | 'F';  // maps to sprite folder suffix (missing in old saves)
  isFounder: boolean;
  rank: MemberRank;
  missionsCompleted: number;
  craftSkills?: CraftSkills;
  /** Syringe auto-use config. null = no syringe equipped. */
  syringeLoadout?: SyringeLoadout | null;
  /** Gear currently equipped by this member */
  equipment?: MemberEquipment | null;
  /** Pre-loaded medicine slots for auto-use in combat (intent stored here; consumption is separate) */
  medicineSlots?: [MedicineSlot, MedicineSlot];
  /** Tavern rarity tier (1–5). v24 migration backfills legacy members to 1. */
  rarity: 1 | 2 | 3 | 4 | 5;
  /** Personality traits — optional; default [] in v24 migration. */
  traits?: TraitId[];
  /** Identity mask ID from MASK_POOL (optional; lazy hash-resolved if absent) */
  maskSpriteId?: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Tavern (v24)
// ──────────────────────────────────────────────────────────────────────────

export type AttemptOutcome = 'success' | 'counter' | 'soft-refuse' | 'hard-refuse' | 'insult';

export interface AttemptRecord {
  day: number;            // game day at attempt time
  margin: number;         // resolved negotiation margin
  outcome: AttemptOutcome;
}

export interface TavernVisitor {
  id: string;
  archetype: CivArchetype;
  civilization: Civilization;
  rarity: 1 | 2 | 3 | 4 | 5;
  level: number;
  stats: Stats;                          // talent stats
  derivedDemand: number;
  dailyMoodBias: number;                 // [-5, +5]
  traits: TraitId[];
  preferredGiftCategory: 'consumable' | 'material' | 'equipable';
  attemptHistory: AttemptRecord[];
  veteranTag: boolean;
  spawnedDay: number;
}

export type MercContractStatus = 'available' | 'on-quest' | 'completed' | 'defeated';

export interface MercContract {
  id: string;                            // contract id
  visitorSnapshot: TavernVisitor;        // frozen at hire time
  hireCost: number;
  hireDay: number;
  questId: string | null;
  relationshipPoints: number;
  status: MercContractStatus;
}

export type RumorTier = 'vague' | 'class' | 'specific';

export interface RumorEntry {
  forDay: number;                        // next-day reveal target
  tier: RumorTier;
  archetype?: CivArchetype;
  civilization?: Civilization;
}

export interface TavernPendingPrompt {
  kind: 'reinvite';
  contractId: string;
  visitorSnapshot: TavernVisitor;
  bonusModifier: number;                 // +25 for re-invite (AD reinviteBonus)
  createdDay: number;
}

/** Compact veteran-merc record for re-appearance pool. Cap 20, FIFO eviction. */
export interface VeteranMercSummary {
  /** Source contract id at time of survival (kept for de-dup). */
  contractId: string;
  /** Frozen visitor snapshot at hire time — used by materializeVisitorFromVeteran. */
  visitorSnapshot: TavernVisitor;
  /** Final RP at completion time. */
  relationshipPoints: number;
  /** Game-day when added to pool. */
  addedDay: number;
}

export interface TavernState {
  level: 1 | 2 | 3;                      // MVP cap Lv3 (Lv4-5 deferred)
  keeperId: string | null;
  reputation: number;                    // [-5, +5]
  currentRoster: TavernVisitor[];        // 3-5 visitors by level/buffs
  rerolledToday: boolean;
  factionBias: Civilization | null;      // DEFERRED — always null in MVP
  rumor: RumorEntry | null;
  mercContracts: MercContract[];         // active hired mercs
  pendingPrompts: TavernPendingPrompt[]; // queued re-invite prompts (AD7)
  lastDayProcessed: number;              // floor(gameTime / TICKS_PER_DAY) snapshot
  reputationLastTickWeek: number;        // passive recovery tracker (game-day)
  globalNegotiationDebuffUntilDay: number | null;  // 24h post-insult global debuff
  /** Phase 04: veteran-merc pool for 5%/day re-appear (cap 20, FIFO). */
  veteranPool: VeteranMercSummary[];
}

export type QuestTier = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

/** Phase of an active mission in the state machine */
export type MissionPhase = 'traveling' | 'arrived' | 'in-combat' | 'completed' | 'failed';

export interface Mission {
  id: string;
  name: string;
  tier: QuestTier;
  description?: string;
  zone?: string;
  durationMs: number;
  travelTimeMs: number;
  goldRewardMin: number;
  goldRewardMax: number;
  expReward: number;
  enemyIds: string[];
  /** Multi-wave definitions — if present, overrides enemyIds for arena combat */
  waves?: import('@/game/systems/combat-wave-manager').WaveDefinition[];
  requiredMembers: number;
  requiredLevel: number;
  chainId?: string;
  chainOrder?: number;
  prerequisiteId?: string;
  isBossGate?: boolean;
  /** Per-item conditional drops rolled on mission success */
  conditionalDrops?: Array<{ itemId: ItemID; chance: number; quantity: number }>;
}

export interface ActiveMission {
  missionId: string;
  memberIds: string[];
  /** Parallel list of merc contract ids participating in this mission (AD1).
   *  Mercs are adapted to Member-shape at quest dispatch via memberFromMercContract. */
  mercContractIds: string[];
  startTime: number;
  estimatedEndTime: number;
  phase: MissionPhase;
  arrivalTime: number | null;
  /** Team-level targeting strategy chosen in the combat panel formation phase */
  targetPriority: TargetPriority;
  /** Live combat snapshot autosaved every ~2s while phase === 'in-combat'.
   *  Cleared on completion. Used by mid-fight reload (D12) so close-tab
   *  doesn't re-roll combat from scratch. */
  combatSnapshot?: CombatEntity[];
  /** Engine clock (ms) when the snapshot was captured — needed to rebase
   *  per-entity timers when the snapshot is fed back into the simulator. */
  combatSnapshotTime?: number;
}

export type Rotation = 0 | 90 | 180 | 270;

export interface GridCell {
  x: number;
  z: number;
}

export type FurnitureCategory = 'core' | 'upgrade';

export type FurnitureType =
  // Core (1 per guild, upgradeable)
  | 'quest-board'
  | 'bar-counter'
  | 'alchemy-table'
  | 'workbench'
  | 'training-dummy'
  // Upgrade (purchasable, placeable multiple times)
  | 'reception-desk'
  | 'wine-barrel'
  | 'medical-bed'
  | 'storage-chest';

export interface PlacedFurniture {
  id: string;
  type: FurnitureType;
  level: number;
  position: GridCell;
  rotation: Rotation;
}

/** Preset floor tile colors for the build palette (texture auto-detected from hex) */
export const FLOOR_TILE_COLORS = [
  { id: 'gold', name: 'Oak Wood', hex: '#DAA520' },
  { id: 'wood-brown', name: 'Dark Wood', hex: '#8B4513' },
  { id: 'steel-blue', name: 'Blue Stone', hex: '#4682B4' },
  { id: 'slate', name: 'Slate', hex: '#708090' },
  { id: 'stone', name: 'Stone', hex: '#A0A0A0' },
  { id: 'crimson', name: 'Red Cement', hex: '#FF6347' },
  { id: 'forest', name: 'Green Cement', hex: '#2E8B57' },
  { id: 'ivory', name: 'White Cement', hex: '#FFFFF0' },
  { id: 'obsidian', name: 'Obsidian', hex: '#1C1C1C' },
  { id: 'royal-blue', name: 'Marble', hex: '#4169E1' },
] as const;

export type FloorTileColorId = typeof FLOOR_TILE_COLORS[number]['id'];

export interface FloorTile {
  x: number;
  z: number;
  color: string;
}

export interface GuildHall {
  level: number;
  floorTiles: FloorTile[];
  furniture: PlacedFurniture[];
}

export type GameScene = 'guild-hall' | 'combat-arena';

/**
 * Guided onboarding state machine (GDD §5 — "The First Tremor / Bear the Bear").
 * 14 ordered beats; order in TUTORIAL_STEPS must match this list so getNextStep walks it.
 * Legacy 8-id saves are remapped forward by save migration v25→v26.
 */
export type TutorialStep =
  | 'char-creation'
  | 'arrival-alarm'
  | 'open-quest-board'
  | 'accept-bear-quest'
  | 'assign-and-dispatch'
  | 'quest-travel'
  | 'moonbear-combat'
  | 'kael-rescue'
  | 'reward-splash'
  | 'build-logging-site'
  | 'assign-kael'
  | 'first-haul-reward'
  | 'build-tavern'
  | 'complete';

export interface InventoryState {
  items: Partial<Record<ItemID, number>>;
  /** Equipment item instances not currently equipped by any member */
  equipmentInventory?: EquipmentItem[];
  /** Per-category slot capacity overrides; absent in old saves → default 30 */
  categoryCapacity?: Partial<Record<InventoryCategory, number>>;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  autoSkillDefault: boolean;
  graphicsQuality: 'high' | 'low';
  shadowsEnabled: boolean;
  bloomEnabled: boolean;
  bloomThreshold: number;
  /** HD-2D atmospheric stack (post-FX + particles + per-room presets). Default
   *  true on high tier, false on low tier — see Phase 06 mobile degradation. */
  atmosphericEnabled: boolean;
}
