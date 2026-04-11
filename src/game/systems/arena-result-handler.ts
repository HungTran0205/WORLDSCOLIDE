/**
 * Arena result handler — applies combat rewards from manual arena combat.
 * Called when player clicks "Continue" on the result overlay.
 * Mirrors the reward logic in mission-tick.ts 'in-combat' case.
 */

import { useGameStore } from '@/game/state/store';
import { resolveMissionWithResult } from './mission-resolver';
import { handleTutorialQuestComplete } from './tutorial-quest-handler';
import { MISSIONS } from '@/game/data/missions';

export function applyArenaResult(): void {
  const store = useGameStore.getState();
  const { arenaResult, arenaMissionId } = store;
  if (!arenaResult || !arenaMissionId) return;

  const mission = MISSIONS.find(m => m.id === arenaMissionId);
  if (!mission) { store.exitArena(); return; }

  const active = store.activeMissions.find(m => m.missionId === arenaMissionId);
  if (!active) { store.exitArena(); return; }

  const allMembers = store.founder ? [store.founder, ...store.roster] : store.roster;
  const members = allMembers.filter(m => active.memberIds.includes(m.id));
  const result = resolveMissionWithResult(mission, members, arenaResult);

  if (result.outcome !== 'full-wipe') {
    store.addGold(result.goldEarned);
    for (const [itemId, amount] of Object.entries(result.lootEarned)) {
      if (amount && amount > 0) store.addItem(itemId as import('@/game/data/items').ItemID, amount);
    }
    for (const memberId of result.survivors) {
      store.addMemberExp(memberId, result.expPerMember);
      store.updateMemberStatus(memberId, 'idle');
    }
    store.completeMission(arenaMissionId);
    store.incrementMissionsCompleted(result.survivors);
  } else {
    store.failMission(arenaMissionId);
  }

  // Injuries scale with mission difficulty
  const now = Date.now();
  const injuryDuration = mission.durationMs * 0.5;
  for (const memberId of result.injured) {
    store.setMemberInjuredUntil(memberId, now + injuryDuration);
  }

  store.pushMissionResult(result);
  handleTutorialQuestComplete(arenaMissionId);
  store.exitArena();
}
