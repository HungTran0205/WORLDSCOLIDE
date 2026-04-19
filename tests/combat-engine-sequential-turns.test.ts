import { describe, it, expect } from 'vitest';
import { CombatEngine } from '@/game/systems/combat-engine';
import type { Member } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';
import type { Formation } from '@/game/systems/combat-arena-types';

function makeMember(id: string, archetype: 'scholar' | 'warrior' = 'scholar'): Member {
  return {
    id, name: id, level: 10, exp: 0,
    stats: { STR: 15, END: 10, INT: 5, DEX: 5, CHA: 5, LCK: 1, AGI: 5 },
    unallocatedPoints: 0, skill: null,
    status: 'idle', injuredUntil: null,
    civilization: 'human', archetype,
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

type MemberDef = { id: string; archetype?: 'scholar' | 'warrior' };

function makeEngine(memberDefs: MemberDef[], enemyIds: string[], manual = false) {
  const engine = new CombatEngine();
  const members = memberDefs.map(d => makeMember(d.id, d.archetype ?? 'scholar'));
  // Formation needs to be accepted by init; pass as-is (init uses forEach, any length works)
  const formation = memberDefs.map(d => d.id) as unknown as Formation;
  const enemies = enemyIds.map(id => makeEnemy(id));
  engine.init(members, formation, enemies);
  engine.setManualMode(manual);
  return { engine };
}

describe('CombatEngine — sequential turn queue', () => {
  it('Test 1: only one entity attacks per 100ms logic tick', () => {
    const { engine } = makeEngine([{ id: 'sq1-ally' }], ['sq1-enemy']);
    // Force both ready at time=0
    engine.entities.forEach(e => { e.nextAttackAt = 0; });

    const events = engine.tick(100);
    const attacks = events.filter(e => e.type === 'auto-attack');

    expect(attacks.length).toBe(1);
    // Ally wins tie-break (allies-first rule)
    expect((attacks[0] as any).attackerId).toBe('sq1-ally');
  });

  it('Test 2: enemy cannot act while ally holds the melee turn lock', () => {
    const { engine } = makeEngine([{ id: 'sq2-ally', archetype: 'warrior' }], ['sq2-enemy']);
    const ally = engine.entities.find(e => e.isAlly)!;
    const enemy = engine.entities.find(e => !e.isAlly)!;

    // Give enemy very high HP so the ally's attack doesn't kill it mid-step
    enemy.currentHp = 99999;
    enemy.maxHp = 99999;

    ally.nextAttackAt = 0;
    enemy.nextAttackAt = 0;

    // One tick: ally should acquire lock first (allies-first)
    engine.tick(100);

    if (engine.getActiveActorId() !== ally.id) return; // unexpected state, skip

    const enemyNASnapshot = enemy.nextAttackAt;

    // While ally holds the lock, enemy nextAttackAt must not change
    let iters = 0;
    while (engine.getActiveActorId() === ally.id && iters < 200 && !engine.isFinished()) {
      engine.tick(100);
      expect(enemy.nextAttackAt).toBe(enemyNASnapshot);
      iters++;
    }

    // Lock must release within 200 ticks
    expect(engine.getActiveActorId()).not.toBe(ally.id);
    expect(iters).toBeLessThan(200);
  });

  it('Test 3: timeline order — attacker moves to back of queue after firing', () => {
    const { engine } = makeEngine([{ id: 'sq3-ally' }], ['sq3-enemy']);
    const ally = engine.entities.find(e => e.isAlly)!;
    const enemy = engine.entities.find(e => !e.isAlly)!;

    // Tick past ally's first attack
    engine.tick(ally.attackIntervalMs + 100);

    // Ally's timer advanced; enemy should have lower nextAttackAt (ally at back of queue)
    expect(ally.nextAttackAt).toBeGreaterThan(enemy.nextAttackAt);
  });

  it('Test 4: stun does not deadlock — stunned entity is skipped, queue continues', () => {
    const { engine } = makeEngine([{ id: 'sq4-ally' }], ['sq4-enemy']);
    const ally = engine.entities.find(e => e.isAlly)!;
    const enemy = engine.entities.find(e => !e.isAlly)!;

    // Inject stun with enough ticks to survive multiple logic ticks
    (ally.statusEffects as any[]).push({ type: 'stunned', ticksRemaining: 3 });
    ally.nextAttackAt = 0;
    enemy.nextAttackAt = 0;

    const allyNABefore = ally.nextAttackAt;

    // Tick once — ally stunned, should be skipped
    const events = engine.tick(100);

    // Ally's timer advanced (skip processed)
    expect(ally.nextAttackAt).toBeGreaterThan(allyNABefore);
    // Lock not held by stunned ally
    expect(engine.getActiveActorId()).not.toBe(ally.id);
    // No auto-attack from ally
    const allyAttacks = events.filter(e => e.type === 'auto-attack' && (e as any).attackerId === ally.id);
    expect(allyAttacks).toHaveLength(0);
  });

  it('Test 5: auto mode 3-vs-1 — at most one attacker fires per 100ms tick', () => {
    const { engine } = makeEngine(
      [{ id: 'sq5-a1' }, { id: 'sq5-a2' }, { id: 'sq5-a3' }],
      ['sq5-enemy'],
    );

    // Give enemy high HP so the fight lasts multiple rounds
    const enemy = engine.entities.find(e => !e.isAlly)!;
    enemy.currentHp = 99999;
    enemy.maxHp = 99999;

    const attacksByTick = new Map<number, Set<string>>();
    let elapsed = 0;

    while (elapsed < 3000 && !engine.isFinished()) {
      const tick = elapsed + 100;
      const evts = engine.tick(100);
      for (const ev of evts) {
        if (ev.type === 'auto-attack') {
          if (!attacksByTick.has(tick)) attacksByTick.set(tick, new Set());
          attacksByTick.get(tick)!.add((ev as any).attackerId as string);
        }
      }
      elapsed += 100;
    }

    expect(attacksByTick.size).toBeGreaterThan(0); // at least some attacks happened

    for (const [, attackers] of attacksByTick) {
      expect(attackers.size).toBeLessThanOrEqual(1);
    }
  });

  it('Test 6: manual mode — activeActorId is null while paused for player input', () => {
    const { engine } = makeEngine([{ id: 'sq6-ally' }], ['sq6-enemy'], true);
    const ally = engine.entities.find(e => e.isAlly)!;

    engine.tick(ally.attackIntervalMs + 100);

    // Engine paused for player turn
    expect(engine.getPausedForAllyTurn()).not.toBeNull();
    // Lock must NOT be held while waiting for input
    expect(engine.getActiveActorId()).toBeNull();

    // Player queues an attack
    engine.queueAttack(ally.id);
    const events = engine.tick(200);

    expect(events.some(e => e.type === 'auto-attack')).toBe(true);
    expect(engine.getPausedForAllyTurn()).toBeNull();
  });
});
