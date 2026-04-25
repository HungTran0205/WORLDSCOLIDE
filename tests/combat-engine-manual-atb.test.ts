import { describe, it, expect } from 'vitest';
import { CombatEngine } from '@/game/systems/combat-engine';
import type { Member } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';
import type { Formation } from '@/game/systems/combat-arena-types';

function makeMember(id: string): Member {
  return {
    id, name: id, level: 10, exp: 0,
    stats: { STR: 15, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5 },
    unallocatedPoints: 0, skill: null,
    status: 'idle', injuredUntil: null,
    // Use ranged archetype so attack fires from home in same tick (no step-forward delay)
    civilization: 'human', archetype: 'scholar',
    isFounder: false, rank: 'MEMBER', missionsCompleted: 0,
  };
}

function makeEnemy(id: string): EnemyTemplate {
  return {
    id, name: id, level: 5,
    stats: { STR: 8, END: 8, INT: 1, DEX: 1, CHA: 0, LCK: 1, AGI: 2 },
    skill: null, abilities: [], loot: [],
    spriteId: 'slime',
  };
}

function makeEngine(manual = true): { engine: CombatEngine; allyId: string } {
  const engine = new CombatEngine();
  const members = [makeMember('ally1')];
  const formation: Formation = ['ally1', null, null, null, null, null];
  const enemies = [makeEnemy('enemy1')];
  engine.init(members, formation, enemies);
  engine.setManualMode(manual);
  return { engine, allyId: 'ally1' };
}

describe('CombatEngine — manual ATB pause', () => {
  it('freezes time when ally turn fires in manual mode', () => {
    const { engine, allyId } = makeEngine(true);
    const allyIntervalMs = engine.entities.find(e => e.id === allyId)!.attackIntervalMs;

    // Advance past the ally's first turn
    engine.tick(allyIntervalMs + 100);

    expect(engine.getPausedForAllyTurn()).not.toBeNull();

    // Additional ticks must return empty (engine frozen)
    const events = engine.tick(5000);
    expect(events).toHaveLength(0);
  });

  it('enemies do not attack while engine is paused for ally turn', () => {
    const { engine, allyId } = makeEngine(true);
    const allyIntervalMs = engine.entities.find(e => e.id === allyId)!.attackIntervalMs;

    engine.tick(allyIntervalMs + 100);
    expect(engine.getPausedForAllyTurn()).not.toBeNull();

    const allyHpBefore = engine.entities.find(e => e.id === allyId)!.currentHp;

    // Large tick — enemies would attack many times if not frozen
    engine.tick(10_000);

    const allyHpAfter = engine.entities.find(e => e.id === allyId)!.currentHp;
    expect(allyHpAfter).toBe(allyHpBefore);
  });

  it('resumes and ally attacks after player queues an attack', () => {
    const { engine, allyId } = makeEngine(true);
    const allyIntervalMs = engine.entities.find(e => e.id === allyId)!.attackIntervalMs;

    engine.tick(allyIntervalMs + 100);
    const pausedId = engine.getPausedForAllyTurn();
    expect(pausedId).not.toBeNull();

    engine.queueAttack(pausedId!);

    const events = engine.tick(200);
    expect(events.some(e => e.type === 'auto-attack')).toBe(true);
    expect(engine.getPausedForAllyTurn()).toBeNull();
  });

  it('auto mode: both sides attack without pausing', () => {
    const { engine } = makeEngine(false);

    const events = engine.tick(10_000);

    const allyAttacks = events.filter(e => e.type === 'auto-attack' &&
      engine.entities.find(en => en.id === (e as any).attackerId)?.isAlly,
    );
    const enemyAttacks = events.filter(e => e.type === 'auto-attack' &&
      !engine.entities.find(en => en.id === (e as any).attackerId)?.isAlly,
    );

    expect(allyAttacks.length).toBeGreaterThan(0);
    expect(enemyAttacks.length).toBeGreaterThan(0);
    expect(engine.getPausedForAllyTurn()).toBeNull();
  });

  it('clears pause when manual mode is toggled off', () => {
    const { engine, allyId } = makeEngine(true);
    const allyIntervalMs = engine.entities.find(e => e.id === allyId)!.attackIntervalMs;

    engine.tick(allyIntervalMs + 100);
    expect(engine.getPausedForAllyTurn()).not.toBeNull();

    // Switch to auto mode
    engine.setManualMode(false);
    engine.tick(100);

    expect(engine.getPausedForAllyTurn()).toBeNull();
    // Engine should now advance (enemies can attack)
    const events = engine.tick(5000);
    expect(events.length).toBeGreaterThan(0);
  });
});
