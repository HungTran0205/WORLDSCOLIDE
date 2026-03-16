import type { Member, Mission, ActiveMission } from '@/game/state/game-state';

export interface DispatchValidation {
  valid: boolean;
  reason?: string;
  mercenaryFee: number; // gold deducted upfront when mercenaries are in the party
}

export function validateDispatch(
  mission: Mission,
  selectedMembers: Member[],
  currentGold: number,
): DispatchValidation {
  if (selectedMembers.length < mission.requiredMembers) {
    return { valid: false, reason: `Need ${mission.requiredMembers}+ members`, mercenaryFee: 0 };
  }
  if (selectedMembers.some((m) => m.status !== 'idle')) {
    return { valid: false, reason: 'Some members are unavailable', mercenaryFee: 0 };
  }
  if (selectedMembers.some((m) => m.level < mission.requiredLevel)) {
    return { valid: false, reason: `Members must be level ${mission.requiredLevel}+`, mercenaryFee: 0 };
  }

  const hasMercenary = selectedMembers.some((m) => m.rank === 'MERCENARY');
  if (hasMercenary) {
    const fee = Math.floor(mission.goldRewardMin * 0.5);
    if (currentGold < fee) {
      return { valid: false, reason: `Need ${fee}g upfront for mercenary (you have ${currentGold}g)`, mercenaryFee: fee };
    }
    return { valid: true, mercenaryFee: fee };
  }

  return { valid: true, mercenaryFee: 0 };
}

export function createActiveMission(
  mission: Mission,
  memberIds: string[],
  now: number,
): ActiveMission {
  return {
    missionId: mission.id,
    memberIds,
    startTime: now,
    estimatedEndTime: now + mission.durationMs,
    phase: 'traveling',
    arrivalTime: null,
    combatMode: null,
  };
}
