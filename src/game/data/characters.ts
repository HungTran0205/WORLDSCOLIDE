import type { StatKey } from '@/game/state/game-state';
import type { CivArchetype } from './civilization-config';

// Re-export civilization data from single source of truth
export { CIVILIZATIONS, CIV_CONFIG, applyCivBonuses } from './civilization-config';
export type { Civilization } from './civilization-config';

export interface ArchetypeProfile {
  name: string;
  weights: Record<StatKey, number>;
}

/** Legacy shared archetypes — kept for old save compatibility with getDefaultSkill */
export const ARCHETYPES: ArchetypeProfile[] = [
  { name: 'warrior', weights: { STR: 3, END: 2, INT: 0.5, DEX: 1, CHA: 0.5, LCK: 0.5, AGI: 1 } },
  { name: 'scout', weights: { STR: 1, END: 1, INT: 0.5, DEX: 3, CHA: 0.5, LCK: 1, AGI: 2 } },
  { name: 'scholar', weights: { STR: 0.5, END: 1, INT: 3, DEX: 1, CHA: 1.5, LCK: 1, AGI: 0.5 } },
];

/** Civ-specific archetype stat weight profiles — unified with sprite system */
export const CIV_ARCHETYPE_PROFILES: Record<CivArchetype, ArchetypeProfile> = {
  // LinhSon
  warrior:     { name: 'warrior',     weights: { STR: 3, END: 2, INT: 0.5, DEX: 1, CHA: 0.5, LCK: 0.5, AGI: 1 } },
  scout:       { name: 'scout',       weights: { STR: 1, END: 1, INT: 0.5, DEX: 3, CHA: 0.5, LCK: 1, AGI: 2 } },
  // DeQuoc
  engineer:    { name: 'engineer',    weights: { STR: 1, END: 1.5, INT: 2, DEX: 2, CHA: 1, LCK: 0.5, AGI: 0.5 } },
  scholar:     { name: 'scholar',     weights: { STR: 0.5, END: 1, INT: 3, DEX: 1, CHA: 1.5, LCK: 1, AGI: 0.5 } },
  // ThienLu
  dualblade:   { name: 'dualblade',   weights: { STR: 2, END: 0.5, INT: 0.5, DEX: 2, CHA: 0.5, LCK: 1, AGI: 3 } },
  philosopher: { name: 'philosopher', weights: { STR: 0.5, END: 0.5, INT: 3, DEX: 0.5, CHA: 2, LCK: 1, AGI: 1 } },
};
