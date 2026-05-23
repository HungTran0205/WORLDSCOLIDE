import type { Member, Mission } from '@/game/state/game-state';
import type { CombatResult, CombatOutcome } from './combat-types';
import type { ItemID } from '@/game/data/items';
import { ENEMIES } from '@/game/data/enemies';
import { simulateCombat } from './combat-simulator';
import { rollLoot, mergeLoot } from './loot-roller';

export interface MissionResult {
  missionId: string;
  outcome: CombatOutcome;
  goldEarned: number;
  expPerMember: number;
  survivors: string[];
  injured: string[];
  combatResult: CombatResult;
  lootEarned: Partial<Record<ItemID, number>>;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Create MissionResult from an externally-provided CombatResult (arena engine) */
export function resolveMissionWithResult(
  mission: Mission,
  members: Member[],
  combatResult: CombatResult,
): MissionResult {
  let goldEarned = 0;
  let expPerMember = 0;
  let lootEarned: Partial<Record<ItemID, number>> = {};

  if (combatResult.outcome !== 'full-wipe') {
    goldEarned = randomInt(mission.goldRewardMin, mission.goldRewardMax);
    expPerMember = Math.max(1, Math.floor(mission.expReward / members.length));
    const avgLck = members.reduce((s, m) => s + m.stats.LCK, 0) / members.length;
    goldEarned = Math.floor(goldEarned * (1 + avgLck * 0.01));

    const lootRolls = mission.enemyIds
      .map((id) => ENEMIES[id])
      .filter(Boolean)
      .map((enemy) => rollLoot(enemy.loot));
    lootEarned = mergeLoot(...lootRolls);
  }

  return {
    missionId: mission.id,
    outcome: combatResult.outcome,
    goldEarned,
    expPerMember,
    survivors: combatResult.survivors,
    injured: combatResult.injured,
    combatResult,
    lootEarned,
  };
}

/** Resolve a mission by running combat simulation and calculating rewards.
 *  `hpFloor` (Phase 04) keeps tutorial allies at ≥1 HP on the from-scratch
 *  auto-resolve path (e.g. mid-fight reload before a snapshot exists). */
export function resolveMission(mission: Mission, members: Member[], hpFloor = false): MissionResult {
  if (members.length === 0) {
    return {
      missionId: mission.id, outcome: 'full-wipe', goldEarned: 0, expPerMember: 0,
      survivors: [], injured: [], combatResult: { outcome: 'full-wipe', ticks: [], survivors: [], injured: [], totalDamageDealt: 0, durationMs: 0 },
      lootEarned: {},
    };
  }

  const enemyTemplates = mission.enemyIds
    .map((id) => ENEMIES[id])
    .filter(Boolean);

  const combatResult = simulateCombat(members, enemyTemplates, hpFloor);

  let goldEarned = 0;
  let expPerMember = 0;
  let lootEarned: Partial<Record<ItemID, number>> = {};

  if (combatResult.outcome !== 'full-wipe') {
    goldEarned = randomInt(mission.goldRewardMin, mission.goldRewardMax);
    expPerMember = Math.max(1, Math.floor(mission.expReward / members.length));

    // LCK bonus on gold
    const avgLck = members.reduce((s, m) => s + m.stats.LCK, 0) / members.length;
    goldEarned = Math.floor(goldEarned * (1 + avgLck * 0.01));

    // Roll loot for each enemy in the mission
    const lootRolls = mission.enemyIds
      .map((id) => ENEMIES[id])
      .filter(Boolean)
      .map((enemy) => rollLoot(enemy.loot));
    lootEarned = mergeLoot(...lootRolls);
  }

  return {
    missionId: mission.id,
    outcome: combatResult.outcome,
    goldEarned,
    expPerMember,
    survivors: combatResult.survivors,
    injured: combatResult.injured,
    combatResult,
    lootEarned,
  };
}
