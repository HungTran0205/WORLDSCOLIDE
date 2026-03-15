import { describe, it, expect } from 'vitest';
import { calcMemberUpkeep, calcTotalUpkeep, chargeUpkeep, processDebtPenalty } from '@/game/systems/upkeep-system';
import { formatGold } from '@/game/systems/economy-helpers';
import { calcRecruitSuccess } from '@/game/systems/recruit-system';
import { canUpgradeGuild, getUpgradeCost } from '@/game/systems/guild-upgrade-system';
import type { Member } from '@/game/state/game-state';

function makeMember(level: number, isFounder = false): Member {
  return {
    id: `m-${level}-${Math.random()}`, name: 'Test', level, exp: 0,
    stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    unallocatedPoints: 0, skill: null, status: 'idle',
    injuredUntil: null, civilization: 'Viet', isFounder,
  };
}

describe('Upkeep System', () => {
  it('should calculate member upkeep based on level', () => {
    expect(calcMemberUpkeep(1)).toBe(5);
    expect(calcMemberUpkeep(5)).toBeGreaterThan(5);
    // Higher level = more upkeep
    expect(calcMemberUpkeep(10)).toBeGreaterThan(calcMemberUpkeep(5));
  });

  it('should calculate total upkeep for all members', () => {
    const members = [makeMember(1), makeMember(1), makeMember(1)];
    expect(calcTotalUpkeep(members)).toBe(15); // 3 * 5
  });

  it('should charge upkeep when gold is sufficient', () => {
    const members = [makeMember(1)];
    const result = chargeUpkeep(100, members, 3);
    expect(result.newGold).toBe(85); // 100 - 5*3
    expect(result.debt).toBe(0);
  });

  it('should track debt when gold insufficient', () => {
    const members = [makeMember(1)];
    const result = chargeUpkeep(10, members, 5);
    expect(result.newGold).toBe(0);
    expect(result.debt).toBeGreaterThan(0);
    expect(result.daysInDebt).toBeGreaterThan(0);
  });

  it('should never remove founder from debt penalty', () => {
    const roster = [makeMember(1, true), makeMember(1)];
    const result = processDebtPenalty(roster, 5);
    const foundersRemoved = result.removedMembers.filter((m) => m.isFounder);
    expect(foundersRemoved.length).toBe(0);
  });

  it('should remove lowest-level non-founder on debt penalty', () => {
    const roster = [makeMember(5), makeMember(1), makeMember(3)];
    const result = processDebtPenalty(roster, 5);
    expect(result.removedMembers.length).toBe(1);
    expect(result.removedMembers[0].level).toBe(1);
  });
});

describe('Economy Helpers', () => {
  it('should format gold with K/M/B suffixes', () => {
    expect(formatGold(500)).toBe('500');
    expect(formatGold(15000)).toBe('15.0K');
    expect(formatGold(1500000)).toBe('1.5M');
    expect(formatGold(2000000000)).toBe('2.0B');
  });
});

describe('Recruit System', () => {
  it('should have high success rate for low-level recruits', () => {
    const rate = calcRecruitSuccess(1, 5, 1);
    expect(rate).toBeGreaterThan(0.9);
  });

  it('should decrease success rate with recruit level', () => {
    const rateLow = calcRecruitSuccess(1, 5, 1);
    const rateHigh = calcRecruitSuccess(10, 5, 1);
    expect(rateHigh).toBeLessThan(rateLow);
  });

  it('should cap success rate between 0.1 and 0.99', () => {
    expect(calcRecruitSuccess(1, 100, 10)).toBeLessThanOrEqual(0.99);
    expect(calcRecruitSuccess(100, 0, 0)).toBeGreaterThanOrEqual(0.1);
  });
});

describe('Guild Upgrades', () => {
  it('should allow upgrade when gold sufficient', () => {
    expect(canUpgradeGuild(1, 600)).toBe(true);
    expect(canUpgradeGuild(1, 400)).toBe(false);
  });

  it('should return correct upgrade cost', () => {
    expect(getUpgradeCost(1)).toBe(500);
    expect(getUpgradeCost(2)).toBe(2000);
  });

  it('should return Infinity for max level', () => {
    expect(getUpgradeCost(10)).toBe(Infinity);
  });
});
