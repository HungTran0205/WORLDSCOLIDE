/**
 * Tavern audition pipeline — Phase 05.
 *
 * Pure helpers for the post-quest merc → permanent member conversion path:
 *   - `rpDelta(inputs)`  — relationship-point change per spec §8.1
 *   - `isReinviteEligible(contract)` / `makeReinvitePrompt(...)`
 *   - `promoteMercToMember(contract)` — visitor snapshot → Member shape
 *
 * The re-invite roll itself is executed inside `guild-slice.executeReinvite`
 * (it needs store access for keeper selection + rep adjustment). This module
 * stays state-free so it can be unit-tested without a Zustand store.
 *
 * DEFERRED — Cautious trait gating: the trait id is preserved on the visitor
 * (and copied onto the promoted Member) but does NOT yet penalise the initial
 * negotiation, the merc lifecycle, or this audition. When the trait passive
 * system lands, hook the modifier into `buildModifierBundle` (in
 * `tavern-negotiation.ts`) and/or here at `isReinviteEligible`. See AD12 +
 * spec §10.
 */

import type {
  MercContract,
  Member,
  TavernPendingPrompt,
} from '@/game/state/game-state';
import { REINVITE_BONUS } from './tavern-negotiation';

/** Minimum RP required on a contract for the re-invite prompt to fire. Spec §8. */
export const RP_REINVITE_THRESHOLD = 25;

/** Tavern Reputation reward when an audition roll succeeds. Spec §8. */
export const REINVITE_SUCCESS_REP_BONUS = 2;

/** RP cap to prevent overflow when a merc completes multiple quests (spec §8). */
export const RP_CAP = 100;

/**
 * Inputs for spec §8.1 RP delta. All fields except `success`/`defeated` are
 * optional so older callers (phase-04 tests, simplified offline paths) still
 * resolve into the basic ±RP tier.
 */
export interface MercQuestRpInputs {
  /** Quest success (mission outcome !== 'full-wipe'). */
  success: boolean;
  /** Merc HP=0 at combat end (in combatResult.injured OR absent from survivors). */
  defeated: boolean;
  /** Total damage the merc took during the fight. 0 = pristine performance → +30. */
  mercDamage?: number;
  /** `solo-carry` = all non-merc allies wiped but merc survived (success path). */
  mercAssisted?: 'solo-carry' | 'with-members';
  /** A non-merc party member died during the quest (penalty on failure tier). */
  memberDied?: boolean;
}

/**
 * Spec §8.1 — RP earned/lost by one merc from one quest.
 * AD12: on defeat we write 0 (NOT -Infinity) so JSON.stringify is safe.
 */
export function rpDelta(inputs: MercQuestRpInputs): number {
  if (inputs.defeated) return 0;
  if (inputs.success) {
    if (inputs.mercDamage !== undefined && inputs.mercDamage === 0) return 30;
    if (inputs.mercAssisted === 'solo-carry') return 25;
    return 20;
  }
  // Failure tier (survived).
  if (inputs.memberDied) return -20;
  return -10;
}

/** Apply RP_CAP after summing prior + delta. Symmetric clamp to [-RP_CAP, RP_CAP]. */
export function clampRP(value: number): number {
  return Math.max(-RP_CAP, Math.min(RP_CAP, value));
}

/** True if the contract's final RP qualifies for a re-invite prompt (success only). */
export function isReinviteEligible(contract: MercContract): boolean {
  return contract.relationshipPoints >= RP_REINVITE_THRESHOLD;
}

/** Build a queued re-invite prompt for the pending-prompts pile. */
export function makeReinvitePrompt(
  contract: MercContract,
  currentDay: number,
): TavernPendingPrompt {
  return {
    kind: 'reinvite',
    contractId: contract.id,
    visitorSnapshot: contract.visitorSnapshot,
    bonusModifier: REINVITE_BONUS,
    createdDay: currentDay,
  };
}

/**
 * Convert a merc contract into a permanent guild Member (rank='MEMBER').
 * ALL visitorSnapshot fields propagate (stats, civ, archetype, traits,
 * rarity, level) so the promoted member is indistinguishable from a
 * tavern-recruited visitor of the same provenance.
 */
export function promoteMercToMember(contract: MercContract, now: number = Date.now()): Member {
  const v = contract.visitorSnapshot;
  return {
    id: `mem-${now}-${contract.id.slice(-6)}`,
    name: v.name,
    level: v.level,
    exp: 0,
    stats: { ...v.stats },
    unallocatedPoints: 0,
    skill: null,
    status: 'idle',
    injuredUntil: null,
    civilization: v.civilization,
    archetype: v.archetype,
    gender: v.gender,
    isFounder: false,
    rank: 'MEMBER',
    missionsCompleted: 0,
    rarity: v.rarity,
    traits: [...v.traits],
    equipment: null,
    syringeLoadout: null,
  };
}
