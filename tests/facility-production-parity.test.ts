/**
 * Verify online tick-by-tick production matches offline catch-up over 1 game-day.
 *
 * 1 game-day = 14400 real ticks (4h × 3600s @ 1Hz scheduler).
 * Online: loop processLoggingSiteTick / processStoneQuarryTick 14400 times.
 * Offline: single processFacilityProduction(gameDays=1) call.
 * Difference must be < 1 (floor rounding only).
 */

import { describe, it, expect } from 'vitest';
import type { GuildFacility, Member } from '@/game/state/game-state';
import {
  processLoggingSiteTick,
  processFacilityProduction,
} from '@/game/systems/facility-production-system';
import { processStoneQuarryTick } from '@/game/systems/stone-quarry-production-system';

const TICKS_PER_GAMEDAY = 14400;

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'm1',
    name: 'Tester',
    level: 5,
    exp: 0,
    stats: { STR: 20, END: 15, INT: 10, DEX: 10, CHA: 5, LCK: 5, AGI: 8 },
    unallocatedPoints: 0,
    skill: null,
    status: 'assigned',
    injuredUntil: null,
    civilization: 'Viet',
    isFounder: false,
    rank: 'MEMBER',
    missionsCompleted: 0,
    craftSkills: {
      woodcutting: { level: 0, xpAccumulated: 0 },
      mining: { level: 0, xpAccumulated: 0 },
      alchemy: { level: 0, xpAccumulated: 0 },
    },
    ...overrides,
  };
}

function makeFacility(type: 'logging-site' | 'stone-quarry', memberId: string): GuildFacility {
  return {
    id: type,
    type,
    level: 1,
    assignedMemberIds: [memberId],
    placedSlot: 0,
    woodReserve: type === 'logging-site' ? 100000 : null, // huge reserve so cap never bites in 1 day
  };
}

describe('Facility Production Parity (online vs offline)', () => {
  it('logging-site: 14400 online ticks ≈ offline 1 game-day', () => {
    const member = makeMember();
    const facility = makeFacility('logging-site', member.id);

    // Online: simulate 14400 ticks, accumulate wood produced
    let onlineWood = 0;
    let reserve = facility.woodReserve!;
    for (let i = 0; i < TICKS_PER_GAMEDAY; i++) {
      const tickFacility: GuildFacility = { ...facility, woodReserve: reserve };
      const result = processLoggingSiteTick([tickFacility], [member]);
      onlineWood += result.woodProduced;
      const update = result.reserveUpdates[0];
      if (update) reserve = update.newReserve;
      if (reserve <= 0) break;
    }

    // Offline: 1 game-day catch-up
    const offlineResults = processFacilityProduction([facility], [member], 1, 0);
    const offlineWood = offlineResults.find((r) => r.facilityType === 'logging-site')?.itemGains.WOOD ?? 0;

    // Floor() applied offline; online sums fractional values. Allow 1-unit gap.
    expect(Math.abs(Math.floor(onlineWood) - offlineWood)).toBeLessThanOrEqual(1);
  });

  it('stone-quarry: 14400 online ticks ≈ offline 1 game-day (excluding vein strikes)', () => {
    const member = makeMember();
    const facility = makeFacility('stone-quarry', member.id);

    // Online: simulate 14400 ticks. Use mcXpGains.xpGained (= base stone, no vein bonus)
    // to compare apples-to-apples with offline (which skips vein strikes).
    let onlineStone = 0;
    for (let i = 0; i < TICKS_PER_GAMEDAY; i++) {
      const result = processStoneQuarryTick([facility], [member]);
      const xpGain = result.mcXpGains[0];
      if (xpGain) onlineStone += xpGain.xpGained;
    }

    const offlineResults = processFacilityProduction([facility], [member], 1, 0);
    const offlineStone = offlineResults.find((r) => r.facilityType === 'stone-quarry')?.itemGains.STONE ?? 0;

    expect(Math.abs(Math.floor(onlineStone) - offlineStone)).toBeLessThanOrEqual(1);
  });
});
