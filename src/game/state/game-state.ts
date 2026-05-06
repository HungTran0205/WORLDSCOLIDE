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
}

export interface TavernState {
  lastRefreshTime: number; // Unix ms timestamp
  availableMercenaries: Member[];
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

export type TutorialStep =
  | 'char-creation'
  | 'world-board'
  | 'tutorial-quest-dispatch'
  | 'tutorial-quest-active'
  | 'tutorial-kael-rescue'
  | 'tutorial-reward'
  | 'build-logging-site'
  | 'assign-kael'
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
}
