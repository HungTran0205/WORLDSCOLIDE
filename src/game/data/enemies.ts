import type { Stats, Skill } from '@/game/state/game-state';
import type { EnemyAbility } from '@/game/systems/combat-types';

export interface EnemyTemplate {
  id: string;
  name: string;
  level: number;
  stats: Stats;
  skill: Skill | null;
  abilities: EnemyAbility[];
}

export const ENEMIES: Record<string, EnemyTemplate> = {
  slime: {
    id: 'slime',
    name: 'Slime',
    level: 1,
    stats: { STR: 3, END: 2, INT: 1, DEX: 1, CHA: 0, LCK: 1, AGI: 2 },
    skill: null,
    abilities: [],
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    level: 2,
    stats: { STR: 6, END: 4, INT: 2, DEX: 5, CHA: 0, LCK: 3, AGI: 5 },
    skill: null,
    abilities: [{ type: 'poison-attack', chance: 0.15 }],
  },
  wolf: {
    id: 'wolf',
    name: 'Wolf',
    level: 3,
    stats: { STR: 8, END: 5, INT: 1, DEX: 4, CHA: 0, LCK: 2, AGI: 7 },
    skill: null,
    abilities: [],
  },
  'orc-warrior': {
    id: 'orc-warrior',
    name: 'Orc Warrior',
    level: 5,
    stats: { STR: 12, END: 15, INT: 2, DEX: 3, CHA: 0, LCK: 2, AGI: 3 },
    skill: null,
    abilities: [],
  },
  'slime-king': {
    id: 'slime-king',
    name: 'Slime King',
    level: 3,
    stats: { STR: 8, END: 20, INT: 3, DEX: 2, CHA: 0, LCK: 5, AGI: 2 },
    skill: null,
    abilities: [],
  },
};
