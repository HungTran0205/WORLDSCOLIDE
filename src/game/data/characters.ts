import type { StatKey } from '@/game/state/game-state';

// Re-export civilization data from single source of truth
export { CIVILIZATIONS, CIV_CONFIG, applyCivBonuses } from './civilization-config';
export type { Civilization } from './civilization-config';

export interface ArchetypeProfile {
  name: string;
  weights: Record<StatKey, number>;
}

export const ARCHETYPES: ArchetypeProfile[] = [
  { name: 'warrior', weights: { STR: 3, END: 2, INT: 0.5, DEX: 1, CHA: 0.5, LCK: 0.5, AGI: 1 } },
  { name: 'scout', weights: { STR: 1, END: 1, INT: 0.5, DEX: 3, CHA: 0.5, LCK: 1, AGI: 2 } },
  { name: 'scholar', weights: { STR: 0.5, END: 1, INT: 3, DEX: 1, CHA: 1.5, LCK: 1, AGI: 0.5 } },
];
