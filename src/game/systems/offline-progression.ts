import type { ActiveMission } from '@/game/state/game-state';
import type { GameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { resolveMission, type MissionResult } from './mission-resolver';
import { ARRIVAL_TIMEOUT_MS } from './mission-tick';

export interface OfflineReport {
  elapsedMs: number;
  gameDaysCharged: number;
  upkeepCharged: number;
  missionsCompleted: number;
  missionResults: MissionResult[];
}

const GAME_DAY_REAL_MS = 4 * 60 * 60 * 1000; // 4 real hours = 1 game day
const UPKEEP_PER_MEMBER = 10;
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
      report: { elapsedMs: 0, gameDaysCharged: 0, upkeepCharged: 0, missionsCompleted: 0, missionResults: [] },
    };
  }

  const gameDaysElapsed = Math.min(MAX_OFFLINE_GAME_DAYS, Math.floor(elapsedMs / GAME_DAY_REAL_MS));
  const memberCount = state.roster.length + (state.founder ? 1 : 0);
  const upkeepCharged = gameDaysElapsed * memberCount * UPKEEP_PER_MEMBER;

  const allMembers = state.founder ? [state.founder, ...state.roster] : state.roster;

  // Resolve missions that fully expired offline (past travel + 30s arrival timeout)
  const missionResults: MissionResult[] = [];
  let goldFromMissions = 0;

  for (const active of state.activeMissions as ActiveMission[]) {
    const missionData = MISSIONS.find((m) => m.id === active.missionId);
    if (!missionData) continue;

    const fullyExpiredAt = active.startTime + missionData.travelTimeMs + ARRIVAL_TIMEOUT_MS;
    if (fullyExpiredAt >= realNow) continue; // Still in progress — tick handles it

    const members = allMembers.filter((m) => active.memberIds.includes(m.id));
    const result = resolveMission(missionData, members);
    missionResults.push(result);

    if (result.outcome !== 'full-wipe') {
      goldFromMissions += result.goldEarned;
    }
  }

  return {
    goldDelta: goldFromMissions - upkeepCharged,
    report: {
      elapsedMs,
      gameDaysCharged: gameDaysElapsed,
      upkeepCharged,
      missionsCompleted: missionResults.length,
      missionResults,
    },
  };
}
