/**
 * Mission tick processing — drives the phase state machine for active missions.
 * Transitions: traveling → arrived → in-combat → completed/failed.
 * Called every 1s by the game loop.
 */

import { MISSIONS } from '@/game/data/missions';
import { resolveMission, type MissionResult } from './mission-resolver';
import type { ItemID } from '@/game/data/items';
import type { GameStore } from '@/game/state/store';

/** Time player has to choose manual/auto before auto-combat triggers */
export const ARRIVAL_TIMEOUT_MS = 30_000;

/** Events emitted by processMissionTick for the UI to handle */
export type MissionTickEvent =
  | { type: 'arrival'; missionId: string; missionName: string; zone: string }
  | { type: 'combat-start'; missionId: string }
  | { type: 'combat-complete'; missionId: string; result: MissionResult; combatMode: 'auto' | 'manual' };

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
        // Defensive: fall back to now if arrivalTime somehow missing
        const arrivalTime = active.arrivalTime ?? now;
        const timedOut = now >= arrivalTime + ARRIVAL_TIMEOUT_MS;

        if (active.combatMode) {
          // Player chose — transition to combat
          store.updateMissionPhase(active.missionId, 'in-combat');
          events.push({ type: 'combat-start', missionId: active.missionId });
        } else if (timedOut) {
          // 30s timeout — force auto combat
          store.setCombatMode(active.missionId, 'auto');
          store.updateMissionPhase(active.missionId, 'in-combat');
          events.push({ type: 'combat-start', missionId: active.missionId });
        }
        break;
      }

      case 'in-combat': {
        // Resolve synchronously — combat sim is a pure, fast function
        const allMembers = store.founder ? [store.founder, ...store.roster] : store.roster;
        const members = allMembers.filter((m) => active.memberIds.includes(m.id));
        const result = resolveMission(mission, members);

        if (result.outcome !== 'full-wipe') {
          store.addGold(result.goldEarned);
          // Deposit loot items into inventory
          for (const [itemId, amount] of Object.entries(result.lootEarned)) {
            if (amount && amount > 0) store.addItem(itemId as ItemID, amount);
          }
          for (const memberId of result.survivors) {
            store.addMemberExp(memberId, result.expPerMember);
            store.updateMemberStatus(memberId, 'idle');
          }
          store.completeMission(active.missionId);
          // Only survivors get mission credit
          store.incrementMissionsCompleted(result.survivors);
        } else {
          store.failMission(active.missionId);
        }

        // Injury duration scales with mission difficulty
        const injuryDuration = mission.durationMs * 0.5;
        for (const memberId of result.injured) {
          store.setMemberInjuredUntil(memberId, now + injuryDuration);
        }

        store.pushMissionResult(result);
        events.push({ type: 'combat-complete', missionId: active.missionId, result, combatMode: active.combatMode ?? 'auto' });
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
