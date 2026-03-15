import type { Member, Mission } from '@/game/state/game-state';
import type { CombatResult, CombatOutcome } from './combat-types';
import { ENEMIES } from '@/game/data/enemies';
import { simulateCombat } from './combat-simulator';

export interface MissionResult {
  missionId: string;
  outcome: CombatOutcome;
  goldEarned: number;
  expPerMember: number;
  survivors: string[];
  injured: string[];
  combatResult: CombatResult;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Resolve a mission by running combat simulation and calculating rewards */
export function resolveMission(mission: Mission, members: Member[]): MissionResult {
  const enemyTemplates = mission.enemyIds
    .map((id) => ENEMIES[id])
    .filter(Boolean);

  const combatResult = simulateCombat(members, enemyTemplates);

  let goldEarned = 0;
  let expPerMember = 0;

  if (combatResult.outcome !== 'full-wipe') {
    goldEarned = randomInt(mission.goldRewardMin, mission.goldRewardMax);
    expPerMember = mission.expReward;

    // LCK bonus on gold
    const avgLck = members.reduce((s, m) => s + m.stats.LCK, 0) / members.length;
    goldEarned = Math.floor(goldEarned * (1 + avgLck * 0.01));
  }

  return {
    missionId: mission.id,
    outcome: combatResult.outcome,
    goldEarned,
    expPerMember,
    survivors: combatResult.survivors,
    injured: combatResult.injured,
    combatResult,
  };
}
