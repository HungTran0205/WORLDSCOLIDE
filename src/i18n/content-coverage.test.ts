/**
 * Coverage guard for the `content` namespace.
 *
 * Game-data display text is localized via an overlay keyed by entity id
 * (see content-localization.ts). The overlay direction depends on the data's
 * source language:
 *   - EN-authored data (missions, items, enemies, ranks, furniture, facilities,
 *     equipment, recipes, archetypes, and the EN `role` field of civ) must have
 *     a Vietnamese entry in content.vi.json.
 *   - VN-authored data (skills, civ name/description/passive) must have an
 *     English entry in content.en.json (sourced from the lore glossary).
 *
 * A missing entry means a player would see the source language even after
 * switching — this test fails loud so untranslated ids can't ship silently.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import i18n from './index';
import { tContent } from './content-localization';
import { civName, skillName, itemName } from './content-wrappers';

import contentEn from './content.en.json';
import contentVi from './content.vi.json';

import { MISSIONS } from '@/game/data/missions';
import { ITEM_DATABASE } from '@/game/data/items';
import { ENEMIES } from '@/game/data/enemies';
import { FURNITURE_DEFINITIONS } from '@/game/data/furniture';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import { ALCHEMY_RECIPES } from '@/game/data/alchemy-recipes';
import { LINH_SON_FOUNDER_CHOICES } from '@/game/data/founder-archetypes';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import { SKILLS_BY_ARCHETYPE } from '@/game/data/skills';

type Overlay = Record<string, Record<string, Record<string, unknown>>>;

/** Returns ids that lack a non-empty string at overlay[category][id][field]. */
function missingEntries(
  overlay: Overlay,
  category: string,
  ids: string[],
  field: string,
): string[] {
  return ids.filter((id) => {
    const value = overlay[category]?.[id]?.[field];
    return typeof value !== 'string' || value.trim() === '';
  });
}

const vi = contentVi as Overlay;
const en = contentEn as Overlay;

// ---- EN-authored data → Vietnamese overlay required (content.vi.json) ----

describe('content.vi.json covers every EN-authored entity', () => {
  it('missions: name + description + zone', () => {
    const ids = MISSIONS.map((m) => m.id);
    expect(missingEntries(vi, 'missions', ids, 'name')).toEqual([]);
    expect(missingEntries(vi, 'missions', ids, 'description')).toEqual([]);
    expect(missingEntries(vi, 'missions', ids, 'zone')).toEqual([]);
  });

  it('items: name + description', () => {
    const ids = Object.keys(ITEM_DATABASE);
    expect(missingEntries(vi, 'items', ids, 'name')).toEqual([]);
    expect(missingEntries(vi, 'items', ids, 'description')).toEqual([]);
  });

  it('enemies: name', () => {
    const ids = Object.keys(ENEMIES);
    expect(missingEntries(vi, 'enemies', ids, 'name')).toEqual([]);
  });

  it('furniture: name + description', () => {
    const ids = FURNITURE_DEFINITIONS.map((f) => f.type);
    expect(missingEntries(vi, 'furniture', ids, 'name')).toEqual([]);
    expect(missingEntries(vi, 'furniture', ids, 'description')).toEqual([]);
  });

  it('facilities: name + description', () => {
    const ids = Object.keys(FACILITY_DEFINITIONS);
    expect(missingEntries(vi, 'facilities', ids, 'name')).toEqual([]);
    expect(missingEntries(vi, 'facilities', ids, 'description')).toEqual([]);
  });

  it('equipment: name', () => {
    const ids = Object.keys(EQUIPMENT_DATABASE);
    expect(missingEntries(vi, 'equipment', ids, 'name')).toEqual([]);
  });

  it('recipes: name', () => {
    const ids = ALCHEMY_RECIPES.map((r) => r.id);
    expect(missingEntries(vi, 'recipes', ids, 'name')).toEqual([]);
  });

  it('archetypes: name + tagline + description', () => {
    const ids = LINH_SON_FOUNDER_CHOICES.map((c) => c.id);
    expect(missingEntries(vi, 'archetypes', ids, 'name')).toEqual([]);
    expect(missingEntries(vi, 'archetypes', ids, 'tagline')).toEqual([]);
    expect(missingEntries(vi, 'archetypes', ids, 'description')).toEqual([]);
  });

  it('civ role (EN-authored field): Vietnamese overlay', () => {
    const ids = Object.keys(CIV_CONFIG);
    expect(missingEntries(vi, 'civ', ids, 'role')).toEqual([]);
  });
});

// ---- VN-authored data → English overlay required (content.en.json) ----

describe('content.en.json covers every VN-authored entity', () => {
  it('skills: name', () => {
    const ids = [...new Set(Object.values(SKILLS_BY_ARCHETYPE).flat().map((s) => s.id))];
    expect(missingEntries(en, 'skills', ids, 'name')).toEqual([]);
  });

  it('civ: name + description + passiveName + passiveDescription', () => {
    const ids = Object.keys(CIV_CONFIG);
    expect(missingEntries(en, 'civ', ids, 'name')).toEqual([]);
    expect(missingEntries(en, 'civ', ids, 'description')).toEqual([]);
    expect(missingEntries(en, 'civ', ids, 'passiveName')).toEqual([]);
    expect(missingEntries(en, 'civ', ids, 'passiveDescription')).toEqual([]);
  });
});

// ---- Resolver direction: exercise the LIVE resolver in both languages ----
// JSON-presence checks above can't catch resolution bugs (e.g. a fallbackLng
// that returns the EN overlay to a VN player). These run the real resolver.

describe('resolver returns the active language in both directions', () => {
  const original = i18n.language;
  afterAll(async () => { await i18n.changeLanguage(original); });

  describe('Vietnamese active', () => {
    beforeAll(async () => { await i18n.changeLanguage('vi'); });

    it('VN-authored civ resolves to its inline Vietnamese value (not the EN overlay)', () => {
      expect(civName('LinhSon')).toBe('Linh Sơn');
    });

    it('VN-authored skill resolves to Vietnamese', () => {
      expect(skillName('danh-manh', 'Đánh Mạnh')).toBe('Đánh Mạnh');
    });

    it('EN-authored item resolves to its Vietnamese overlay', () => {
      expect(itemName('WOOD')).toBe('Gỗ Sồi');
    });

    it('narrative (dialog/tutorial) resolves to Vietnamese', () => {
      expect(tContent('dialog', 'kael-rescue', 'title', 'Kael Rescued!')).toBe('Đã Giải Cứu Kael!');
      expect(tContent('tutorial', 'char-creation', 'message', 'fallback')).not.toBe('fallback');
    });
  });

  describe('English active', () => {
    beforeAll(async () => { await i18n.changeLanguage('en'); });

    it('VN-authored civ resolves to its English overlay', () => {
      expect(civName('LinhSon')).toBe('The LinhSon');
    });

    it('VN-authored skill resolves to its English overlay', () => {
      expect(skillName('danh-manh', 'Đánh Mạnh')).toBe('Heavy Strike');
    });

    it('EN-authored item resolves to its inline English value', () => {
      expect(itemName('WOOD')).toBe('Oak Wood');
    });
  });
});
