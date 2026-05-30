/**
 * Arena result handler — applies combat rewards from manual arena combat.
 * Called when player clicks "Continue" on the result overlay.
 * Mirrors the reward logic in mission-tick.ts 'in-combat' case.
 *
 * Phase 4 split: the side-effect application is exported separately so the
 * new combat-panel fight controller can run rewards without also running
 * `exitArena()` (the panel manages its own dismissal).
 */

import { useGameStore } from '@/game/state/store';
import { resolveMissionWithResult, type MissionResult } from './mission-resolver';
import { handleTutorialQuestComplete } from './tutorial-quest-handler';
import { MISSIONS } from '@/game/data/missions';
import { memberFromMercContract } from './combat-entity-factory';
import { applyMercResultsForMission } from './tavern-merc-result-router';
import type { Mission, Member } from '@/game/state/game-state';
import type { CombatResult } from './combat-types';
import type { ItemID } from '@/game/data/items';

/**
 * Resolve mission + apply rewards/injuries/completion. No store-scene mutation
 * (caller decides whether to exitArena or hand off to the combat panel).
 *
 * Phase 04: `members` may include merc-as-Member shapes (from
 * `memberFromMercContract`). Their ids equal contract.id so the merc
 * partition below routes outcomes correctly to the tavern lifecycle.
 */
export function applyMissionResultSideEffects(
  mission: Mission,
  active: { instanceId: string; memberIds: string[]; mercContractIds: string[] },
  members: Member[],
  combatResult: CombatResult,
): MissionResult {
  const store = useGameStore.getState();
  const result = resolveMissionWithResult(mission, members, combatResult);

  const mercIdSet = new Set(active.mercContractIds);
  const memberSurvivors = result.survivors.filter((id) => !mercIdSet.has(id));
  const memberInjured = result.injured.filter((id) => !mercIdSet.has(id));

  if (result.outcome !== 'full-wipe') {
    store.addGold(result.goldEarned);
    for (const [itemId, amount] of Object.entries(result.lootEarned)) {
      if (amount && amount > 0) store.addItem(itemId as ItemID, amount);
    }
    for (const memberId of memberSurvivors) {
      store.updateMemberStatus(memberId, 'idle');
    }
    store.completeMission(active.instanceId);
    store.incrementMissionsCompleted(memberSurvivors);
  } else {
    for (const memberId of active.memberIds) {
      store.updateMemberStatus(memberId, 'idle');
    }
    store.failMission(active.instanceId);
  }

  // Injuries scale with mission difficulty (members only — mercs never enter infirmary).
  // Progress-driven recovery: `baseRecoveryMs` is the passive wall-clock time, `now` the
  // FIFO ordering key for bed/queue assignment.
  const now = Date.now();
  const baseRecoveryMs = mission.durationMs * 0.5;
  for (const memberId of memberInjured) {
    store.injureMember(memberId, baseRecoveryMs, now);
  }

  // Phase 04: tavern merc-contract bookkeeping (RP, defeat rep, veteranPool).
  applyMercResultsForMission(active, result);

  store.pushMissionResult(result);
  handleTutorialQuestComplete(mission.id);
  return result;
}

export function applyArenaResult(): void {
  const store = useGameStore.getState();
  const { arenaResult, arenaMissionId, arenaInstanceId } = store;
  if (!arenaResult || !arenaMissionId || !arenaInstanceId) return;

  const mission = MISSIONS.find(m => m.id === arenaMissionId);
  if (!mission) { store.exitArena(); return; }

  const active = store.activeMissions.find(m => m.instanceId === arenaInstanceId);
  if (!active) { store.exitArena(); return; }

  const allMembers = store.founder ? [store.founder, ...store.roster] : store.roster;
  const realMembers = allMembers.filter(m => active.memberIds.includes(m.id));
  const mercMembers = store.tavern.mercContracts
    .filter((c) => active.mercContractIds.includes(c.id))
    .map(memberFromMercContract);
  const members = [...realMembers, ...mercMembers];

  applyMissionResultSideEffects(mission, active, members, arenaResult);
  store.exitArena();
}
