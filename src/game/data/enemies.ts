import type { Stats, Skill } from '@/game/state/game-state';
import type { EnemyAbility } from '@/game/systems/combat-types';
import type { ItemID } from '@/game/data/items';

export interface LootRule {
  itemId: ItemID;
  /** Drop chance 0.0 → 1.0 */
  chance: number;
  min: number;
  max: number;
}

export interface EnemyTemplate {
  id: string;
  name: string;
  level: number;
  stats: Stats;
  skill: Skill | null;
  abilities: EnemyAbility[];
  loot: LootRule[];
}

export const ENEMIES: Record<string, EnemyTemplate> = {
  slime: {
    id: 'slime',
    name: 'Slime',
    level: 1,
    stats: { STR: 3, END: 2, INT: 1, DEX: 1, CHA: 0, LCK: 1, AGI: 2 },
    skill: null,
    abilities: [],
    loot: [{ itemId: 'SLIME_GEL', chance: 0.75, min: 1, max: 2 }],
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    level: 2,
    stats: { STR: 6, END: 4, INT: 2, DEX: 5, CHA: 0, LCK: 3, AGI: 5 },
    skill: null,
    abilities: [{ type: 'poison-attack', chance: 0.15 }],
    loot: [
      { itemId: 'GOBLIN_EAR', chance: 0.8, min: 1, max: 1 },
      { itemId: 'WOOD', chance: 0.15, min: 1, max: 2 },
    ],
  },
  wolf: {
    id: 'wolf',
    name: 'Wolf',
    level: 3,
    stats: { STR: 8, END: 5, INT: 1, DEX: 4, CHA: 0, LCK: 2, AGI: 7 },
    skill: null,
    abilities: [],
    loot: [
      { itemId: 'WOLF_FANG', chance: 0.4, min: 1, max: 1 },
      { itemId: 'BOAR_PELT', chance: 0.3, min: 1, max: 1 },
    ],
  },
  'orc-warrior': {
    id: 'orc-warrior',
    name: 'Orc Warrior',
    level: 5,
    stats: { STR: 12, END: 15, INT: 2, DEX: 3, CHA: 0, LCK: 2, AGI: 3 },
    skill: null,
    abilities: [],
    loot: [
      { itemId: 'ORC_TUSK', chance: 0.35, min: 1, max: 1 },
      { itemId: 'IRON_ORE', chance: 0.25, min: 1, max: 3 },
    ],
  },
  'slime-king': {
    id: 'slime-king',
    name: 'Slime King',
    level: 3,
    stats: { STR: 8, END: 20, INT: 3, DEX: 2, CHA: 0, LCK: 5, AGI: 2 },
    skill: null,
    abilities: [],
    loot: [
      { itemId: 'SLIME_GEL', chance: 1.0, min: 2, max: 4 },
      { itemId: 'STONE', chance: 0.5, min: 1, max: 2 },
    ],
  },
};
