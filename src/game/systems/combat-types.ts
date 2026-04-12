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
  level: number;
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

  // Derived combat snapshot (set at entity creation)
  dodgeRate: number;
  blockRate: number;
  critDmg: number;
  hpRegenPerSec: number;

  // Spatial fields (used by real-time arena, absent in auto-resolve)
  position?: { x: number; z: number };
  targetId?: string | null;
  attackRange?: number;
  moveSpeed?: number;
  animState?: 'idle' | 'walking' | 'attacking' | 'skill' | 'hit' | 'dead';
  facingRight?: boolean;
  archetype?: string;
  gender?: 'M' | 'F';
  /** Enemy sprite folder name (e.g. 'slime') */
  spriteId?: string;
  /** Flying enemy — elevated above ground in arena */
  flying?: boolean;
  /** Boss enemy — rendered at larger scale */
  isBoss?: boolean;
}

export interface ActiveEffect {
  type: 'poisoned' | 'stunned' | 'boosted' | 'shocked';
  ticksRemaining: number;
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

export type CombatEvent =
  | { type: 'auto-attack'; attackerId: string; targetId: string; damage: number; isCrit?: boolean }
  | { type: 'skill-use'; attackerId: string; targetId: string; damage: number; skillName: string; isCrit?: boolean }
  | { type: 'effect-applied'; targetId: string; effect: string }
  | { type: 'effect-tick'; targetId: string; effect: string; damage: number }
  | { type: 'death'; entityId: string }
  | { type: 'dodge'; attackerId: string; targetId: string }
  | { type: 'block'; attackerId: string; targetId: string; reducedDamage: number }
  | { type: 'heal'; healerId: string; targetId: string; amount: number }
  | { type: 'wave-cleared'; waveIndex: number }
  | { type: 'victory' }
  | { type: 'wipe' };

export type CombatOutcome = 'victory' | 'partial-victory' | 'full-wipe';

export interface CombatResult {
  outcome: CombatOutcome;
  ticks: CombatTick[];
  survivors: string[];
  injured: string[];
  totalDamageDealt: number;
  durationMs: number;
}
