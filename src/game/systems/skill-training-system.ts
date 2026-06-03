/**
 * Skill-rank training system — processes Training Yard queues and bakes
 * rank-milestone overrides into Skill objects at combat entity creation time.
 */

import type { Member, GuildFacility, Skill } from '@/game/state/game-state';
import { RANK_TRAIN_DAYS, MAX_RANK_BY_FACILITY_LEVEL, TRAIN_SPEED_FACTOR, GAME_DAY_REAL_MS } from '@/game/data/skill-rank-costs';
import { getSkillFromPool } from '@/game/data/skills';

export interface TrainingResult {
  memberId: string;
  skillId: string;
  rankReached: number | null; // null = still in progress
  progressDelta: number;
}

/**
 * Advance training progress for all active Training Yard slots by dtMs elapsed.
 * Pure function — caller (applySkillTrainingResults) applies state mutations.
 */
export function processSkillTraining(
  facility: GuildFacility,
  allMembers: Member[],
  dtMs: number,
): TrainingResult[] {
  if (dtMs <= 0 || !facility.trainingQueue?.length) return [];

  const maxRank = MAX_RANK_BY_FACILITY_LEVEL[facility.level] ?? 2;
  const speedFactor = TRAIN_SPEED_FACTOR[facility.level - 1] ?? 1.0;
  const results: TrainingResult[] = [];

  for (const slot of facility.trainingQueue) {
    const member = allMembers.find((m) => m.id === slot.memberId);
    if (!member || member.status !== 'training') continue;

    const currentEntry = member.skillRanks?.[slot.skillId];
    const currentRank = currentEntry?.rank ?? 0; // 0 = not yet learned
    if (currentRank >= slot.targetRank || slot.targetRank > maxRank) continue;

    const baseTrainMs = (RANK_TRAIN_DAYS[slot.targetRank] ?? 1) * GAME_DAY_REAL_MS;
    // rate = 1/speedFactor — Lv2 (0.8) is 1.25× faster, Lv3 (0.6) ~1.667× faster
    const progressDelta = (dtMs / baseTrainMs) / speedFactor;

    const currentProgress = currentEntry?.progress ?? 0;
    const newProgress = currentProgress + progressDelta;

    results.push({
      memberId: member.id,
      skillId: slot.skillId,
      rankReached: newProgress >= 1.0 ? slot.targetRank : null,
      progressDelta,
    });
  }

  return results;
}

// ── Display resolver (single source of truth for TrainingYardRoomCard) ──────

export interface TrainingRow {
  slot: import('@/game/state/game-state').TrainingSlot;
  member: Member;
  skill: Skill;
  currentRank: number;
  targetRank: number;
  progress: number;
  remainingMs: number;
  speedFactor: number;
}

export function resolveTrainingRows(facility: GuildFacility, members: Member[]): TrainingRow[] {
  const speedFactor = TRAIN_SPEED_FACTOR[facility.level - 1] ?? 1.0;
  return (facility.trainingQueue ?? []).flatMap((slot) => {
    const member = members.find((m) => m.id === slot.memberId);
    if (!member) return [];
    // Show the skill being trained (may differ from the carried skill).
    const skill = getSkillFromPool(member.archetype, slot.skillId) ?? member.skill;
    if (!skill) return [];
    const entry = member.skillRanks?.[slot.skillId];
    const progress = entry?.progress ?? 0;
    const baseTrainMs = (RANK_TRAIN_DAYS[slot.targetRank] ?? 1) * GAME_DAY_REAL_MS;
    return [{
      slot,
      member,
      skill,
      currentRank: entry?.rank ?? 0,
      targetRank: slot.targetRank,
      progress,
      remainingMs: Math.max(0, (1 - progress) * baseTrainMs * speedFactor),
      speedFactor,
    }];
  });
}

// ── Rank-milestone applier ───────────────────────────────────────────────────

/**
 * Return a copy of `skill` with rank-milestone overrides applied for the given rank.
 * Called at ArenaEntity creation so combat always reflects the member's current rank.
 * Rank 1 = no changes (base skill definition applies as-is).
 */
export function applySkillRankMilestones(skill: Skill, rank: number): Skill {
  if (rank <= 1) return skill;
  const out = { ...skill };

  // Flat +6% damage at R2 and R4
  if (rank >= 2) out.damageMultiplier = round2(out.damageMultiplier * 1.06);
  if (rank >= 4) out.damageMultiplier = round2(out.damageMultiplier * 1.06);

  switch (skill.id) {
    case 'pierce':
      if (rank >= 3) out.laneHitDepth = 3;
      if (rank >= 5) out.laneHitLastBonus = 0.50;
      break;
    case 'cleave':
      if (rank >= 3) out.critRateBonus = 0.15;
      if (rank >= 5) out.critCooldownReduction = 0.50;
      break;
    case 'riposte':
      if (rank >= 3) out.statusDurationMs = 4000;
      if (rank >= 5) out.riposteCounterMult = 1.5;
      break;
    case 'rally':
      if (rank >= 5) out.buffEffect = 'attack-speed-up';
      break;
    case 'sunder':
      if (rank >= 3) out.armorPierceChance = 0.70;
      if (rank >= 5) out.armorPierceBonusMult = 1.30;
      break;
    case 'quake':
      if (rank >= 3) out.damageMultiplier = 0.30;
      if (rank >= 5) out.aoeStunChance = 0.25;
      break;
    case 'bulwark':
      if (rank >= 3) out.buffMagnitude = 0.40;
      if (rank >= 5) out.buffMagnitude = 0.40; // thorns deferred to future phase
      break;
    case 'aegis':
      if (rank >= 3) out.buffMagnitude = 0.25;
      if (rank >= 5) out.buffHealPct = 0.05;
      break;
    case 'snipe':
      if (rank >= 3) out.accuracyBonus = 0.75;
      if (rank >= 5) out.ignoreBlock = true;
      break;
    case 'barrage':
      if (rank >= 3) out.multiHitCount = 6;
      if (rank >= 5) out.multiHitFinalBonus = 1.0;
      break;
    case 'pin':
      if (rank >= 3) out.slowMultiplier = 2.5;
      if (rank >= 5) out.debuffAccuracyPenalty = 0.20;
      break;
    case 'mark':
      if (rank >= 3) out.buffMagnitude = 0.15;
      if (rank >= 5) out.focusFireBonus = 0.10;
      break;
  }
  return out;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
