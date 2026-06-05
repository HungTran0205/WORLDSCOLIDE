import type { Stats, Skill } from '@/game/state/game-state';
import type { PassiveState } from './combat-passives';

export interface CombatEntity {
  id: string;
  name: string;
  isAlly: boolean;
  maxHp: number;
  currentHp: number;
  stats: Stats;
  skill: Skill | null;
  level?: number;
  attackIntervalMs: number;
  nextAttackAt: number;
  skillCooldownUntil: number;
  statusEffects: ActiveEffect[];
  abilities: EnemyAbility[];
  civilization?: string;
  passiveState?: PassiveState;
  baseStats?: Stats;

  // Temporary combat flags (set each tick by engine/simulator)
  _hasDeQuocBuff?: boolean;  // DeQuoc ally team buff: +5% crit/dmg
  _linhSonDefBuff?: number;  // active teamDefUp magnitude (0.20 base)
  _linhSonCritBuff?: number; // active teamCritUp magnitude (0.10 base)
  /** Resist rate (0–1) reducing debuff duration. Computed from INT+END. Enemies: 0. */
  statusResist?: number;

  // Gear bonuses (baked in at entity creation from member.equipment)
  /** Flat damage bonus from equipped weapon (0 if no weapon or durability=0) */
  gearFlatDamage?: number;
  /** Flat HP bonus from armor (already added to maxHp at init) */
  gearFlatHp?: number;
  /** Flat defense bonus from armor (used in damage receive calc) */
  gearFlatDefense?: number;

  // Syringe auto-use (allies only)
  /** HP fraction threshold below which syringe fires. undefined = no syringe equipped. */
  syringeThresholdPct?: number;
  /** How many syringes this entity loaded at combat start (consumed from inventory). */
  syringesLoaded?: number;

  // Derived combat snapshot (set at entity creation)
  dodgeRate: number;
  blockRate: number;
  critDmg: number;
  hpRegenPerSec: number;
  /** Gear accuracy — subtracts from target dodgeRate before the dodge roll. Enemies: 0. */
  accuracy: number;
  /** Remaining hit-shield charges. Each charge absorbs one incoming hit at 80% reduction. Enemies: 0. */
  shieldCharges: number;
  /** Charges at combat start — kept for UI display (pip count). Enemies: 0. */
  shieldChargesMax: number;

  // Spatial fields (used by real-time arena, absent in auto-resolve)
  // y is optional — entities on flat (y=0) stages omit it; entities placed
  // on raised platforms via stage spawn anchors carry y > 0. Auto-resolve
  // never reads y. Snapshot deserialization treats missing y as 0.
  position?: { x: number; y?: number; z: number };
  targetId?: string | null;
  attackRange?: number;
  moveSpeed?: number;
  animState?: 'idle' | 'walking' | 'attacking' | 'skill' | 'hit' | 'dead' | 'battle-idle' | 'blocking' | 'back';
  facingRight?: boolean;
  archetype?: string;
  gender?: 'M' | 'F';
  /** Ally identity mask propagated from Member for combat overlay rendering */
  maskSpriteId?: string;
  /** Enemy sprite folder name (e.g. 'slime') */
  spriteId?: string;
  /** Flying enemy — elevated above ground in arena */
  flying?: boolean;
  /** Boss enemy — rendered at larger scale */
  isBoss?: boolean;
}

export interface ActiveEffect {
  type: 'poisoned' | 'stunned' | 'boosted' | 'shocked'
      | 'slowed' | 'taunted' | 'teamDefUp' | 'teamCritUp';
  ticksRemaining: number;
  /** Magnitude override — used by teamDefUp (0.20) and teamCritUp (0.10). */
  magnitude?: number;
}

export type EnemyAbility =
  | { type: 'poison-attack'; chance: number }
  | { type: 'stun-attack'; chance: number }
  | { type: 'enrage'; chance: number }
  | { type: 'heal-ally'; chance: number };

export interface CombatTick {
  time: number;
  events: CombatEvent[];
}

/** AOE telegraph shape — shared between Skill schema, engine event, and React layer. */
export type AoeShape = 'circle' | 'cone' | 'rect';

export type CombatEvent =
  | { type: 'auto-attack'; attackerId: string; targetId: string; damage: number; isCrit?: boolean }
  | { type: 'skill-use'; attackerId: string; targetId: string; damage: number; skillName: string; isCrit?: boolean }
  | { type: 'effect-applied'; targetId: string; effect: string }
  | { type: 'effect-tick'; targetId: string; effect: string; damage: number }
  | { type: 'death'; entityId: string }
  | { type: 'dodge'; attackerId: string; targetId: string }
  | { type: 'block'; attackerId: string; targetId: string; reducedDamage: number }
  | { type: 'shield-break'; targetId: string; chargesRemaining: number }
  | { type: 'heal'; healerId: string; targetId: string; amount: number }
  | { type: 'syringe-used'; entityId: string; healAmount: number }
  | { type: 'wave-cleared'; waveIndex: number }
  | { type: 'victory' }
  | { type: 'ally-turn-start'; entityId: string }
  | { type: 'wipe' }
  | { type: 'skill-buff-applied'; casterId: string; buffEffect: string; scope: 'self' | 'team'; durationMs: number }
  | { type: 'skill-debuff-applied'; casterId: string; targetId: string; effect: string; durationMs: number }
  | {
      type: 'aoe-telegraph';
      /** Casting entity id (deduplication / debug source). */
      attackerId: string;
      /** Skill id that triggered the telegraph. */
      skillId: string;
      /** World position of the AOE center [x, y, z]; y is ground level (0). */
      position: [number, number, number];
      /** AOE radius in world units. */
      radius: number;
      /** Shape variant — selects which decal texture is used. */
      shape: AoeShape;
      /** Total telegraph lifetime in ms (spawn → unmount). */
      durationMs: number;
      /** Hex tint passed to the React layer. */
      color: string;
    };

export type CombatOutcome = 'victory' | 'partial-victory' | 'full-wipe';

export interface CombatResult {
  outcome: CombatOutcome;
  ticks: CombatTick[];
  survivors: string[];
  injured: string[];
  totalDamageDealt: number;
  durationMs: number;
}
