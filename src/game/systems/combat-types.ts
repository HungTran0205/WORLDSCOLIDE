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
}

export interface ActiveEffect {
  type: 'poisoned' | 'stunned' | 'boosted';
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
  | { type: 'auto-attack'; attackerId: string; targetId: string; damage: number }
  | { type: 'skill-use'; attackerId: string; targetId: string; damage: number; skillName: string }
  | { type: 'effect-applied'; targetId: string; effect: string }
  | { type: 'effect-tick'; targetId: string; effect: string; damage: number }
  | { type: 'death'; entityId: string }
  | { type: 'dodge'; attackerId: string; targetId: string }
  | { type: 'heal'; healerId: string; targetId: string; amount: number }
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
