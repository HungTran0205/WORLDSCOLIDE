import type { ActiveMission } from '@/game/state/game-state';
import type { GameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { resolveMission, type MissionResult } from './mission-resolver';
import { calcTotalUpkeep } from './upkeep-system';
import { ARRIVAL_TIMEOUT_MS } from './mission-tick';

export interface OfflineMissionOutcome {
  result: MissionResult;
  /** IDs of members who survived — caller uses these to increment missionsCompleted */
  survivorIds: string[];
}

export interface OfflineReport {
  elapsedMs: number;
  gameDaysCharged: number;
  upkeepCharged: number;
  missionsCompleted: number;
  missionOutcomes: OfflineMissionOutcome[];
}

const GAME_DAY_REAL_MS = 4 * 60 * 60 * 1000; // 4 real hours = 1 game day
const MAX_OFFLINE_GAME_DAYS = 30;

/** Process offline progression when game loads after being away */
export function processOfflineTime(
  state: Pick<GameStore, 'gold' | 'roster' | 'founder' | 'activeMissions' | 'realTimeLastTick'>,
  realNow: number,
): { goldDelta: number; report: OfflineReport } {
  const elapsedMs = realNow - state.realTimeLastTick;

  // Skip if less than 1 minute offline
  if (elapsedMs < 60_000) {
    return {
      goldDelta: 0,
      report: { elapsedMs: 0, gameDaysCharged: 0, upkeepCharged: 0, missionsCompleted: 0, missionOutcomes: [] },
    };
  }

  const allMembers = state.founder ? [state.founder, ...state.roster] : state.roster;

  const gameDaysElapsed = Math.min(MAX_OFFLINE_GAME_DAYS, Math.floor(elapsedMs / GAME_DAY_REAL_MS));
  // Use actual rank-based upkeep instead of hardcoded flat rate
  const dailyUpkeep = calcTotalUpkeep(allMembers);
  const upkeepCharged = gameDaysElapsed * dailyUpkeep;

  // Resolve missions that fully expired offline (past travel + 30s arrival timeout)
  const missionOutcomes: OfflineMissionOutcome[] = [];
  let goldFromMissions = 0;

  for (const active of state.activeMissions as ActiveMission[]) {
    const missionData = MISSIONS.find((m) => m.id === active.missionId);
    if (!missionData) continue;

    const fullyExpiredAt = active.startTime + missionData.travelTimeMs + ARRIVAL_TIMEOUT_MS;
    if (fullyExpiredAt >= realNow) continue; // Still in progress — tick handles it

    const members = allMembers.filter((m) => active.memberIds.includes(m.id));
    const result = resolveMission(missionData, members);

    if (result.outcome !== 'full-wipe') {
      goldFromMissions += result.goldEarned;
    }

    missionOutcomes.push({
      result,
      survivorIds: result.outcome !== 'full-wipe' ? result.survivors : [],
    });
  }

  return {
    goldDelta: goldFromMissions - upkeepCharged,
    report: {
      elapsedMs,
      gameDaysCharged: gameDaysElapsed,
      upkeepCharged,
      missionsCompleted: missionOutcomes.filter((o) => o.result.outcome !== 'full-wipe').length,
      missionOutcomes,
    },
  };
}
