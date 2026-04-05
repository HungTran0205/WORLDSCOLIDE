import { describe, it, expect } from 'vitest';
import { calcDerivedCombatStats } from '@/game/systems/derived-combat-stats';
import { calcDerivedGuildStats } from '@/game/systems/derived-guild-stats';
import { calcMemberDerivedStats } from '@/game/systems/member-derived-stats';
import {
  selectMemberDerivedStats,
  selectMemberCombatStats,
  selectMemberGuildStats,
} from '@/game/state/selectors';
import { calcInfirmaryRecoveryMult } from '@/game/systems/facility-production-system';
import type { Member, Stats } from '@/game/state/game-state';

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return { STR: 10, END: 10, INT: 10, DEX: 10, CHA: 10, LCK: 10, AGI: 10, ...overrides };
}

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'test',
    name: 'Tester',
    level: 1,
    exp: 0,
    stats: makeStats(),
    unallocatedPoints: 0,
    skill: null,
    status: 'idle',
    injuredUntil: null,
    civilization: 'LinhSon',
    isFounder: false,
    rank: 'MEMBER',
    missionsCompleted: 0,
    ...overrides,
  };
}

// ─── Combat formula unit tests ────────────────────────────────────────────────

describe('calcDerivedCombatStats — formulas', () => {
  it('maxHp: 50 + END*5 + level*10', () => {
    expect(calcDerivedCombatStats(makeStats({ END: 10 }), 1).maxHp).toBe(110); // 50+50+10
    expect(calcDerivedCombatStats(makeStats({ END: 20 }), 5).maxHp).toBe(200); // 50+100+50
  });

  it('critRate caps at 0.50', () => {
    const low = calcDerivedCombatStats(makeStats({ LCK: 5 }), 1).critRate;
    const high = calcDerivedCombatStats(makeStats({ LCK: 200 }), 1).critRate;
    expect(low).toBeLessThan(0.5);
    expect(high).toBe(0.5);
  });

  it('critDmg: 1.5 + LCK*0.005', () => {
    const s = calcDerivedCombatStats(makeStats({ LCK: 10 }), 1);
    expect(s.critDmg).toBeCloseTo(1.55);
  });

  it('dodgeRate: AGI*0.002 + DEX*0.001, cap 0.30', () => {
    const uncapped = calcDerivedCombatStats(makeStats({ AGI: 10, DEX: 10 }), 1).dodgeRate;
    expect(uncapped).toBeCloseTo(0.03);
    const capped = calcDerivedCombatStats(makeStats({ AGI: 200, DEX: 200 }), 1).dodgeRate;
    expect(capped).toBe(0.3);
  });

  it('blockRate: END*0.002 + STR*0.001, cap 0.25', () => {
    const uncapped = calcDerivedCombatStats(makeStats({ END: 10, STR: 10 }), 1).blockRate;
    expect(uncapped).toBeCloseTo(0.03);
    const capped = calcDerivedCombatStats(makeStats({ END: 200, STR: 200 }), 1).blockRate;
    expect(capped).toBe(0.25);
  });

  it('hpRegen: END*0.1 + level*0.05 (rounded)', () => {
    const regen = calcDerivedCombatStats(makeStats({ END: 10 }), 5).hpRegen;
    expect(regen).toBeCloseTo(1.25); // 1.0 + 0.25
  });

  it('skillHaste: INT*0.003, cap 0.30', () => {
    const low = calcDerivedCombatStats(makeStats({ INT: 10 }), 1).skillHaste;
    expect(low).toBeCloseTo(0.03);
    const capped = calcDerivedCombatStats(makeStats({ INT: 200 }), 1).skillHaste;
    expect(capped).toBe(0.3);
  });

  it('statusResist: INT*0.002 + END*0.001, cap 0.40', () => {
    const low = calcDerivedCombatStats(makeStats({ INT: 10, END: 10 }), 1).statusResist;
    expect(low).toBeCloseTo(0.03);
    const capped = calcDerivedCombatStats(makeStats({ INT: 300, END: 300 }), 1).statusResist;
    expect(capped).toBe(0.4);
  });

  it('moraleAura: CHA*0.001', () => {
    expect(calcDerivedCombatStats(makeStats({ CHA: 20 }), 1).moraleAura).toBeCloseTo(0.02);
  });

  it('hitsPerSecond is inverse of attackIntervalMs', () => {
    const s = calcDerivedCombatStats(makeStats({ AGI: 50 }), 1);
    expect(s.hitsPerSecond).toBeCloseTo(1000 / s.attackIntervalMs, 1);
  });

  it('attackIntervalMs floor at 300ms', () => {
    const s = calcDerivedCombatStats(makeStats({ AGI: 1000 }), 1, 1000);
    expect(s.attackIntervalMs).toBe(300);
  });

  it('defenseRating cap 0.75', () => {
    const high = calcDerivedCombatStats(makeStats({ END: 9999 }), 1).defenseRating;
    expect(high).toBe(0.75);
  });
});

// ─── Guild formula unit tests ─────────────────────────────────────────────────

describe('calcDerivedGuildStats — formulas', () => {
  it('influence: CHA*2 + INT*1 + level*0.5 (floored)', () => {
    expect(calcDerivedGuildStats(makeStats({ CHA: 10, INT: 5 }), 2)).toMatchObject({
      influence: 26, // 20+5+1
    });
  });

  it('stamina: END*3 + STR*1 (floored)', () => {
    expect(calcDerivedGuildStats(makeStats({ END: 10, STR: 5 }), 1).stamina).toBe(35);
  });

  it('craftSkill: DEX*2 + INT*1 (floored)', () => {
    expect(calcDerivedGuildStats(makeStats({ DEX: 10, INT: 5 }), 1).craftSkill).toBe(25);
  });

  it('trainingEff: (DEX+AGI)*0.002', () => {
    expect(calcDerivedGuildStats(makeStats({ DEX: 10, AGI: 10 }), 1).trainingEff).toBeCloseTo(0.04);
  });

  it('gatherSpeed: STR*0.004', () => {
    expect(calcDerivedGuildStats(makeStats({ STR: 10 }), 1).gatherSpeed).toBeCloseTo(0.04);
  });

  it('negotiation: CHA*2 + LCK*1 (floored)', () => {
    expect(calcDerivedGuildStats(makeStats({ CHA: 10, LCK: 5 }), 1).negotiation).toBe(25);
  });

  it('recovery: clamps to 0.2 minimum', () => {
    const high = calcDerivedGuildStats(makeStats({ END: 9999, INT: 9999 }), 1).recovery;
    expect(high).toBe(0.2);
  });

  it('recovery: default stats gives <1.0', () => {
    const r = calcDerivedGuildStats(makeStats({ END: 10, INT: 10 }), 1).recovery;
    expect(r).toBeLessThan(1.0);
    expect(r).toBeGreaterThan(0.2);
  });

  it('fortune: LCK*3 + CHA*0.5 (floored)', () => {
    expect(calcDerivedGuildStats(makeStats({ LCK: 10, CHA: 10 }), 1).fortune).toBe(35);
  });
});

// ─── Integration parity tests (unified read-model consistency) ────────────────

describe('calcMemberDerivedStats — parity', () => {
  it('combat section matches standalone calcDerivedCombatStats', () => {
    const m = makeMember({ stats: makeStats({ STR: 15, END: 12, AGI: 20 }) });
    const unified = calcMemberDerivedStats(m).combat;
    const standalone = calcDerivedCombatStats(m.stats, m.level);
    expect(unified).toEqual(standalone);
  });

  it('guild section matches standalone calcDerivedGuildStats', () => {
    const m = makeMember({ stats: makeStats({ CHA: 20, INT: 15 }), level: 3 });
    const unified = calcMemberDerivedStats(m).guild;
    const standalone = calcDerivedGuildStats(m.stats, m.level);
    expect(unified).toEqual(standalone);
  });

  it('higher level produces higher maxHp and hpRegen', () => {
    const low = calcMemberDerivedStats(makeMember({ level: 1 }));
    const high = calcMemberDerivedStats(makeMember({ level: 10 }));
    expect(high.combat.maxHp).toBeGreaterThan(low.combat.maxHp);
    expect(high.combat.hpRegen).toBeGreaterThan(low.combat.hpRegen);
  });

  it('higher level produces higher influence', () => {
    const low = calcMemberDerivedStats(makeMember({ level: 1 }));
    const high = calcMemberDerivedStats(makeMember({ level: 10 }));
    expect(high.guild.influence).toBeGreaterThan(low.guild.influence);
  });
});

// ─── Selector tests ───────────────────────────────────────────────────────────

describe('Selectors — member view-models', () => {
  it('selectMemberCombatStats returns combat section only', () => {
    const m = makeMember();
    const cs = selectMemberCombatStats(m);
    expect(cs).toHaveProperty('maxHp');
    expect(cs).toHaveProperty('dodgeRate');
    expect(cs).toHaveProperty('blockRate');
    expect(cs).toHaveProperty('hpRegen');
    expect(cs).toHaveProperty('skillHaste');
    expect(cs).toHaveProperty('statusResist');
    expect(cs).not.toHaveProperty('influence');
  });

  it('selectMemberGuildStats returns guild section only', () => {
    const m = makeMember();
    const gs = selectMemberGuildStats(m);
    expect(gs).toHaveProperty('influence');
    expect(gs).toHaveProperty('stamina');
    expect(gs).toHaveProperty('fortune');
    expect(gs).not.toHaveProperty('maxHp');
  });

  it('selectMemberDerivedStats contains both sections', () => {
    const m = makeMember();
    const full = selectMemberDerivedStats(m);
    expect(full.combat).toHaveProperty('maxHp');
    expect(full.guild).toHaveProperty('influence');
  });

  it('selectMemberCombatStats equals calcDerivedCombatStats directly', () => {
    const m = makeMember({ stats: makeStats({ LCK: 30, AGI: 40 }), level: 5 });
    expect(selectMemberCombatStats(m)).toEqual(calcDerivedCombatStats(m.stats, m.level));
  });
});

// ─── Facility regression tests ────────────────────────────────────────────────

describe('Facility — infirmary recovery regression', () => {
  it('returns 1.0 with no assigned members', () => {
    expect(calcInfirmaryRecoveryMult([], 1)).toBe(1.0);
  });

  it('level 1 infirmary reduces recovery time below 1.0', () => {
    const m = makeMember({ stats: makeStats({ END: 20, INT: 20 }) });
    const mult = calcInfirmaryRecoveryMult([m], 1);
    expect(mult).toBeGreaterThanOrEqual(0.2);
    expect(mult).toBeLessThan(1.0);
  });

  it('level 3 infirmary reduces recovery further than level 1', () => {
    const m = makeMember({ stats: makeStats({ END: 20, INT: 20 }) });
    const lv1 = calcInfirmaryRecoveryMult([m], 1);
    const lv3 = calcInfirmaryRecoveryMult([m], 3);
    expect(lv3).toBeLessThan(lv1);
  });

  it('floor at 0.2 — never goes negative', () => {
    const powerful = makeMember({ stats: makeStats({ END: 9999, INT: 9999 }) });
    expect(calcInfirmaryRecoveryMult([powerful], 3)).toBeGreaterThanOrEqual(0.2);
  });

  it('multiple high-END members do not break floor', () => {
    const members = Array(5).fill(null).map(() => makeMember({ stats: makeStats({ END: 100, INT: 100 }) }));
    expect(calcInfirmaryRecoveryMult(members, 3)).toBeGreaterThanOrEqual(0.2);
  });
});

describe('Facility — guild stats scale correctly after formula changes', () => {
  it('higher trainingEff increases daily EXP at Training Yard (indirect)', () => {
    // Verify that trainingEff grows with DEX + AGI as formula expects
    const low = calcDerivedGuildStats(makeStats({ DEX: 5, AGI: 5 }), 1).trainingEff;
    const high = calcDerivedGuildStats(makeStats({ DEX: 30, AGI: 30 }), 1).trainingEff;
    expect(high).toBeGreaterThan(low);
  });

  it('higher gatherSpeed increases workshop output multiplier', () => {
    const low = calcDerivedGuildStats(makeStats({ STR: 5 }), 1).gatherSpeed;
    const high = calcDerivedGuildStats(makeStats({ STR: 30 }), 1).gatherSpeed;
    expect(high).toBeGreaterThan(low);
    // speedMult = 1 + gatherSpeed should always be >= 1
    expect(1 + low).toBeGreaterThanOrEqual(1);
    expect(1 + high).toBeGreaterThanOrEqual(1);
  });

  it('negotiation stays finite and non-negative', () => {
    const neg = calcDerivedGuildStats(makeStats({ CHA: 0, LCK: 0 }), 1).negotiation;
    expect(neg).toBe(0);
    const high = calcDerivedGuildStats(makeStats({ CHA: 100, LCK: 100 }), 1).negotiation;
    expect(Number.isFinite(high)).toBe(true);
  });
});
