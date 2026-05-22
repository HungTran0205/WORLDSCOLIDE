/**
 * Founder archetype preset tests (New Game Flow, Phase 06).
 *
 * Covers:
 *  - FOUNDER_CHOICES_BY_CIV.LinhSon has exactly 3 entries (templar/forester/ranger).
 *  - archetype/gender mapping: templar→{sword,M}, forester→{warrior,M}, ranger→{scout,F}.
 *  - getSpritePath(civ, choice.archetype, choice.gender) resolves to
 *    LS-SWORD-M / LS-WARRIOR-M / LS-SCOUT-F.
 *  - Recruit-safety: RECRUITABLE_UNITS gates tavern spawns to the 3 playable
 *    sprites only (Templar/Forester/Ranger); never the NPC-only sprites
 *    LS-SCOUT-M / LS-WARRIOR-F.
 */

import { describe, it, expect } from 'vitest';
import {
  LINH_SON_FOUNDER_CHOICES,
  FOUNDER_CHOICES_BY_CIV,
  type FounderArchetypeChoice,
} from './founder-archetypes';
import { CIV_CONFIG, RECRUITABLE_UNITS } from './civilization-config';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';

function choiceById(id: FounderArchetypeChoice['id']): FounderArchetypeChoice {
  const c = LINH_SON_FOUNDER_CHOICES.find(x => x.id === id);
  if (!c) throw new Error(`founder choice '${id}' not found`);
  return c;
}

describe('FOUNDER_CHOICES_BY_CIV', () => {
  it('LinhSon has exactly 3 entries', () => {
    expect(FOUNDER_CHOICES_BY_CIV.LinhSon).toBeDefined();
    expect(FOUNDER_CHOICES_BY_CIV.LinhSon).toHaveLength(3);
  });

  it('LinhSon entries are exactly templar/forester/ranger', () => {
    const ids = FOUNDER_CHOICES_BY_CIV.LinhSon!.map(c => c.id);
    expect(ids).toEqual(['templar', 'forester', 'ranger']);
  });

  it('FOUNDER_CHOICES_BY_CIV.LinhSon is the LINH_SON_FOUNDER_CHOICES table (single source)', () => {
    expect(FOUNDER_CHOICES_BY_CIV.LinhSon).toBe(LINH_SON_FOUNDER_CHOICES);
  });

  it('does not define founder choices for locked civs (DeQuoc / ThienLu) in MVP', () => {
    expect(FOUNDER_CHOICES_BY_CIV.DeQuoc).toBeUndefined();
    expect(FOUNDER_CHOICES_BY_CIV.ThienLu).toBeUndefined();
  });
});

describe('founder archetype/gender mapping', () => {
  it.each([
    ['templar', 'sword', 'M'],
    ['forester', 'warrior', 'M'],
    ['ranger', 'scout', 'F'],
  ] as const)('%s → archetype=%s gender=%s', (id, archetype, gender) => {
    const c = choiceById(id);
    expect(c.archetype).toBe(archetype);
    expect(c.gender).toBe(gender);
  });
});

describe('getSpritePath resolves each founder choice to its sprite folder', () => {
  it.each([
    ['templar', '/sprites/characters/LS-SWORD-M'],
    ['forester', '/sprites/characters/LS-WARRIOR-M'],
    ['ranger', '/sprites/characters/LS-SCOUT-F'],
  ] as const)('%s → %s', (id, expectedPath) => {
    const c = choiceById(id);
    expect(getSpritePath('LinhSon', c.archetype, c.gender)).toBe(expectedPath);
  });
});

describe('recruit-safety — RECRUITABLE_UNITS gates tavern spawns to playable sprites', () => {
  it('LinhSon recruitable units are exactly Templar/Forester/Ranger', () => {
    expect(RECRUITABLE_UNITS.LinhSon).toEqual([
      { archetype: 'sword', gender: 'M' },
      { archetype: 'warrior', gender: 'M' },
      { archetype: 'scout', gender: 'F' },
    ]);
  });

  it('never offers the NPC-only sprites (scout+M, warrior+F)', () => {
    const combos = RECRUITABLE_UNITS.LinhSon.map((u) => `${u.archetype}-${u.gender}`);
    expect(combos).not.toContain('scout-M');   // LS-SCOUT-M
    expect(combos).not.toContain('warrior-F'); // LS-WARRIOR-F
  });

  it('every recruitable unit resolves to a playable sprite folder', () => {
    const allowed = new Set([
      '/sprites/characters/LS-SWORD-M',
      '/sprites/characters/LS-WARRIOR-M',
      '/sprites/characters/LS-SCOUT-F',
    ]);
    for (const u of RECRUITABLE_UNITS.LinhSon) {
      expect(allowed.has(getSpritePath('LinhSon', u.archetype, u.gender))).toBe(true);
    }
  });

  it('locked civs have no recruitable units in MVP', () => {
    expect(RECRUITABLE_UNITS.DeQuoc).toEqual([]);
    expect(RECRUITABLE_UNITS.ThienLu).toEqual([]);
  });

  it("legacy CIV_CONFIG.LinhSon.archetypes is no longer the recruit gate (unchanged)", () => {
    expect(CIV_CONFIG.LinhSon.archetypes).toEqual(['warrior', 'scout']);
  });
});
