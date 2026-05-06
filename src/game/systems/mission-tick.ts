/**
 * Mission tick processing — drives the phase state machine for active missions.
 * Transitions: traveling → arrived → in-combat → completed/failed.
 * Called every 1s by the game loop.
 */

import { MISSIONS } from '@/game/data/missions';
import { resolveMission, resolveMissionWithResult, type MissionResult } from './mission-resolver';
import { simulateCombatFromSnapshot } from './combat-simulator';
import { handleTutorialQuestComplete } from './tutorial-quest-handler';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
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
    // Guard: already removed by a previous iteration (shouldn't happen but be safe)
    if (!store.activeMissions.some((m) => m.missionId === active.missionId)) continue;

    const mission = MISSIONS.find((m) => m.id === active.missionId);
    if (!mission) {
      store.failMission(active.missionId);
      continue;
    }

    switch (active.phase) {
      case 'traveling': {
        const travelEnd = active.startTime + mission.travelTimeMs;
        if (now >= travelEnd) {
          store.updateMissionPhase(active.missionId, 'arrived', now);
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
        const allMembers = store.founder ? [store.founder, ...store.roster] : store.roster;
        const members = allMembers.filter((m) => active.memberIds.includes(m.id));
        const result = active.combatSnapshot && active.combatSnapshot.length > 0
          ? resolveMissionWithResult(
              mission,
              members,
              simulateCombatFromSnapshot(active.combatSnapshot, active.combatSnapshotTime ?? 0),
            )
          : resolveMission(mission, members);

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
          for (const memberId of result.survivors) {
            store.addMemberExp(memberId, result.expPerMember);
            store.updateMemberStatus(memberId, 'idle');
          }
          store.completeMission(active.missionId);
          // Only survivors get mission credit
          store.incrementMissionsCompleted(result.survivors);
        } else {
          for (const memberId of active.memberIds) {
            store.updateMemberStatus(memberId, 'idle');
          }
          store.failMission(active.missionId);
        }

        // Injury duration scales with mission difficulty
        const injuryDuration = mission.durationMs * 0.5;
        for (const memberId of result.injured) {
          store.setMemberInjuredUntil(memberId, now + injuryDuration);
        }

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

/** Check injured members, recover those whose timer expired */
export function processInjuryRecovery(store: GameStore, now: number): void {
  const allMembers = store.founder ? [store.founder, ...store.roster] : store.roster;
  for (const member of allMembers) {
    if (member.status === 'injured' && member.injuredUntil && member.injuredUntil <= now) {
      store.setMemberInjuredUntil(member.id, null);
    }
  }
}
