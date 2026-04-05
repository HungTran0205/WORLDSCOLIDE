/**
 * Civilization passive logic for combat.
 * Extracted to keep combat-simulator.ts under 200 lines.
 *
 * Design note: baseStats here are the already-civ-boosted creation stats.
 * Passive multipliers (e.g. LinhSon END +30%) stack on top of creation bonuses
 * (END +20%), giving effective 1.56x during last-stand. This is intentional —
 * creation bonuses are permanent identity markers, passives are combat-only buffs.
 */

import type { CombatEntity } from './combat-types';
import type { Stats } from '@/game/state/game-state';

export interface PassiveState {
  civId: string;
  stacks: number;          // Hit counter: DeQuoc (0-2), ThienLu (0-14)
  shockReady: boolean;     // DeQuoc: next hit applies Shock to target
  teamBuffUntil: number;   // DeQuoc: timestamp (ms) until team buff expires
  critBonus: number;       // ThienLu: crit bonus rate (0.15 when active)
  critBonusUntil: number;  // ThienLu: crit bonus expiry timestamp (-1 = pending)
  cloneUntil: number;      // ThienLu: clone active until timestamp (-1 = pending)
}

/** Create passive state for an entity based on civilization */
export function createPassiveState(civId: string): PassiveState {
  return { civId, stacks: 0, shockReady: false, teamBuffUntil: 0, critBonus: 0, critBonusUntil: 0, cloneUntil: 0 };
}

/** Apply permanent passive bonuses on entity init — no init-time passives currently needed */
export function applyPassiveOnInit(entity: CombatEntity): void {
  if (!entity.passiveState || !entity.baseStats) return;
  // No init-time passives currently needed
  // (All passives are now combat-tick or on-hit triggered)
}

/** Apply conditional passive buffs each tick */
export function applyPassiveTick(entity: CombatEntity): void {
  if (!entity.passiveState || !entity.baseStats) return;
  const { civId } = entity.passiveState;

  // LinhSon — Son The: END +30% when HP <= 30% (last stand fantasy)
  if (civId === 'LinhSon') {
    // TODO: Add knockback resist when knockback mechanic exists
    // Son The should also grant knockback resistance at HP <= 30%
    if (entity.currentHp <= entity.maxHp * 0.3) {
      entity.stats.END = Math.floor(entity.baseStats.END * 1.3);
    } else {
      entity.stats.END = entity.baseStats.END;
    }
  }

  // DeQuoc — Dien The Chi Huy: 3 stacks → Shock + team buff
  // (Shock application handled in combat-engine via consumeShock after onDamageDealt)
  // (Team buff activation handled in combat-engine via activateTeamBuff)
}

/**
 * Called when entity deals damage — tracks DeQuoc and ThienLu stacks.
 * - DeQuoc: 3 stacks → shockReady = true, reset stacks
 * - ThienLu tier 1 at 5 hits → critBonus, tier 2 at 15 hits → clone
 *   Uses -1 as sentinel: "needs timestamp from caller via resolveThienLuTimers"
 */
export function onDamageDealt(passiveState: PassiveState): void {
  if (passiveState.civId === 'DeQuoc' && passiveState.stacks < 3) {
    passiveState.stacks++;
    if (passiveState.stacks >= 3) {
      passiveState.shockReady = true;
      passiveState.stacks = 0; // Reset after triggering
    }
  }

  if (passiveState.civId === 'ThienLu') {
    passiveState.stacks++;

    // Tier 1: 5 hits → crit bonus (+15% crit rate, 5s)
    if (passiveState.stacks === 5) {
      passiveState.critBonus = 0.15;
      passiveState.critBonusUntil = -1; // Caller resolves timestamp
    }

    // Tier 2: 15 hits → clone (5s, same damage as owner)
    if (passiveState.stacks >= 15) {
      passiveState.cloneUntil = -1; // Caller resolves timestamp
      passiveState.stacks = 0;      // Reset cycle
      passiveState.critBonus = 0;   // Crit bonus consumed by clone activation
    }
  }
}

/**
 * Check and consume Shock readiness.
 * Called by combat-engine AFTER a hit connects.
 * Returns true if Shock debuff should be applied to the target.
 */
export function consumeShock(passiveState: PassiveState): boolean {
  if (passiveState.shockReady) {
    passiveState.shockReady = false;
    return true;
  }
  return false;
}

/** Activate DeQuoc team buff for 5 seconds from currentTime. */
export function activateTeamBuff(passiveState: PassiveState, currentTime: number): void {
  passiveState.teamBuffUntil = currentTime + 5000;
}

/** Check if a DeQuoc entity's team buff is currently active. */
export function isTeamBuffActive(passiveState: PassiveState, currentTime: number): boolean {
  return passiveState.teamBuffUntil > currentTime;
}

/**
 * Called by combat-engine after onDamageDealt for ThienLu entities.
 * Resolves pending timer sentinels (-1) and handles expiry.
 * Returns which effects were newly activated this call.
 */
export function resolveThienLuTimers(
  passiveState: PassiveState,
  currentTime: number,
): { critActivated: boolean; cloneActivated: boolean } {
  let critActivated = false;
  let cloneActivated = false;

  if (passiveState.critBonusUntil === -1) {
    passiveState.critBonusUntil = currentTime + 5000;
    critActivated = true;
  }

  if (passiveState.cloneUntil === -1) {
    passiveState.cloneUntil = currentTime + 5000;
    cloneActivated = true;
  }

  // Expire crit bonus
  if (passiveState.critBonusUntil > 0 && currentTime > passiveState.critBonusUntil) {
    passiveState.critBonus = 0;
    passiveState.critBonusUntil = 0;
  }

  // Expire clone
  if (passiveState.cloneUntil > 0 && currentTime > passiveState.cloneUntil) {
    passiveState.cloneUntil = 0;
  }

  return { critActivated, cloneActivated };
}

/** Check if ThienLu clone is currently active. */
export function isCloneActive(passiveState: PassiveState, currentTime: number): boolean {
  return passiveState.cloneUntil > 0 && currentTime <= passiveState.cloneUntil;
}

/** Snapshot base stats before passive modifications */
export function snapshotBaseStats(stats: Stats): Stats {
  return { ...stats };
}
