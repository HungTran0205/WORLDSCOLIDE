/**
 * Unit tests for CombatEngine.addEnemies — wave-spawn behaviour after the
 * Phase 5 renderer-only slide-in refactor.
 *
 * Contract:
 *  - addEnemies must place each new enemy at its ON-SCREEN formation home
 *    (position.x ≤ +12 — the right edge of the visible arena at zoom 64).
 *  - addEnemies must set spawnSlideFromX ≥ +14 (off the right edge) so the
 *    renderer can slide the sprite in from outside the visible frustum.
 *  - init() (wave 1 + allies) must NOT set spawnSlideFromX — those entities
 *    appear at home immediately (no slide).
 */

import { describe, expect, it } from 'vitest';
import type { EnemyTemplate } from '@/game/data/enemies';
import type { Member, Stats } from '@/game/state/game-state';
import { CombatEngine } from './combat-engine';

/** Visible arena right edge (ortho zoom 64, panel 1536px = 24u wide, centered). */
const VISIBLE_RIGHT_EDGE = 12;
/** Minimum off-screen X for the slide-in start position. */
const OFFSCREEN_MIN = 14;

const BASE_STATS: Stats = {
  STR: 5, END: 5, INT: 5, DEX: 5, CHA: 5, LCK: 5, AGI: 5,
};

function makeEnemy(id = 'slime'): EnemyTemplate {
  return {
    id,
    name: id,
    level: 1,
    stats: { ...BASE_STATS },
    skill: null,
    abilities: [],
    loot: [],
    spriteId: id,
  };
}

function makeMember(id = 'founder'): Member {
  return {
    id,
    name: 'Test Member',
    grade: 'D',
    isMercenary: false,
    stats: { ...BASE_STATS },
    unallocatedPoints: 0,
    skill: null,
    status: 'idle',
    injuredUntil: null,
    civilization: 'LinhSon',
    archetype: 'warrior',
    gender: 'M',
    isFounder: true,
    missionsCompleted: 0,
    traits: [],
    equipment: null,
    medicineSlots: undefined,
  };
}

function initEngine(enemyCount = 1): CombatEngine {
  const engine = new CombatEngine();
  const member = makeMember();
  const formation = [member.id, null, null, null, null, null];
  const enemies = Array.from({ length: enemyCount }, (_, i) => makeEnemy(`slime-${i}`));
  engine.init([member], formation, enemies, 1.0);
  return engine;
}

describe('CombatEngine.addEnemies — Phase 5 on-screen spawn + slide hint', () => {
  it('places wave-2 enemies at on-screen formation slots (position.x ≤ +12)', () => {
    const engine = initEngine(1);
    const templates = [makeEnemy('wave2-a'), makeEnemy('wave2-b'), makeEnemy('wave2-c')];

    engine.addEnemies(templates, 8, 1.0); // xOffset = 8 (ft-path-to-depths wave 2)

    const newEnemies = engine.entities.filter((e) => !e.isAlly && e.name.startsWith('wave2'));
    expect(newEnemies).toHaveLength(3);
    for (const e of newEnemies) {
      expect(e.position.x).toBeLessThanOrEqual(VISIBLE_RIGHT_EDGE);
    }
  });

  it('sets spawnSlideFromX ≥ +14 (off right edge) for wave-2 enemies', () => {
    const engine = initEngine(1);
    const templates = [makeEnemy('wave2-a'), makeEnemy('wave2-b')];

    engine.addEnemies(templates, 8, 1.0);

    const newEnemies = engine.entities.filter((e) => !e.isAlly && e.name.startsWith('wave2'));
    for (const e of newEnemies) {
      expect(e.spawnSlideFromX).toBeDefined();
      expect(e.spawnSlideFromX!).toBeGreaterThanOrEqual(OFFSCREEN_MIN);
    }
  });

  it('spawnSlideFromX is always off-screen even with small xOffset (xOffset = 5)', () => {
    const engine = initEngine(1);
    const templates = [makeEnemy('wave2-a')];

    engine.addEnemies(templates, 5, 1.0); // ft-ancient-threshold wave 2 offset

    const e = engine.entities.find((x) => !x.isAlly && x.name === 'wave2-a')!;
    expect(e.spawnSlideFromX).toBeGreaterThanOrEqual(OFFSCREEN_MIN);
  });

  it('spawnSlideFromX is always off-screen even with xOffset = 0 (no offset)', () => {
    const engine = initEngine(1);
    const templates = [makeEnemy('wave2-a')];

    // xOffset=0 means "no mission-level offset" — still needs slide from off-screen.
    engine.addEnemies(templates, 0, 1.0);

    const e = engine.entities.find((x) => !x.isAlly && x.name === 'wave2-a')!;
    expect(e.spawnSlideFromX).toBeDefined();
    expect(e.spawnSlideFromX!).toBeGreaterThanOrEqual(OFFSCREEN_MIN);
  });

  it('spawnSlideFromX is off-screen for large xOffset (ft-ruins-forgotten-age xOffset=12)', () => {
    const engine = initEngine(1);
    const templates = [makeEnemy('wave2-a')];

    engine.addEnemies(templates, 12, 1.5);

    const e = engine.entities.find((x) => !x.isAlly && x.name === 'wave2-a')!;
    expect(e.spawnSlideFromX).toBeDefined();
    expect(e.spawnSlideFromX!).toBeGreaterThanOrEqual(OFFSCREEN_MIN);
    // Logic position (not shifted) must be on-screen.
    expect(e.position.x).toBeLessThanOrEqual(VISIBLE_RIGHT_EDGE);
  });

  it('wave-1 enemies (via init) do NOT have spawnSlideFromX — no slide on first wave', () => {
    const engine = initEngine(2);
    const wave1Enemies = engine.entities.filter((e) => !e.isAlly);

    expect(wave1Enemies.length).toBeGreaterThan(0);
    for (const e of wave1Enemies) {
      expect(e.spawnSlideFromX).toBeUndefined();
    }
  });

  it('allies (via init) do NOT have spawnSlideFromX', () => {
    const engine = initEngine(1);
    const allies = engine.entities.filter((e) => e.isAlly);

    expect(allies.length).toBeGreaterThan(0);
    for (const a of allies) {
      expect(a.spawnSlideFromX).toBeUndefined();
    }
  });

  it('position.x and homeX are equal for new-wave enemies (home slot, not off-screen)', () => {
    const engine = initEngine(1);
    const templates = [makeEnemy('wave2-a'), makeEnemy('wave2-b')];

    engine.addEnemies(templates, 8, 1.0);

    const newEnemies = engine.entities.filter((e) => !e.isAlly && e.name.startsWith('wave2'));
    for (const e of newEnemies) {
      expect(e.position.x).toBe(e.homeX);
    }
  });

  it('entity count increases correctly after addEnemies', () => {
    const engine = initEngine(1);
    const before = engine.entities.length;
    engine.addEnemies([makeEnemy('w2-a'), makeEnemy('w2-b')], 5, 1.0);
    expect(engine.entities.length).toBe(before + 2);
  });

  it('new-wave enemies start in battle-idle animState (not idle or walking)', () => {
    const engine = initEngine(1);
    engine.addEnemies([makeEnemy('wave2-a')], 8, 1.0);

    const e = engine.entities.find((x) => !x.isAlly && x.name === 'wave2-a')!;
    expect(e.animState).toBe('battle-idle');
  });
});
