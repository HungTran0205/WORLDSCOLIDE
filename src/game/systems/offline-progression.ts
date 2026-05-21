import type { ActiveMission } from '@/game/state/game-state';
import type { GameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { resolveMission, type MissionResult } from './mission-resolver';
import { calcTotalUpkeep } from './upkeep-system';
import { memberFromMercContract } from './combat-entity-factory';
import { TUTORIAL_BEAR_MISSION_ID } from '@/game/data/tutorial-data';

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
  state: Pick<GameStore, 'gold' | 'roster' | 'founder' | 'activeMissions' | 'realTimeLastTick' | 'tavern'>,
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

    // Auto-resolve missions where travel completed while offline (arrived or in-combat)
    const travelEndAt = active.startTime + missionData.travelTimeMs;
    if (travelEndAt >= realNow) continue; // Still traveling — tick handles it

    // Phase 04: include hired mercs in offline auto-resolve so quest completion
    // matches the live tick path. Their ids equal contract.id so callers can
    // partition survivor ids back into the tavern lifecycle.
    const realMembers = allMembers.filter((m) => active.memberIds.includes(m.id));
    const mercMembers = state.tavern.mercContracts
      .filter((c) => active.mercContractIds.includes(c.id))
      .map(memberFromMercContract);
    const members = [...realMembers, ...mercMembers];
    // Tutorial Moonbear is a guaranteed win even when auto-resolved offline (Phase 04).
    const result = resolveMission(missionData, members, missionData.id === TUTORIAL_BEAR_MISSION_ID);

    if (result.outcome !== 'full-wipe') {
      goldFromMissions += result.goldEarned;
    }

    const mercIdSet = new Set(active.mercContractIds);
    missionOutcomes.push({
      result,
      survivorIds: result.outcome !== 'full-wipe'
        ? result.survivors.filter((id) => !mercIdSet.has(id))
        : [],
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
