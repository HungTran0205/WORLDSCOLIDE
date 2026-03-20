/**
 * Civilization passive logic for combat simulator.
 * Extracted to keep combat-simulator.ts under 200 lines.
 *
 * Design note: baseStats here are the already-civ-boosted creation stats.
 * Passive multipliers (e.g. LinhSon END +15%) stack on top of creation bonuses
 * (END +20%), giving effective 1.38x during combat. This is intentional —
 * creation bonuses are permanent identity markers, passives are combat-only buffs.
 */

import type { CombatEntity } from './combat-types';
import type { Stats } from '@/game/state/game-state';

export interface PassiveState {
  civId: string;
  stacks: number; // DeQuoc stacking counter
}

/** Create passive state for an entity based on civilization */
export function createPassiveState(civId: string): PassiveState {
  return { civId, stacks: 0 };
}

/** Apply permanent passive bonuses on entity init (ThienLu AGI) */
export function applyPassiveOnInit(entity: CombatEntity): void {
  if (!entity.passiveState || !entity.baseStats) return;

  if (entity.passiveState.civId === 'ThienLu') {
    entity.stats.AGI = Math.floor(entity.baseStats.AGI * 1.15);
  }
}

/** Apply conditional passive buffs each tick */
export function applyPassiveTick(entity: CombatEntity): void {
  if (!entity.passiveState || !entity.baseStats) return;
  const { civId, stacks } = entity.passiveState;

  // LinhSon — Son The: END/DEX +15% when HP > 50%
  if (civId === 'LinhSon') {
    if (entity.currentHp > entity.maxHp * 0.5) {
      entity.stats.END = Math.floor(entity.baseStats.END * 1.15);
      entity.stats.DEX = Math.floor(entity.baseStats.DEX * 1.15);
    } else {
      entity.stats.END = entity.baseStats.END;
      entity.stats.DEX = entity.baseStats.DEX;
    }
  }

  // DeQuoc — Dien The Chi Huy: CHA/INT +3% per stack
  if (civId === 'DeQuoc' && stacks > 0) {
    const mult = 1 + stacks * 0.03;
    entity.stats.CHA = Math.floor(entity.baseStats.CHA * mult);
    entity.stats.INT = Math.floor(entity.baseStats.INT * mult);
  }
}

/** Called when entity deals damage — tracks DeQuoc stacks */
export function onDamageDealt(passiveState: PassiveState): void {
  if (passiveState.civId === 'DeQuoc' && passiveState.stacks < 5) {
    passiveState.stacks++;
  }
}

/** Dodge roll for ThienLu entities (10% chance) */
export function rollPassiveDodge(civId: string | undefined): boolean {
  if (civId === 'ThienLu') {
    return Math.random() < 0.10;
  }
  return false;
}

/** Snapshot base stats before passive modifications */
export function snapshotBaseStats(stats: Stats): Stats {
  return { ...stats };
}
