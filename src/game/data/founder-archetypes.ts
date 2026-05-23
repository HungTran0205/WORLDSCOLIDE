/**
 * Founder preset table — founder-only class choices (NOT recruitable).
 * Drives the new-game class step: each choice maps to an internal archetype
 * (sprite + profile + skill + starting weapon) with fixed gender and icon/portrait.
 * Display strings are English (game ships English by default).
 */

import type { CivArchetype, Gender, Civilization } from './civilization-config';
import { assetUrl } from '@/lib/asset-url';

export interface FounderArchetypeChoice {
  id: 'templar' | 'forester' | 'ranger';
  displayName: string;        // English
  tagline: string;            // short English role line
  description: string;        // English flavor (1-2 sentences)
  archetype: CivArchetype;    // drives sprite + profile + skill + weapon
  gender: Gender;             // fixed per choice (sprite availability)
  weaponLabel: string;        // 'Sword' | 'Axe' | 'Crossbow'
  iconPath: string;           // monochrome weapon icon (Phase 03 asset)
  portraitPath: string;       // avatar/frame_000.png
}

export const LINH_SON_FOUNDER_CHOICES: FounderArchetypeChoice[] = [
  { id: 'templar',  displayName: 'Templar',  archetype: 'sword',   gender: 'M', weaponLabel: 'Sword',
    iconPath: assetUrl('/ui/icons/founder/sword.png'),    portraitPath: assetUrl('/sprites/characters/LS-SWORD-M/animations/avatar/frame_000.png'),    tagline: 'Sword Vanguard',  description: 'A disciplined blade-bearer, balanced in might and footwork.' },
  { id: 'forester', displayName: 'Forester', archetype: 'warrior', gender: 'M', weaponLabel: 'Axe',
    iconPath: assetUrl('/ui/icons/founder/axe.png'),      portraitPath: assetUrl('/sprites/characters/LS-WARRIOR-M/animations/avatar/frame_000.png'),  tagline: 'Axe Bulwark',     description: 'A hardy mountain warrior who fells foes like timber.' },
  { id: 'ranger',   displayName: 'Ranger',   archetype: 'scout',   gender: 'F', weaponLabel: 'Crossbow',
    iconPath: assetUrl('/ui/icons/founder/crossbow.png'), portraitPath: assetUrl('/sprites/characters/LS-SCOUT-F/animations/avatar/frame_000.png'),    tagline: 'Crossbow Tracker', description: 'A swift markswoman who strikes from the treeline.' },
];

/** Founder choices keyed by civ (only Linh Sơn in MVP). */
export const FOUNDER_CHOICES_BY_CIV: Partial<Record<Civilization, FounderArchetypeChoice[]>> = {
  LinhSon: LINH_SON_FOUNDER_CHOICES,
};
