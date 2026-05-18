/**
 * Tavern merc-lifecycle helpers — Phase 04.
 *
 * Pure state-shape transformers. The store actions (`applyMercQuestResult`,
 * `markMercsOnQuest`) call these to compute the next TavernState slice.
 *
 * Mercs do NOT earn EXP, do NOT count missionsCompleted, do NOT enter the
 * infirmary. Defeated mercs cost the guild Tavern Reputation (-1) and the
 * contract is dropped. Survivors of a successful quest are promoted into the
 * `veteranPool` for future re-appearance (AD10, max 1/day re-spawn).
 *
 * AD12: on death, RP is left as the contract's prior value (NOT -Infinity)
 * and the contract is removed immediately to avoid JSON.stringify(-Infinity)
 * → null → NaN-on-reload corruption.
 */

import type {
  MercContract,
  TavernState,
  TavernVisitor,
  VeteranMercSummary,
} from '@/game/state/game-state';
import {
  clampRP,
  isReinviteEligible,
  makeReinvitePrompt,
  rpDelta,
  type MercQuestRpInputs,
} from './tavern-audition';

/** Veteran-pool cap (FIFO eviction past this size). */
export const VETERAN_POOL_CAP = 20;

/** Tavern-Reputation hard bounds (spec §9). */
export const TAVERN_REP_MIN = -5;
export const TAVERN_REP_MAX = 5;

/**
 * RP delta accrued by a single merc from one quest.
 * Phase 05 expands the basic ±RP into the spec §8.1 table — see
 * `rpDelta` in `tavern-audition.ts`. Legacy callers passing only
 * `{ success, defeated }` still land on the failure / +20 tiers.
 */
export type MercQuestOutcome = MercQuestRpInputs;

/** Back-compat wrapper. Delegates to `rpDelta` (spec §8.1). */
export function accrueRPFromQuest(outcome: MercQuestOutcome): number {
  return rpDelta(outcome);
}

/**
 * Concurrent merc cap by tavern level (spec §7.5).
 * MVP only Lv1-3; Lv4-5 entries kept for spec parity but never reached.
 */
export function concurrentMercCap(level: 1 | 2 | 3 | 4 | 5): number {
  return [3, 3, 4, 4, 5][level - 1];
}

/** Apply merc death: drop contract, -1 Tavern Rep (clamped), NO infirmary entry. */
export function applyMercDeath(tavern: TavernState, contractId: string): Partial<TavernState> {
  return {
    mercContracts: tavern.mercContracts.filter((c) => c.id !== contractId),
    reputation: clampRep(tavern.reputation - 1),
  };
}

/**
 * Apply merc survival: drop contract; on quest success, promote into veteranPool
 * (FIFO-evicted past VETERAN_POOL_CAP). Failure-but-survived = drop only.
 *
 * Phase 05: if the accumulated RP on the surviving contract crosses
 * `RP_REINVITE_THRESHOLD` AND the quest succeeded, append a re-invite prompt
 * to `pendingPrompts` (AD7 — persisted, consumed by Tavern panel UI).
 */
export function applyMercSurvival(
  tavern: TavernState,
  contractId: string,
  outcome: MercQuestOutcome,
  currentDay: number,
): Partial<TavernState> {
  const contract = tavern.mercContracts.find((c) => c.id === contractId);
  if (!contract) return {};

  const rpGain = rpDelta(outcome);
  const finalRP = clampRP(contract.relationshipPoints + rpGain);
  const remainingContracts = tavern.mercContracts.filter((c) => c.id !== contractId);

  if (!outcome.success) {
    return { mercContracts: remainingContracts };
  }

  const promotedContract: MercContract = { ...contract, relationshipPoints: finalRP };
  const vet: VeteranMercSummary = {
    contractId: contract.id,
    visitorSnapshot: contract.visitorSnapshot,
    relationshipPoints: finalRP,
    addedDay: currentDay,
  };
  // Defensive: tolerate undefined for in-flight v24 saves predating the field.
  const pool = [...(tavern.veteranPool ?? []), vet];
  while (pool.length > VETERAN_POOL_CAP) pool.shift();

  const patch: Partial<TavernState> = { mercContracts: remainingContracts, veteranPool: pool };

  if (isReinviteEligible(promotedContract)) {
    const prompt = makeReinvitePrompt(promotedContract, currentDay);
    const existing = tavern.pendingPrompts ?? [];
    // De-dup: don't queue twice for the same contract (idempotent re-resolution).
    if (!existing.some((p) => p.contractId === contract.id)) {
      patch.pendingPrompts = [...existing, prompt];
    }
  }

  return patch;
}

/** Re-materialize a veteran into a TavernVisitor for daily-roster reappearance. */
export function materializeVisitorFromVeteran(
  vet: VeteranMercSummary,
  currentDay: number,
): TavernVisitor {
  return {
    ...vet.visitorSnapshot,
    id: `tav-vet-${currentDay}-${vet.contractId.slice(-6)}`,
    veteranTag: true,
    spawnedDay: currentDay,
    attemptHistory: [],
  };
}

/**
 * Build a fresh hire contract from a visitor — pure factory, no state mutation.
 * Contract status starts 'available'; questId null.
 */
export function makeMercContract(
  visitor: TavernVisitor,
  hireCost: number,
  hireDay: number,
  now: number = Date.now(),
): MercContract {
  return {
    id: `merc-${now}-${visitor.id}`,
    visitorSnapshot: { ...visitor },
    hireCost,
    hireDay,
    questId: null,
    relationshipPoints: 0,
    status: 'available',
  };
}

/** Clamp Tavern Reputation to [-5, +5]. Exported for store actions. */
export function clampRep(value: number): number {
  return Math.max(TAVERN_REP_MIN, Math.min(TAVERN_REP_MAX, value));
}
