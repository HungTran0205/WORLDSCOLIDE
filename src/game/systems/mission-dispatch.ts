import type { Member, Mission, ActiveMission } from '@/game/state/game-state';

export interface DispatchValidation {
  valid: boolean;
  reason?: string;
}

export function validateDispatch(mission: Mission, selectedMembers: Member[]): DispatchValidation {
  if (selectedMembers.length < mission.requiredMembers) {
    return { valid: false, reason: `Need ${mission.requiredMembers}+ members` };
  }
  if (selectedMembers.some((m) => m.status !== 'idle')) {
    return { valid: false, reason: 'Some members are unavailable' };
  }
  if (selectedMembers.some((m) => m.level < mission.requiredLevel)) {
    return { valid: false, reason: `Members must be level ${mission.requiredLevel}+` };
  }
  return { valid: true };
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
