/**
 * Mission tick processing — drives the phase state machine for active missions.
 * Transitions: traveling → arrived → in-combat → completed/failed.
 * Called every 1s by the game loop.
 */

import { MISSIONS } from '@/game/data/missions';
import { resolveMission, resolveMissionWithResult, type MissionResult } from './mission-resolver';
import { simulateCombatFromSnapshot } from './combat-simulator';
import { handleTutorialQuestComplete } from './tutorial-quest-handler';
import { TUTORIAL_BEAR_MISSION_ID } from '@/game/data/tutorial-data';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { memberFromMercContract } from './combat-entity-factory';
import { applyMercResultsForMission } from './tavern-merc-result-router';
import type { ItemID } from '@/game/data/items';
import type { GameStore } from '@/game/state/store';

/** Events emitted by processMissionTick for the UI to handle */
export type MissionTickEvent =
  | { type: 'arrival'; missionId: string; missionName: string; zone: string }
  | { type: 'combat-start'; missionId: string }
  | { type: 'combat-complete'; missionId: string; result: MissionResult };

/** Process all active missions for one tick, advancing their phase state machine */
export function processMissionTick(store: GameStore, now: number): MissionTickEvent[] {
  const events: MissionTickEvent[] = [];

  // Spread to avoid mutation issues while iterating
  for (const active of [...store.activeMissions]) {
    // Guard: this instance already removed by a previous iteration (be safe).
    if (!store.activeMissions.some((m) => m.instanceId === active.instanceId)) continue;

    const mission = MISSIONS.find((m) => m.id === active.missionId);
    if (!mission) {
      store.failMission(active.instanceId);
      continue;
    }

    switch (active.phase) {
      case 'traveling': {
        const travelEnd = active.startTime + mission.travelTimeMs;
        if (now >= travelEnd) {
          store.updateMissionPhase(active.instanceId, 'arrived', now);
          events.push({
            type: 'arrival',
            missionId: active.missionId,
            missionName: mission.name,
            zone: mission.zone ?? '',
          });
        }
        break;
      }

      case 'arrived': {
        // No timeout — wait indefinitely for the player to open the combat panel.
        // The panel transitions phase → 'in-combat' explicitly when the player starts the battle.
        break;
      }

      case 'in-combat': {
        // Live combat is rendered inside the arena scene — skip auto-resolve while it's active.
        // If the arena is NOT active (browser closed mid-fight, page reload), fall through to
        // auto-resolve.
        if (store.gameScene === 'combat-arena') break;
        // Same guard for the new combat panel (D8 single-canvas world): while
        // the panel is open the fight controller drives the engine, so the
        // tick-loop must not race with it.
        if (useCombatPanelStore.getState().isOpen) break;

        // Resolve synchronously — combat sim is a pure, fast function.
        // Mid-fight reload (D12): if a snapshot was autosaved before the
        // browser closed, continue from that state via simulateCombatFromSnapshot.
        // Otherwise fall through to the legacy resolveMission re-roll path.
        // Phase 04: mercs join combat as virtual members (via memberFromMercContract);
        // their ids equal contract.id so survivors[] partitions correctly downstream.
        const allMembers = store.founder ? [store.founder, ...store.roster] : store.roster;
        const realMembers = allMembers.filter((m) => active.memberIds.includes(m.id));
        const mercMembers = store.tavern.mercContracts
          .filter((c) => active.mercContractIds.includes(c.id))
          .map(memberFromMercContract);
        const partyMembers = [...realMembers, ...mercMembers];
        // Tutorial Moonbear must never be lost, even on the offline/reload
        // auto-resolve path (Phase 04). Floor allies for that mission only.
        const tutorialFloor = active.missionId === TUTORIAL_BEAR_MISSION_ID;
        const result = active.combatSnapshot && active.combatSnapshot.length > 0
          ? resolveMissionWithResult(
              mission,
              partyMembers,
              simulateCombatFromSnapshot(active.combatSnapshot, active.combatSnapshotTime ?? 0, tutorialFloor),
            )
          : resolveMission(mission, partyMembers, tutorialFloor);

        const mercIdSet = new Set(active.mercContractIds);
        const memberSurvivors = result.survivors.filter((id) => !mercIdSet.has(id));
        const memberInjured = result.injured.filter((id) => !mercIdSet.has(id));

        if (result.outcome !== 'full-wipe') {
          store.addGold(result.goldEarned);
          // Deposit loot items into inventory
          for (const [itemId, amount] of Object.entries(result.lootEarned)) {
            if (amount && amount > 0) store.addItem(itemId as ItemID, amount);
          }
          // Roll conditional drops (e.g. Logging Permit from forest quests)
          for (const drop of mission.conditionalDrops ?? []) {
            if (Math.random() < drop.chance) {
              store.addItem(drop.itemId, drop.quantity);
            }
          }
          for (const memberId of memberSurvivors) {
            store.updateMemberStatus(memberId, 'idle');
          }
          store.completeMission(active.instanceId);
          // Only real-member survivors get mission credit (mercs excluded per spec §7).
          store.incrementMissionsCompleted(memberSurvivors);
        } else {
          for (const memberId of active.memberIds) {
            store.updateMemberStatus(memberId, 'idle');
          }
          store.failMission(active.instanceId);
        }

        // Injury duration scales with mission difficulty (members only). Recovery is
        // now progress-driven (infirmary beds/queue); `baseRecoveryMs` is the passive
        // wall-clock time, `now` the FIFO ordering key.
        const baseRecoveryMs = mission.durationMs * 0.5;
        for (const memberId of memberInjured) {
          store.injureMember(memberId, baseRecoveryMs, now);
        }

        // Phase 04: route merc outcomes (survival/defeat) to tavern lifecycle.
        applyMercResultsForMission(active, result);

        store.pushMissionResult(result);
        handleTutorialQuestComplete(active.missionId);
        events.push({ type: 'combat-complete', missionId: active.missionId, result });
        break;
      }

      // 'completed' and 'failed' are never in activeMissions (removed by complete/failMission)
    }
  }

  return events;
}
