import { describe, it, expect } from 'vitest';
import { calcMemberUpkeep, calcTotalUpkeep, chargeUpkeep, processDebtPenalty } from '@/game/systems/upkeep-system';
import { formatGold } from '@/game/systems/economy-helpers';
import { calcRecruitSuccess } from '@/game/systems/recruit-system';
import { canUpgradeGuild, getUpgradeCost } from '@/game/systems/guild-upgrade-system';
import type { Member } from '@/game/state/game-state';
import type { Grade } from '@/game/data/grades';

function makeMember(grade: Grade, isFounder = false): Member {
  return {
    id: `m-${grade}-${Math.random()}`, name: 'Test',
    grade, isMercenary: false,
    stats: { STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    unallocatedPoints: 0, skill: null, status: 'idle',
    injuredUntil: null, civilization: 'LinhSon', isFounder,
    missionsCompleted: 0,
  };
}

describe('Upkeep System', () => {
  it('should calculate member upkeep based on grade', () => {
    // Grade F: BASE_UPKEEP(5) * GRADE_UPKEEP_MULT[F](0.8) = 4
    expect(calcMemberUpkeep({ grade: 'F', isMercenary: false })).toBe(4);
    // Grade E: 5 * 1.0 = 5
    expect(calcMemberUpkeep({ grade: 'E', isMercenary: false })).toBe(5);
    // Higher grade = more upkeep
    expect(calcMemberUpkeep({ grade: 'B', isMercenary: false })).toBeGreaterThan(
      calcMemberUpkeep({ grade: 'E', isMercenary: false }),
    );
  });

  it('mercenaries have 0 upkeep', () => {
    expect(calcMemberUpkeep({ grade: 'S', isMercenary: true })).toBe(0);
  });

  it('should calculate total upkeep for all members', () => {
    const members = [makeMember('F'), makeMember('F'), makeMember('F')];
    // 3 × grade-F upkeep (4 each) = 12
    expect(calcTotalUpkeep(members)).toBe(12);
  });

  it('should charge upkeep when gold is sufficient', () => {
    const members = [makeMember('F')]; // upkeep = 4/day
    const result = chargeUpkeep(100, members, 3);
    expect(result.newGold).toBe(100 - 4 * 3); // 88
    expect(result.debt).toBe(0);
  });

  it('should track debt when gold insufficient', () => {
    // grade-F upkeep = round(5 * 0.8) = 4/day; 4 gold = exactly 1 day affordable, 4 remain unpaid
    const members = [makeMember('F')];
    const result = chargeUpkeep(4, members, 5);
    expect(result.newGold).toBe(0);
    expect(result.debt).toBeGreaterThan(0);
    expect(result.daysInDebt).toBeGreaterThan(0);
  });

  it('should never remove founder from debt penalty', () => {
    const roster = [makeMember('F', true), makeMember('F')];
    const result = processDebtPenalty(roster, 5);
    const foundersRemoved = result.removedMembers.filter((m) => m.isFounder);
    expect(foundersRemoved.length).toBe(0);
  });

  it('should remove lowest-grade non-founder on debt penalty', () => {
    const roster = [makeMember('B'), makeMember('F'), makeMember('D')];
    const result = processDebtPenalty(roster, 5);
    expect(result.removedMembers.length).toBe(1);
    expect(result.removedMembers[0].grade).toBe('F'); // lowest grade evicted first
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
