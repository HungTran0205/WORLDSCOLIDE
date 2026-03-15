import type { StatKey } from '@/game/state/game-state';

export const CIVILIZATIONS = ['Viet', 'Nordic', 'Saharan'] as const;
export type Civilization = (typeof CIVILIZATIONS)[number];

export const NAME_POOLS: Record<Civilization, string[]> = {
  Viet: ['Minh', 'Lan', 'Duc', 'Hoa', 'Tuan', 'Mai'],
  Nordic: ['Erik', 'Freya', 'Bjorn', 'Sigrid', 'Ragnar', 'Astrid'],
  Saharan: ['Amara', 'Kofi', 'Zuri', 'Jabari', 'Nia', 'Kwame'],
};

export interface ArchetypeProfile {
  name: string;
  weights: Record<StatKey, number>;
}

export const ARCHETYPES: ArchetypeProfile[] = [
  { name: 'warrior', weights: { STR: 3, END: 2, INT: 0.5, DEX: 1, CHA: 0.5, LCK: 0.5, AGI: 1 } },
  { name: 'scout', weights: { STR: 1, END: 1, INT: 0.5, DEX: 3, CHA: 0.5, LCK: 1, AGI: 2 } },
  { name: 'scholar', weights: { STR: 0.5, END: 1, INT: 3, DEX: 1, CHA: 1.5, LCK: 1, AGI: 0.5 } },
];
