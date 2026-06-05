/**
 * Per-category typed wrapper helpers for the content-localization resolver.
 *
 * Each wrapper calls tContent(category, id, field, inlineDataString) so the
 * caller never has to remember category key strings. The inline data string is
 * always passed as the `fallback` (defaultValue), preserving the source-
 * language value when no translation key exists for the active language.
 *
 * Source-language directions:
 *   EN-authored (missions, items, enemies, equipment, furniture, facilities,
 *   recipes, archetypes, ranks): VN keys live in content.vi.json; EN comes
 *   from the inline data string via defaultValue.
 *
 *   VN-authored (skills, civ.displayName, civ.description, civ.passive.name,
 *   civ.passive.description): EN keys live in content.en.json; VN comes from
 *   the inline data string via defaultValue.
 *
 *   Mixed (civ.role): role values in civilization-config are EN text despite
 *   being in the VN-authored file → treated as EN-authored, VN keys in vi.json.
 */

import { tContent } from './content-localization';
import type { Mission } from '@/game/state/game-state';
import { ITEM_DATABASE } from '@/game/data/items';
import type { ItemID } from '@/game/data/items';
import { ENEMIES } from '@/game/data/enemies';
import { FURNITURE_DEFINITIONS } from '@/game/data/furniture';
import type { FurnitureType } from '@/game/state/game-state';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import type { FacilityType } from '@/game/state/game-state';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import type { EquipmentTemplateId } from '@/game/data/equipment-templates';
import { ALCHEMY_RECIPES } from '@/game/data/alchemy-recipes';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { LINH_SON_FOUNDER_CHOICES } from '@/game/data/founder-archetypes';

// ----- Missions (EN-authored) -----

export function missionName(m: Mission): string {
  return tContent('missions', m.id, 'name', m.name);
}

export function missionDescription(m: Mission): string {
  return tContent('missions', m.id, 'description', m.description ?? '');
}

export function missionZone(m: Mission): string {
  return tContent('missions', m.id, 'zone', m.zone ?? '');
}

// ----- Items (EN-authored) -----

export function itemName(id: ItemID): string {
  const item = ITEM_DATABASE[id];
  return tContent('items', id, 'name', item?.name ?? id);
}

export function itemDescription(id: ItemID): string {
  const item = ITEM_DATABASE[id];
  return tContent('items', id, 'description', item?.description ?? '');
}

// ----- Enemies (EN-authored) -----

export function enemyName(id: string): string {
  const enemy = ENEMIES[id];
  return tContent('enemies', id, 'name', enemy?.name ?? id);
}

// ----- Skills (VN-authored) -----

export function skillName(skillId: string, fallbackName: string): string {
  return tContent('skills', skillId, 'name', fallbackName);
}

// ----- Furniture (EN-authored) -----

export function furnitureName(type: FurnitureType): string {
  const def = FURNITURE_DEFINITIONS.find((f) => f.type === type);
  return tContent('furniture', type, 'name', def?.name ?? type);
}

export function furnitureDescription(type: FurnitureType): string {
  const def = FURNITURE_DEFINITIONS.find((f) => f.type === type);
  return tContent('furniture', type, 'description', def?.description ?? '');
}

// ----- Facilities (EN-authored) -----

export function facilityName(type: FacilityType): string {
  const def = FACILITY_DEFINITIONS[type];
  return tContent('facilities', type, 'name', def?.name ?? type);
}

export function facilityDescription(type: FacilityType): string {
  const def = FACILITY_DEFINITIONS[type];
  return tContent('facilities', type, 'description', def?.description ?? '');
}

// ----- Equipment (EN-authored) -----

export function equipmentName(id: EquipmentTemplateId): string {
  const tpl = EQUIPMENT_DATABASE[id];
  return tContent('equipment', id, 'name', tpl?.name ?? id);
}

// ----- Alchemy Recipes (EN-authored) -----

export function recipeName(id: string): string {
  const recipe = ALCHEMY_RECIPES.find((r) => r.id === id);
  return tContent('recipes', id, 'name', recipe?.name ?? id);
}

// ----- Founder Archetypes (EN-authored) -----

export function archetypeDisplayName(id: string): string {
  const allChoices = [...LINH_SON_FOUNDER_CHOICES];
  const choice = allChoices.find((c) => c.id === id);
  return tContent('archetypes', id, 'name', choice?.displayName ?? id);
}

export function archetypeDescription(id: string): string {
  const allChoices = [...LINH_SON_FOUNDER_CHOICES];
  const choice = allChoices.find((c) => c.id === id);
  return tContent('archetypes', id, 'description', choice?.description ?? '');
}

export function archetypeTagline(id: string): string {
  const allChoices = [...LINH_SON_FOUNDER_CHOICES];
  const choice = allChoices.find((c) => c.id === id);
  return tContent('archetypes', id, 'tagline', choice?.tagline ?? '');
}

// ----- Civilization (VN-authored for displayName/description/passive; EN-authored for role) -----

/** Civ display name — VN-authored, so EN key lives in content.en.json */
export function civName(id: Civilization): string {
  const config = CIV_CONFIG[id];
  return tContent('civ', id, 'name', config?.displayName ?? id);
}

/** Civ description — VN-authored, so EN key lives in content.en.json */
export function civDescription(id: Civilization): string {
  const config = CIV_CONFIG[id];
  return tContent('civ', id, 'description', config?.description ?? '');
}

/** Civ role — EN-authored (role strings in civilization-config are English text),
 *  so VN key lives in content.vi.json */
export function civRole(id: Civilization): string {
  const config = CIV_CONFIG[id];
  return tContent('civ', id, 'role', config?.role ?? '');
}

/** Passive name — VN-authored, EN key lives in content.en.json */
export function civPassiveName(id: Civilization): string {
  const config = CIV_CONFIG[id];
  return tContent('civ', id, 'passiveName', config?.passive?.name ?? '');
}

/** Passive description — VN-authored, EN key lives in content.en.json */
export function civPassiveDescription(id: Civilization): string {
  const config = CIV_CONFIG[id];
  return tContent('civ', id, 'passiveDescription', config?.passive?.description ?? '');
}
