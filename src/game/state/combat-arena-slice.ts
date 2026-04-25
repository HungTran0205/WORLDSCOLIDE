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
  position: { x: number; z: number };
  animState: string;
  facingRight: boolean;
  skillCooldownUntil: number;
  statusEffects: { type: string; ticksRemaining: number }[];
  skillName?: string;
  skillId?: string;
  archetype?: string;
  civilization?: string;
  gender?: 'M' | 'F';
  spriteId?: string;
  /** Flying enemy — sprite renders elevated above ground */
  flying?: boolean;
  /** ATB timeline fields */
  nextAttackAt: number;
  attackIntervalMs: number;
  isBoss?: boolean;
  attackMoveState?: string;
  /** Manual mode: ally is waiting for player input */
  waitingForInput?: boolean;
  /** Manual mode: current manual target id for this ally */
  manualTargetId?: string | null;
}

export interface CombatArenaSlice {
  // Scene
  gameScene: GameScene;

  // Arena state
  arenaPhase: ArenaPhase;
  arenaMissionId: string | null;
  formation: Formation;
  arenaEntities: ArenaEntitySnapshot[];
  arenaTime: number;
  speedMultiplier: number;
  recentEvents: CombatEvent[];
  arenaResult: CombatResult | null;

  /** Current wave progress for HUD display */
  waveState: { current: number; total: number };

  /** Manual mode: which ally's turn is currently paused (null = auto mode or no pause) */
  activeAllyTurnId: string | null;

  // Actions
  setGameScene: (scene: GameScene) => void;
  enterCombatPrep: (missionId: string) => void;
  setFormationSlot: (slotIndex: number, memberId: string | null) => void;
  clearFormation: () => void;
  startBattle: () => void;
  syncArenaState: (entities: ArenaEntitySnapshot[], time: number, events: CombatEvent[]) => void;
  syncWaveState: (current: number, total: number) => void;
  setSpeedMultiplier: (speed: number) => void;
  setActiveAllyTurn: (id: string | null) => void;
  endCombat: (result: CombatResult) => void;
  exitArena: () => void;
}

const EMPTY_FORMATION: Formation = [null, null, null, null, null, null];

export const createCombatArenaSlice: StateCreator<CombatArenaSlice> = (set) => ({
  gameScene: 'guild-hall',
  arenaPhase: 'idle',
  arenaMissionId: null,
  formation: [...EMPTY_FORMATION],
  arenaEntities: [],
  arenaTime: 0,
  speedMultiplier: 1,
  recentEvents: [],
  arenaResult: null,
  waveState: { current: 0, total: 1 },
  activeAllyTurnId: null,

  setGameScene: (scene) => set({ gameScene: scene }),

  enterCombatPrep: (missionId) => set({
    gameScene: 'combat-arena',
    arenaPhase: 'prep',
    arenaMissionId: missionId,
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

  setActiveAllyTurn: (id) => set({ activeAllyTurnId: id }),

  endCombat: (result) => set({
    arenaPhase: 'result',
    arenaResult: result,
  }),

  exitArena: () => set({
    gameScene: 'guild-hall',
    arenaPhase: 'idle',
    arenaMissionId: null,
    formation: [...EMPTY_FORMATION],
    arenaEntities: [],
    arenaTime: 0,
    arenaResult: null,
    recentEvents: [],
    speedMultiplier: 1,
    waveState: { current: 0, total: 1 },
    activeAllyTurnId: null,
  }),
});
