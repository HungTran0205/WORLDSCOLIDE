/**
 * Unified read-model facade — composes combat + guild derived stats for one member.
 * Also provides team-level helpers and display formatting utilities.
 * No store access. All inputs passed as arguments.
 */

import type { Member } from '@/game/state/game-state';
import { calcDerivedCombatStats, type DerivedCombatStats } from './derived-combat-stats';
import { calcDerivedGuildStats, type DerivedGuildStats } from './derived-guild-stats';
import { calcGearBonuses } from './equipment-bonuses';

export type { DerivedCombatStats } from './derived-combat-stats';
export type { DerivedGuildStats } from './derived-guild-stats';

export interface MemberDerivedStats {
  combat: DerivedCombatStats;
  guild: DerivedGuildStats;
}

/**
 * Pure read-model for all derived stats of one member.
 * @param member           Raw Member from game state
 * @param weaponBaseSpeedMs  Weapon base speed in ms (default 1800)
 */
export function calcMemberDerivedStats(
  member: Member,
  weaponBaseSpeedMs: number = 1800,
): MemberDerivedStats {
  const gearBonuses = calcGearBonuses(member.equipment ?? null);
  return {
    combat: calcDerivedCombatStats(member.stats, member.level, weaponBaseSpeedMs, gearBonuses),
    guild: calcDerivedGuildStats(member.stats, member.level),
  };
}

/**
 * Team morale aura bonus — average CHA across party members.
 * Returns additive damage fraction (e.g. 0.03 = +3% party dmg).
 */
export function calcTeamMoraleAura(members: Member[]): number {
  if (members.length === 0) return 0;
  const avgCha = members.reduce((s, m) => s + m.stats.CHA, 0) / members.length;
  return avgCha * 0.001;
}

// --- Display formatting helpers ---

/** Format a fractional rate as percentage string: 0.25 → "25.0%" */
export function formatRate(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Format hits per second: 0.67 → "0.67 hit/s" */
export function formatHitsPerSecond(hitsPerSecond: number): string {
  return `${hitsPerSecond.toFixed(2)} hit/s`;
}

/** Format HP regen: 1.5 → "1.5 HP/s" */
export function formatHpRegen(hpRegen: number): string {
  return `${hpRegen.toFixed(1)} HP/s`;
}
