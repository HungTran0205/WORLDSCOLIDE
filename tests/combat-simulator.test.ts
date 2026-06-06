import { describe, it, expect } from 'vitest';
import { calcMaxHp, calcAttackInterval, calcAutoAttackDamage, calcSkillDamage } from '@/game/systems/combat-formulas';
import { simulateCombat } from '@/game/systems/combat-simulator';
import { ENEMIES } from '@/game/data/enemies';
import type { Member } from '@/game/state/game-state';
import type { CombatEntity } from '@/game/systems/combat-types';
import {
  createPassiveState, applyPassiveTick, onDamageDealt,
  consumeShock, activateTeamBuff, isTeamBuffActive,
  resolveThienLuTimers, isCloneActive,
} from '@/game/systems/combat-passives';

function makeTestMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'test-member',
    name: 'Hero',
    grade: 'F',
    isMercenary: false,
    stats: { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 10 },
    unallocatedPoints: 0,
    skill: { id: 'danh-manh', name: 'Danh Manh', damageMultiplier: 1.25, cooldownMs: 8000, autoEnabled: false },
    status: 'idle',
    injuredUntil: null,
    civilization: 'LinhSon',
    isFounder: true,
    missionsCompleted: 0,
    ...overrides,
  };
}

describe('Combat Formulas', () => {
  it('should calculate max HP from END + flatHpBonus', () => {
    // base = 60; calcMaxHp(end, flatHpBonus) = floor(60 + end*5 + flatHpBonus)
    expect(calcMaxHp(10, 0)).toBe(110); // 60 + 10*5 + 0
    expect(calcMaxHp(20, 50)).toBe(210); // 60 + 20*5 + 50
  });

  it('should calculate attack interval with AGI scaling', () => {
    // Default weapon (longsword 1800ms base)
    expect(calcAttackInterval(0)).toBe(1800);  // 1800 / (1+0) = 1800
    expect(calcAttackInterval(100)).toBe(900);  // 1800 / 2 = 900
    expect(calcAttackInterval(50)).toBe(1200);  // 1800 / 1.5 = 1200

    // Dagger (1000ms base)
    expect(calcAttackInterval(100, 1000)).toBe(500); // 1000 / 2 = 500

    // Floor at 300ms
    expect(calcAttackInterval(1000, 1000)).toBeGreaterThanOrEqual(300);
  });

  it('should calculate auto-attack damage with defense', () => {
    const dmg = calcAutoAttackDamage(10, 10);
    expect(dmg).toBeGreaterThanOrEqual(1);

    // Higher STR = more damage
    expect(calcAutoAttackDamage(20, 10)).toBeGreaterThan(calcAutoAttackDamage(10, 10));

    // Higher target END = less damage
    expect(calcAutoAttackDamage(10, 20)).toBeLessThan(calcAutoAttackDamage(10, 5));
  });

  it('should floor damage at 1', () => {
    expect(calcAutoAttackDamage(0, 100)).toBe(1);
  });

  it('should calculate skill damage with DEX bonus', () => {
    const base = calcAutoAttackDamage(10, 5);
    const skillDmg = calcSkillDamage(base, 1.25, 10);
    expect(skillDmg).toBeGreaterThan(base);
  });
});

describe('Combat Simulator', () => {
  it('should defeat slimes with a decent founder', () => {
    // A genuinely "decent" founder wins this 1v3 on stats alone. (The old Son The
    // END+30% last-stand previously carried a floor-grade unit here; that passive is
    // now the gated, sword-only Ancestral Blessings, so the smoke test stands on merit.)
    const founder = makeTestMember({
      grade: 'B',
      stats: { STR: 22, END: 22, INT: 5, DEX: 10, CHA: 5, LCK: 10, AGI: 14 },
    });
    const enemies = [ENEMIES['slime'], ENEMIES['slime'], ENEMIES['slime']];
    const result = simulateCombat([founder], enemies);

    expect(result.outcome).not.toBe('full-wipe');
    expect(result.survivors.length).toBeGreaterThan(0);
    expect(result.ticks.length).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThan(0);
  });

  it('should produce full wipe against overwhelmingly strong enemies', () => {
    const weakMember = makeTestMember({
      stats: { STR: 1, END: 1, INT: 1, DEX: 1, CHA: 1, LCK: 1, AGI: 1 },
    });
    const enemies = Array(5).fill(ENEMIES['orc-warrior']);
    const result = simulateCombat([weakMember], enemies);

    expect(result.outcome).toBe('full-wipe');
    expect(result.injured.length).toBeGreaterThan(0);
  });

  it('should record death events', () => {
    const founder = makeTestMember({
      stats: { STR: 20, END: 20, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 10 },
    });
    const enemies = [ENEMIES['slime']];
    const result = simulateCombat([founder], enemies);

    const deathEvents = result.ticks.flatMap((t) =>
      t.events.filter((e) => e.type === 'death'),
    );
    expect(deathEvents.length).toBeGreaterThan(0);
  });

  it('should complete within MAX_TICKS', () => {
    const founder = makeTestMember();
    const enemies = [ENEMIES['slime']];
    const result = simulateCombat([founder], enemies);
    expect(result.durationMs).toBeLessThan(10000 * 500); // MAX_TICKS * TICK_MS
  });
});

// Helper to build a minimal CombatEntity for passive tests
function makeEntity(civId: string, hp = 100, maxHp = 100): CombatEntity {
  const baseStats = { STR: 10, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 10 };
  return {
    id: `test-${civId}`,
    name: civId,
    isAlly: true,
    maxHp,
    currentHp: hp,
    stats: { ...baseStats },
    baseStats: { ...baseStats },
    skill: null,
    level: 1,
    attackIntervalMs: 1000,
    nextAttackAt: 0,
    skillCooldownUntil: 0,
    statusEffects: [],
    abilities: [],
    civilization: civId,
    passiveState: createPassiveState(civId),
    dodgeRate: 0,
    blockRate: 0,
    critDmg: 1.5,
    hpRegenPerSec: 0,
  };
}

describe('LinhSon passive — Ancestral Blessings', () => {
  it('does NOT fire when HP > 30%, even with a full bar', () => {
    const entity = makeEntity('LinhSon', 60, 100); // 60% HP
    entity.blessedReady = true;
    applyPassiveTick(entity, 0);
    expect(entity.ancestralFired).toBeFalsy();
    expect(entity.stats.END).toBe(entity.baseStats!.END);
  });

  it('fires once at HP <= 30% with a full bar → END/STR/AGI ×1.2 + casting', () => {
    const entity = makeEntity('LinhSon', 25, 100); // 25% HP
    entity.blessedReady = true;
    applyPassiveTick(entity, 500);
    expect(entity.ancestralFired).toBe(true);
    expect(entity.blessed).toBe(true);
    expect(entity.animState).toBe('casting');
    expect(entity.stats.END).toBe(Math.floor(entity.baseStats!.END * 1.2));
    expect(entity.stats.STR).toBe(Math.floor(entity.baseStats!.STR * 1.2));
    expect(entity.stats.AGI).toBe(Math.floor(entity.baseStats!.AGI * 1.2));
  });

  it('does NOT fire without a full bar (blessedReady false)', () => {
    const entity = makeEntity('LinhSon', 25, 100);
    entity.blessedReady = false;
    applyPassiveTick(entity, 0);
    expect(entity.ancestralFired).toBeFalsy();
    expect(entity.stats.END).toBe(entity.baseStats!.END);
  });

  it('buff persists after healing above 30% (latch never reverts)', () => {
    const entity = makeEntity('LinhSon', 25, 100);
    entity.blessedReady = true;
    applyPassiveTick(entity, 0); // fires
    entity.currentHp = 60;       // heal back above the gate
    applyPassiveTick(entity, 1000);
    expect(entity.blessed).toBe(true);
    expect(entity.stats.END).toBe(Math.floor(entity.baseStats!.END * 1.2));
  });

  it('does not compound: ×1.2 stays stable across many ticks', () => {
    const entity = makeEntity('LinhSon', 25, 100);
    entity.blessedReady = true;
    for (let i = 0; i < 10; i++) applyPassiveTick(entity, i * 100);
    expect(entity.stats.END).toBe(Math.floor(entity.baseStats!.END * 1.2));
  });
});

describe('DeQuoc passive — Dien The Chi Huy', () => {
  it('should accumulate stacks on damage dealt', () => {
    const passive = createPassiveState('DeQuoc');
    onDamageDealt(passive);
    onDamageDealt(passive);
    expect(passive.stacks).toBe(2);
  });

  it('should trigger Shock at 3 stacks and reset stacks to 0', () => {
    const passive = createPassiveState('DeQuoc');
    onDamageDealt(passive);
    onDamageDealt(passive);
    onDamageDealt(passive);
    expect(passive.shockReady).toBe(true);
    expect(passive.stacks).toBe(0);
  });

  it('should consume Shock once and return false on second call', () => {
    const passive = createPassiveState('DeQuoc');
    passive.shockReady = true;
    expect(consumeShock(passive)).toBe(true);
    expect(consumeShock(passive)).toBe(false);
  });

  it('should activate team buff for 5 seconds', () => {
    const passive = createPassiveState('DeQuoc');
    activateTeamBuff(passive, 1000);
    expect(isTeamBuffActive(passive, 1000)).toBe(true);
    expect(isTeamBuffActive(passive, 5999)).toBe(true);
    expect(isTeamBuffActive(passive, 6001)).toBe(false);
  });

  it('should not re-stack after Shock triggers (stacks reset to 0)', () => {
    const passive = createPassiveState('DeQuoc');
    for (let i = 0; i < 3; i++) onDamageDealt(passive);
    consumeShock(passive); // consume shock
    onDamageDealt(passive); // next hit starts fresh
    expect(passive.stacks).toBe(1);
  });
});

describe('ThienLu passive — Tinh Lo', () => {
  it('should NOT have permanent AGI bonus at init', () => {
    const entity = makeEntity('ThienLu');
    // applyPassiveOnInit no longer modifies AGI
    expect(entity.stats.AGI).toBe(entity.baseStats!.AGI);
  });

  it('should activate crit bonus at 5 stacks', () => {
    const passive = createPassiveState('ThienLu');
    for (let i = 0; i < 5; i++) onDamageDealt(passive);
    expect(passive.critBonus).toBe(0.15);
    expect(passive.critBonusUntil).toBe(-1); // Pending timestamp
  });

  it('should activate clone at 15 stacks and reset', () => {
    const passive = createPassiveState('ThienLu');
    for (let i = 0; i < 15; i++) onDamageDealt(passive);
    expect(passive.cloneUntil).toBe(-1); // Pending timestamp
    expect(passive.stacks).toBe(0);
    expect(passive.critBonus).toBe(0); // Consumed by clone activation
  });

  it('resolveThienLuTimers should set crit and clone timestamps', () => {
    const passive = createPassiveState('ThienLu');
    passive.critBonusUntil = -1;
    passive.cloneUntil = -1;
    const result = resolveThienLuTimers(passive, 1000);
    expect(result.critActivated).toBe(true);
    expect(result.cloneActivated).toBe(true);
    expect(passive.critBonusUntil).toBe(6000);
    expect(passive.cloneUntil).toBe(6000);
  });

  it('crit bonus should expire after 5 seconds', () => {
    const passive = createPassiveState('ThienLu');
    passive.critBonus = 0.15;
    passive.critBonusUntil = 5000;
    resolveThienLuTimers(passive, 6000); // past expiry
    expect(passive.critBonus).toBe(0);
    expect(passive.critBonusUntil).toBe(0);
  });

  it('clone should expire after 5 seconds', () => {
    const passive = createPassiveState('ThienLu');
    passive.cloneUntil = 5000;
    resolveThienLuTimers(passive, 6000); // past expiry
    expect(isCloneActive(passive, 6000)).toBe(false);
  });

  it('isCloneActive should return true while within duration', () => {
    const passive = createPassiveState('ThienLu');
    passive.cloneUntil = 5000;
    expect(isCloneActive(passive, 4999)).toBe(true);
    expect(isCloneActive(passive, 5000)).toBe(true);
    expect(isCloneActive(passive, 5001)).toBe(false);
  });
});
