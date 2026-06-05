/**
 * createFounder tests (New Game Flow, Phase 06).
 *
 * Drives the new-game "Begin" action: each of the 3 founder choices must produce
 * a valid, playable COMMANDER founder with the chosen mask.
 *
 * Covers, for templar(sword) / forester(warrior) / ranger(scout):
 *  - archetype + gender propagated verbatim
 *  - maskSpriteId propagated verbatim (chosen mask, not hash fallback)
 *  - starting weapon: WOODEN_SWORD / WOODEN_AXE / WOODEN_CROSSBOW
 *  - skill: sword→warrior skill, warrior→warrior skill, scout→scout skill
 *  - rank COMMANDER, isFounder true, level 1
 *  - stats are civ-boosted (applyCivBonuses applied, not raw)
 */

import { describe, it, expect } from 'vitest';
import { createFounder } from './character-creation';
import { applyCivBonuses } from '@/game/data/civilization-config';
import { getDefaultSkill } from '@/game/data/skills';
import type { Stats } from '@/game/state/game-state';

const RAW_STATS: Stats = { STR: 10, END: 10, INT: 10, DEX: 10, CHA: 10, LCK: 10, AGI: 10 };
const MASK_ID = 'mask-03';

interface Case {
  label: string;
  archetype: 'sword' | 'warrior' | 'scout';
  gender: 'M' | 'F';
  weaponTemplate: string;
  skillId: string;
}

const CASES: Case[] = [
  { label: 'Templar',  archetype: 'sword',   gender: 'M', weaponTemplate: 'WOODEN_SWORD',    skillId: getDefaultSkill('sword').id },
  { label: 'Forester', archetype: 'warrior', gender: 'M', weaponTemplate: 'WOODEN_AXE',      skillId: getDefaultSkill('warrior').id },
  { label: 'Ranger',   archetype: 'scout',   gender: 'F', weaponTemplate: 'WOODEN_CROSSBOW', skillId: getDefaultSkill('scout').id },
];

describe('createFounder — per founder choice', () => {
  it.each(CASES)('$label: archetype/gender/mask propagated', (c) => {
    const f = createFounder(c.label, RAW_STATS, 'LinhSon', c.archetype, c.gender, MASK_ID);
    expect(f.archetype).toBe(c.archetype);
    expect(f.gender).toBe(c.gender);
    expect(f.maskSpriteId).toBe(MASK_ID);
  });

  it.each(CASES)('$label: starting weapon = $weaponTemplate', (c) => {
    const f = createFounder(c.label, RAW_STATS, 'LinhSon', c.archetype, c.gender, MASK_ID);
    expect(f.equipment?.weapon).toBeDefined();
    expect(f.equipment?.weapon?.templateId).toBe(c.weaponTemplate);
    expect(f.equipment?.weapon?.durability).toBeGreaterThan(0);
  });

  it.each(CASES)('$label: skill = $skillId (sword/warrior→warrior, scout→scout)', (c) => {
    const f = createFounder(c.label, RAW_STATS, 'LinhSon', c.archetype, c.gender, MASK_ID);
    expect(f.skill).not.toBeNull();
    expect(f.skill?.id).toBe(c.skillId);
  });

  it.each(CASES)('$label: founder identity — COMMANDER, isFounder, level 1, no unallocated', (c) => {
    const f = createFounder(c.label, RAW_STATS, 'LinhSon', c.archetype, c.gender, MASK_ID);
    // Grade model: founder starts at grade determined by stat budget; no rank/level fields
    expect(f.isFounder).toBe(true);
    expect(f.isMercenary).toBe(false);
    expect(f.grade).toBeDefined();
    expect(f.unallocatedPoints).toBe(0);
    expect(f.civilization).toBe('LinhSon');
  });

  it.each(CASES)('$label: stats are civ-boosted, not raw', (c) => {
    const f = createFounder(c.label, RAW_STATS, 'LinhSon', c.archetype, c.gender, MASK_ID);
    const expected = applyCivBonuses(RAW_STATS, 'LinhSon');
    expect(f.stats).toEqual(expected);
    // LinhSon boosts END (x1.2) and DEX/STR (x1.1) → must differ from raw input
    expect(f.stats.END).toBe(12); // floor(10 * 1.2)
    expect(f.stats.STR).toBe(11); // floor(10 * 1.1)
    expect(f.stats.DEX).toBe(11); // floor(10 * 1.1)
    expect(f.stats).not.toEqual(RAW_STATS);
  });
});

describe('createFounder — each LinhSon class has a distinct default skill', () => {
  it('sword (Templar=pierce), warrior (Forester=sunder), scout (Ranger=snipe) are all different', () => {
    const templar = createFounder('T', RAW_STATS, 'LinhSon', 'sword', 'M', MASK_ID);
    const forester = createFounder('F', RAW_STATS, 'LinhSon', 'warrior', 'M', MASK_ID);
    const ranger = createFounder('R', RAW_STATS, 'LinhSon', 'scout', 'F', MASK_ID);
    expect(templar.skill?.id).toBe('pierce');
    expect(forester.skill?.id).toBe('sunder');
    expect(ranger.skill?.id).toBe('snipe');
    expect(templar.skill?.id).not.toBe(forester.skill?.id);
  });

  it('does not mutate the shared input stats object', () => {
    const input: Stats = { ...RAW_STATS };
    createFounder('T', input, 'LinhSon', 'sword', 'M', MASK_ID);
    expect(input).toEqual(RAW_STATS);
  });
});
