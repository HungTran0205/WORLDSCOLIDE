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
import { GRADE_HP_BONUS, gradeIndex } from '@/game/data/grades';
import type { Member, Stats } from '@/game/state/game-state';
import type { Grade } from '@/game/data/grades';

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return { STR: 10, END: 10, INT: 10, DEX: 10, CHA: 10, LCK: 10, AGI: 10, ...overrides };
}

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'test',
    name: 'Tester',
    grade: 'F' as Grade,
    isMercenary: false,
    stats: makeStats(),
    unallocatedPoints: 0,
    skill: null,
    status: 'idle',
    injuredUntil: null,
    civilization: 'LinhSon',
    isFounder: false,
    missionsCompleted: 0,
    ...overrides,
  };
}

// ─── Combat formula unit tests ────────────────────────────────────────────────

describe('calcDerivedCombatStats — formulas', () => {
  it('maxHp: 60 + END*5 + flatHpBonus', () => {
    // Grade F: hpBonus=0 → 60 + 10*5 + 0 = 110
    expect(calcDerivedCombatStats(makeStats({ END: 10 }), GRADE_HP_BONUS['F']).maxHp).toBe(110);
    // Grade B: hpBonus=60 → 60 + 10*5 + 60 = 170
    expect(calcDerivedCombatStats(makeStats({ END: 10 }), GRADE_HP_BONUS['B']).maxHp).toBe(170);
  });

  it('critRate caps at 0.50', () => {
    const low = calcDerivedCombatStats(makeStats({ LCK: 5 }), 0).critRate;
    const high = calcDerivedCombatStats(makeStats({ LCK: 200 }), 0).critRate;
    expect(low).toBeLessThan(0.5);
    expect(high).toBe(0.5);
  });

  it('critDmg: 1.5 + LCK*0.005', () => {
    const s = calcDerivedCombatStats(makeStats({ LCK: 10 }), 0);
    expect(s.critDmg).toBeCloseTo(1.55);
  });

  it('dodgeRate: AGI*0.002 + DEX*0.001, cap 0.30', () => {
    const uncapped = calcDerivedCombatStats(makeStats({ AGI: 10, DEX: 10 }), 0).dodgeRate;
    expect(uncapped).toBeCloseTo(0.03);
    const capped = calcDerivedCombatStats(makeStats({ AGI: 200, DEX: 200 }), 0).dodgeRate;
    expect(capped).toBe(0.3);
  });

  it('blockRate: END*0.002 + STR*0.001, cap 0.25', () => {
    const uncapped = calcDerivedCombatStats(makeStats({ END: 10, STR: 10 }), 0).blockRate;
    expect(uncapped).toBeCloseTo(0.03);
    const capped = calcDerivedCombatStats(makeStats({ END: 200, STR: 200 }), 0).blockRate;
    expect(capped).toBe(0.25);
  });

  it('hpRegen: END*0.1 (rounded)', () => {
    const regen = calcDerivedCombatStats(makeStats({ END: 10 }), 0).hpRegen;
    expect(regen).toBeCloseTo(1.0);
  });

  it('skillHaste: INT*0.003, cap 0.30', () => {
    const low = calcDerivedCombatStats(makeStats({ INT: 10 }), 0).skillHaste;
    expect(low).toBeCloseTo(0.03);
    const capped = calcDerivedCombatStats(makeStats({ INT: 200 }), 0).skillHaste;
    expect(capped).toBe(0.3);
  });

  it('statusResist: INT*0.002 + END*0.001, cap 0.40', () => {
    const low = calcDerivedCombatStats(makeStats({ INT: 10, END: 10 }), 0).statusResist;
    expect(low).toBeCloseTo(0.03);
    const capped = calcDerivedCombatStats(makeStats({ INT: 300, END: 300 }), 0).statusResist;
    expect(capped).toBe(0.4);
  });

  it('moraleAura: CHA*0.001', () => {
    expect(calcDerivedCombatStats(makeStats({ CHA: 20 }), 0).moraleAura).toBeCloseTo(0.02);
  });

  it('hitsPerSecond is inverse of attackIntervalMs', () => {
    const s = calcDerivedCombatStats(makeStats({ AGI: 50 }), 0);
    expect(s.hitsPerSecond).toBeCloseTo(1000 / s.attackIntervalMs, 1);
  });

  it('attackIntervalMs floor at 300ms', () => {
    const s = calcDerivedCombatStats(makeStats({ AGI: 1000 }), 0, 1000);
    expect(s.attackIntervalMs).toBe(300);
  });

  it('defenseRating cap 0.75', () => {
    const high = calcDerivedCombatStats(makeStats({ END: 9999 }), 0).defenseRating;
    expect(high).toBe(0.75);
  });
});

// ─── Guild formula unit tests ─────────────────────────────────────────────────

describe('calcDerivedGuildStats — formulas', () => {
  it('influence: CHA*2 + INT*1 + gradeIdx*1 (floored)', () => {
    // gradeIndex('E') = 1
    expect(calcDerivedGuildStats(makeStats({ CHA: 10, INT: 5 }), gradeIndex('E'))).toMatchObject({
      influence: 26, // 20+5+1
    });
  });

  it('stamina: END*3 + STR*1 (floored)', () => {
    expect(calcDerivedGuildStats(makeStats({ END: 10, STR: 5 }), 0).stamina).toBe(35);
  });

  it('craftSkill: DEX*2 + INT*1 (floored)', () => {
    expect(calcDerivedGuildStats(makeStats({ DEX: 10, INT: 5 }), 0).craftSkill).toBe(25);
  });

  it('trainingEff: (DEX+AGI)*0.002', () => {
    expect(calcDerivedGuildStats(makeStats({ DEX: 10, AGI: 10 }), 0).trainingEff).toBeCloseTo(0.04);
  });

  it('gatherSpeed: STR*0.004', () => {
    expect(calcDerivedGuildStats(makeStats({ STR: 10 }), 0).gatherSpeed).toBeCloseTo(0.04);
  });

  it('negotiation: CHA*2 + LCK*1 (floored)', () => {
    expect(calcDerivedGuildStats(makeStats({ CHA: 10, LCK: 5 }), 0).negotiation).toBe(25);
  });

  it('recovery: clamps to 0.2 minimum', () => {
    const high = calcDerivedGuildStats(makeStats({ END: 9999, INT: 9999 }), 0).recovery;
    expect(high).toBe(0.2);
  });

  it('recovery: default stats gives <1.0', () => {
    const r = calcDerivedGuildStats(makeStats({ END: 10, INT: 10 }), 0).recovery;
    expect(r).toBeLessThan(1.0);
    expect(r).toBeGreaterThan(0.2);
  });

  it('fortune: LCK*3 + CHA*0.5 (floored)', () => {
    expect(calcDerivedGuildStats(makeStats({ LCK: 10, CHA: 10 }), 0).fortune).toBe(35);
  });
});

// ─── Integration parity tests (unified read-model consistency) ────────────────

describe('calcMemberDerivedStats — parity', () => {
  it('combat section matches standalone calcDerivedCombatStats', () => {
    const m = makeMember({ stats: makeStats({ STR: 15, END: 12, AGI: 20 }) });
    const unified = calcMemberDerivedStats(m).combat;
    const standalone = calcDerivedCombatStats(m.stats, GRADE_HP_BONUS[m.grade]);
    expect(unified).toEqual(standalone);
  });

  it('guild section matches standalone calcDerivedGuildStats', () => {
    const m = makeMember({ stats: makeStats({ CHA: 20, INT: 15 }), grade: 'D' as Grade });
    const unified = calcMemberDerivedStats(m).guild;
    const standalone = calcDerivedGuildStats(m.stats, gradeIndex(m.grade));
    expect(unified).toEqual(standalone);
  });

  it('higher grade produces higher maxHp', () => {
    const low = calcMemberDerivedStats(makeMember({ grade: 'F' as Grade }));
    const high = calcMemberDerivedStats(makeMember({ grade: 'S' as Grade }));
    expect(high.combat.maxHp).toBeGreaterThan(low.combat.maxHp);
  });

  it('higher grade produces higher influence', () => {
    const low = calcMemberDerivedStats(makeMember({ grade: 'F' as Grade }));
    const high = calcMemberDerivedStats(makeMember({ grade: 'S' as Grade }));
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
    const m = makeMember({ stats: makeStats({ LCK: 30, AGI: 40 }), grade: 'C' as Grade });
    expect(selectMemberCombatStats(m)).toEqual(
      calcDerivedCombatStats(m.stats, GRADE_HP_BONUS[m.grade]),
    );
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
    const low = calcDerivedGuildStats(makeStats({ DEX: 5, AGI: 5 }), 0).trainingEff;
    const high = calcDerivedGuildStats(makeStats({ DEX: 30, AGI: 30 }), 0).trainingEff;
    expect(high).toBeGreaterThan(low);
  });

  it('higher gatherSpeed increases workshop output multiplier', () => {
    const low = calcDerivedGuildStats(makeStats({ STR: 5 }), 0).gatherSpeed;
    const high = calcDerivedGuildStats(makeStats({ STR: 30 }), 0).gatherSpeed;
    expect(high).toBeGreaterThan(low);
    expect(1 + low).toBeGreaterThanOrEqual(1);
    expect(1 + high).toBeGreaterThanOrEqual(1);
  });

  it('negotiation stays finite and non-negative', () => {
    const neg = calcDerivedGuildStats(makeStats({ CHA: 0, LCK: 0 }), 0).negotiation;
    expect(neg).toBe(0);
    const high = calcDerivedGuildStats(makeStats({ CHA: 100, LCK: 100 }), 0).negotiation;
    expect(Number.isFinite(high)).toBe(true);
  });
});
