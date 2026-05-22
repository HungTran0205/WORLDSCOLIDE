/**
 * Zustand slice for combat arena state — manages scene, phase, formation,
 * entity snapshots, speed control, and combat results.
 * Engine instance lives outside the store (in a React ref).
 */

import type { StateCreator } from 'zustand';
import type { ArenaPhase, Formation } from '@/game/systems/combat-arena-types';
import type { CombatResult, CombatEvent } from '@/game/systems/combat-types';
import type { GameScene } from '@/game/state/game-state';

export interface ArenaEntitySnapshot {
  id: string;
  name: string;
  isAlly: boolean;
  maxHp: number;
  currentHp: number;
  /** y is optional — pre-phase 05 snapshots and flat-stage entities omit it.
   *  Render layers (sprite, shadow, AOE) read `y ?? 0`. */
  position: { x: number; y?: number; z: number };
  animState: string;
  facingRight: boolean;
  skillCooldownUntil: number;
  statusEffects: { type: string; ticksRemaining: number }[];
  skillName?: string;
  skillId?: string;
  archetype?: string;
  civilization?: string;
  gender?: 'M' | 'F';
  /** Ally identity mask id used by the R3F combat overlay */
  maskSpriteId?: string;
  spriteId?: string;
  /** Flying enemy — sprite renders elevated above ground */
  flying?: boolean;
  /** ATB timeline fields */
  nextAttackAt: number;
  attackIntervalMs: number;
  isBoss?: boolean;
  attackMoveState?: string;
}

export interface CombatArenaSlice {
  // Scene
  gameScene: GameScene;

  // Arena state
  arenaPhase: ArenaPhase;
  /** Template id (MISSIONS lookup / display). Shared across same-template parties. */
  arenaMissionId: string | null;
  /** Unique active-mission instance id — which party's run is in the arena. */
  arenaInstanceId: string | null;
  formation: Formation;
  arenaEntities: ArenaEntitySnapshot[];
  arenaTime: number;
  speedMultiplier: number;
  recentEvents: CombatEvent[];
  arenaResult: CombatResult | null;

  /** Current wave progress for HUD display */
  waveState: { current: number; total: number };

  // Actions
  setGameScene: (scene: GameScene) => void;
  enterCombatPrep: (missionId: string, instanceId: string) => void;
  setFormationSlot: (slotIndex: number, memberId: string | null) => void;
  clearFormation: () => void;
  startBattle: () => void;
  syncArenaState: (entities: ArenaEntitySnapshot[], time: number, events: CombatEvent[]) => void;
  syncWaveState: (current: number, total: number) => void;
  setSpeedMultiplier: (speed: number) => void;
  endCombat: (result: CombatResult) => void;
  exitArena: () => void;
}

const EMPTY_FORMATION: Formation = [null, null, null, null, null, null];

export const createCombatArenaSlice: StateCreator<CombatArenaSlice> = (set) => ({
  gameScene: 'guild-hall',
  arenaPhase: 'idle',
  arenaMissionId: null,
  arenaInstanceId: null,
  formation: [...EMPTY_FORMATION],
  arenaEntities: [],
  arenaTime: 0,
  speedMultiplier: 1,
  recentEvents: [],
  arenaResult: null,
  waveState: { current: 0, total: 1 },

  setGameScene: (scene) => set({ gameScene: scene }),

  enterCombatPrep: (missionId, instanceId) => set({
    gameScene: 'combat-arena',
    arenaPhase: 'prep',
    arenaMissionId: missionId,
    arenaInstanceId: instanceId,
    formation: [...EMPTY_FORMATION],
    arenaEntities: [],
    arenaTime: 0,
    arenaResult: null,
    recentEvents: [],
  }),

  setFormationSlot: (slotIndex, memberId) => set((s) => {
    const next = [...s.formation];
    // Remove member from previous slot if already placed
    if (memberId) {
      const prevIdx = next.indexOf(memberId);
      if (prevIdx !== -1) next[prevIdx] = null;
    }
    next[slotIndex] = memberId;
    return { formation: next };
  }),

  clearFormation: () => set({ formation: [...EMPTY_FORMATION] }),

  startBattle: () => set({ arenaPhase: 'fighting' }),

  syncArenaState: (entities, time, events) => set({
    arenaEntities: entities,
    arenaTime: time,
    recentEvents: events,
  }),

  syncWaveState: (current, total) => set({ waveState: { current, total } }),

  setSpeedMultiplier: (speed) => set({ speedMultiplier: speed }),

  endCombat: (result) => set({
    arenaPhase: 'result',
    arenaResult: result,
  }),

  exitArena: () => set({
    gameScene: 'guild-hall',
    arenaPhase: 'idle',
    arenaMissionId: null,
    arenaInstanceId: null,
    formation: [...EMPTY_FORMATION],
    arenaEntities: [],
    arenaTime: 0,
    arenaResult: null,
    recentEvents: [],
    speedMultiplier: 1,
    waveState: { current: 0, total: 1 },
  }),
});
