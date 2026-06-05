import type { Member, Mission, ActiveMission, MercContract } from '@/game/state/game-state';
import { DEFAULT_TARGET_PRIORITY } from './combat-arena-types';

export interface DispatchValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Validate a quest party composed of guild Members + tavern MercContracts (Phase 04).
 * Mercs are paid upfront at hire time (no per-quest fee), so the legacy 50%
 * `goldRewardMin` deduction for `rank === 'MERCENARY'` was removed entirely
 * (old `availableMercenaries` path is gone — see plan AD11/Phase 04).
 *
 * `currentGold` is unused now but kept on the signature in case future
 * integrations (e.g. travel cost) need it; passing 0 is safe.
 */
export function validateDispatch(
  mission: Mission,
  selectedMembers: Member[],
  mercContracts: MercContract[] = [],
  _currentGold = 0,
): DispatchValidation {
  const partySize = selectedMembers.length + mercContracts.length;
  if (partySize < mission.requiredMembers) {
    return { valid: false, reason: `Need ${mission.requiredMembers}+ in party` };
  }
  if (selectedMembers.some((m) => m.status !== 'idle')) {
    return { valid: false, reason: 'Some members are unavailable' };
  }
  // Mercs only quest-assignable while contract.status === 'available'.
  if (mercContracts.some((c) => c.status !== 'available')) {
    return { valid: false, reason: 'Some mercs are not available' };
  }
  return { valid: true };
}

export function createActiveMission(
  mission: Mission,
  memberIds: string[],
  mercContractIds: string[],
  now: number,
): ActiveMission {
  return {
    instanceId: crypto.randomUUID(),
    missionId: mission.id,
    memberIds,
    mercContractIds,
    startTime: now,
    estimatedEndTime: now + mission.durationMs,
    phase: 'traveling',
    arrivalTime: null,
    targetPriority: DEFAULT_TARGET_PRIORITY,
  };
}
