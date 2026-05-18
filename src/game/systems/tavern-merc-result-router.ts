/**
 * Tavern merc result router — Phase 04 (+ Phase 05 RP enrichment).
 *
 * Bridges combat-resolver output (a survivors/injured list of entity IDs)
 * back to the tavern merc-contract lifecycle. Called by every mission
 * completion path (mission-tick, arena-result-handler, offline-progression)
 * so all routes share identical merc bookkeeping.
 *
 * Mercs in the active mission are identified by `active.mercContractIds`.
 * A merc whose contract id appears in `result.survivors` survived; one
 * absent from survivors is considered defeated (HP=0). Mercs never enter
 * the injured list (they have no infirmary path per spec §7).
 *
 * Phase 05: walks the combat tick log to compute per-merc damage taken,
 * member-down state, and solo-carry detection — feeding the spec §8.1
 * RP table inside `applyMercSurvival`.
 */

import type { MissionResult } from './mission-resolver';
import type { CombatEvent } from './combat-types';
import { useGameStore } from '@/game/state/store';
import { MS_PER_GAME_DAY } from '@/game/state/clock-slice';

export function getCurrentGameDay(): number {
  return Math.floor(useGameStore.getState().gameTime / MS_PER_GAME_DAY);
}

/** Sum every damage event in `ticks` that landed on `targetId`. */
function computeDamageTaken(ticks: MissionResult['combatResult']['ticks'], targetId: string): number {
  let total = 0;
  for (const tick of ticks) {
    for (const ev of tick.events as CombatEvent[]) {
      if ('targetId' in ev && ev.targetId === targetId) {
        if (ev.type === 'auto-attack' || ev.type === 'skill-use' || ev.type === 'effect-tick') {
          total += ev.damage;
        } else if (ev.type === 'block') {
          // `reducedDamage` reflects the post-block hit that still landed.
          total += ev.reducedDamage;
        }
      }
    }
  }
  return total;
}

/**
 * Apply contract status changes for every merc that participated in a quest.
 * Survivors → applyMercSurvival (success path may add to veteranPool +
 * queue re-invite prompt). Defeated → applyMercDeath (rep -1, contract
 * dropped, no infirmary).
 *
 * Idempotent: calling twice is harmless because the second pass finds no
 * matching contracts (already removed by the first).
 */
export function applyMercResultsForMission(
  active: { mercContractIds: string[]; memberIds?: string[] },
  result: MissionResult,
): void {
  if (active.mercContractIds.length === 0) return;
  const store = useGameStore.getState();
  const currentDay = getCurrentGameDay();
  const success = result.outcome !== 'full-wipe';
  const survivorSet = new Set(result.survivors);
  const injuredSet = new Set(result.injured);

  // Phase 05 enrichments — computed once per mission, reused per-merc.
  // `memberDied` = any non-merc party member dropped to HP=0 (in `injured`).
  const memberDied = (active.memberIds ?? []).some(
    (id) => injuredSet.has(id) || (success && !survivorSet.has(id)),
  );
  // Solo-carry detection: success path AND every non-merc party member
  // ended in `injured`. (Empty non-merc roster doesn't count as solo-carry.)
  const memberIds = active.memberIds ?? [];
  const allMembersDown =
    memberIds.length > 0 && memberIds.every((id) => injuredSet.has(id));

  for (const contractId of active.mercContractIds) {
    const survived = survivorSet.has(contractId);
    const mercDamage = survived
      ? computeDamageTaken(result.combatResult.ticks, contractId)
      : undefined;
    const mercAssisted: 'solo-carry' | 'with-members' | undefined = survived && success
      ? (allMembersDown ? 'solo-carry' : 'with-members')
      : undefined;

    store.applyMercQuestResult(
      contractId,
      {
        success,
        defeated: !survived,
        mercDamage,
        mercAssisted,
        memberDied,
      },
      currentDay,
    );
  }
}
