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
  /** Sprite folder name under /sprites/enemies/ (e.g. 'slime') */
  spriteId?: string;
  /** Flying enemy — sprite renders elevated above ground */
  flying?: boolean;
  /** Boss enemy — renders at BOSS_SPRITE_SCALE (larger than regular enemies) */
  isBoss?: boolean;
}

export const ENEMIES: Record<string, EnemyTemplate> = {
  // --- Level 1 ---
  slime: {
    id: 'slime', name: 'Slime', level: 1,
    stats: { STR: 3, END: 2, INT: 1, DEX: 1, CHA: 0, LCK: 1, AGI: 2 },
    skill: null, abilities: [],
    loot: [{ itemId: 'SLIME_GEL', chance: 0.75, min: 1, max: 2 }, { itemId: 'WOOD', chance: 0.15, min: 1, max: 2 }],
    spriteId: 'slime',
  },
  'forest-spider': {
    id: 'forest-spider', name: 'Forest Spider', level: 1,
    stats: { STR: 4, END: 2, INT: 1, DEX: 3, CHA: 0, LCK: 1, AGI: 4 },
    skill: null, abilities: [{ type: 'poison-attack', chance: 0.10 }],
    loot: [{ itemId: 'SLIME_GEL', chance: 0.5, min: 1, max: 1 }],
    spriteId: 'forest-spider',
  },

  // --- Level 2 ---
  goblin: {
    id: 'goblin', name: 'Goblin', level: 2,
    stats: { STR: 6, END: 4, INT: 2, DEX: 5, CHA: 0, LCK: 3, AGI: 5 },
    skill: null, abilities: [{ type: 'poison-attack', chance: 0.15 }],
    loot: [{ itemId: 'GOBLIN_EAR', chance: 0.8, min: 1, max: 1 }, { itemId: 'WOOD', chance: 0.15, min: 1, max: 2 }],
    spriteId: 'goblin',
  },
  bandit: {
    id: 'bandit', name: 'Bandit', level: 2,
    stats: { STR: 5, END: 5, INT: 2, DEX: 4, CHA: 1, LCK: 2, AGI: 4 },
    skill: null, abilities: [],
    loot: [{ itemId: 'GOBLIN_EAR', chance: 0.4, min: 1, max: 1 }, { itemId: 'IRON_ORE', chance: 0.2, min: 1, max: 1 }],
    spriteId: 'bandit',
  },
  'cave-bat': {
    id: 'cave-bat', name: 'Cave Bat', level: 2,
    stats: { STR: 3, END: 2, INT: 1, DEX: 6, CHA: 0, LCK: 2, AGI: 8 },
    skill: null, abilities: [],
    loot: [
      { itemId: 'BOAR_PELT', chance: 0.3, min: 1, max: 1 },
      { itemId: 'STONE', chance: 0.35, min: 1, max: 2 },
    ],
    spriteId: 'cave-bat',
    flying: true,
  },
  // Tutorial boss — "Bear the Bear" quest (chain-first-tremor). Stats kept low:
  // STR capped so it can't one-shot a lv1 founder; modest END for a ~3-4 turn fight.
  // `enrage` is the telegraphed "Lunar Roar" wind-up the coachmark cues (Phase 04).
  // Final balance pass: Phase 07. Sprite: public/sprites/enemies/moonbear (idle/attack/death/block).
  moonbear: {
    id: 'moonbear', name: 'Moonbear', level: 2,
    stats: { STR: 9, END: 12, INT: 1, DEX: 3, CHA: 0, LCK: 2, AGI: 3 },
    skill: null, abilities: [{ type: 'enrage', chance: 0.20 }],
    loot: [{ itemId: 'BOAR_PELT', chance: 0.8, min: 1, max: 1 }, { itemId: 'WOOD', chance: 0.3, min: 1, max: 2 }],
    spriteId: 'moonbear',
    isBoss: true,
  },

  // --- Level 3 ---
  wolf: {
    id: 'wolf', name: 'Wolf', level: 3,
    stats: { STR: 8, END: 5, INT: 1, DEX: 4, CHA: 0, LCK: 2, AGI: 7 },
    skill: null, abilities: [],
    loot: [{ itemId: 'WOLF_FANG', chance: 0.4, min: 1, max: 1 }, { itemId: 'BOAR_PELT', chance: 0.3, min: 1, max: 1 }],
    spriteId: 'wolf',
  },
  'wild-boar': {
    id: 'wild-boar', name: 'Wild Boar', level: 3,
    stats: { STR: 7, END: 10, INT: 1, DEX: 2, CHA: 0, LCK: 1, AGI: 3 },
    skill: null, abilities: [{ type: 'enrage', chance: 0.15 }],
    loot: [{ itemId: 'BOAR_PELT', chance: 0.6, min: 1, max: 2 }, { itemId: 'WOOD', chance: 0.2, min: 1, max: 1 }],
    spriteId: 'wild-boar',
  },
  'slime-king': {
    id: 'slime-king', name: 'Slime King', level: 3,
    stats: { STR: 8, END: 20, INT: 3, DEX: 2, CHA: 0, LCK: 5, AGI: 2 },
    skill: null, abilities: [],
    loot: [
      { itemId: 'SLIME_GEL', chance: 1.0, min: 2, max: 4 },
      { itemId: 'STONE', chance: 0.5, min: 1, max: 2 },
      { itemId: 'SLIME_KING_CORE', chance: 1.0, min: 1, max: 1 },
    ],
    spriteId: 'slime-king',
    isBoss: true,
  },

  // --- Arc 1: machine enemies ---
  'flying-drone': {
    id: 'flying-drone', name: 'Flying Drone', level: 2,
    stats: { STR: 4, END: 3, INT: 2, DEX: 7, CHA: 0, LCK: 1, AGI: 10 },
    skill: null, abilities: [{ type: 'stun-attack', chance: 0.15 }],
    loot: [
      { itemId: 'DRONE_SENSOR', chance: 0.80, min: 1, max: 1 },
      { itemId: 'METAL_PLATE',  chance: 0.20, min: 1, max: 1 },
    ],
    spriteId: 'drone', // walk-as-idle (no idle frames on disk), 4-frame attack
    flying: true,
  },
  'dog-robot': {
    id: 'dog-robot', name: 'Dog Robot', level: 3,
    stats: { STR: 8, END: 8, INT: 2, DEX: 5, CHA: 0, LCK: 1, AGI: 6 },
    skill: null, abilities: [{ type: 'enrage', chance: 0.20 }],
    loot: [
      { itemId: 'METAL_PLATE',  chance: 0.75, min: 1, max: 2 },
      { itemId: 'DRONE_SENSOR', chance: 0.30, min: 1, max: 1 },
    ],
    spriteId: 'slime', // placeholder — Arc 1 sprite pending
  },

  // --- Level 4 (boss: queen-spider) ---
  'goblin-shaman': {
    id: 'goblin-shaman', name: 'Goblin Shaman', level: 4,
    stats: { STR: 4, END: 6, INT: 8, DEX: 3, CHA: 2, LCK: 3, AGI: 4 },
    skill: null, abilities: [{ type: 'heal-ally', chance: 0.20 }],
    loot: [{ itemId: 'GOBLIN_EAR', chance: 0.6, min: 1, max: 1 }, { itemId: 'STONE', chance: 0.3, min: 1, max: 2 }],
    spriteId: 'goblin-shaman',
  },
  'queen-spider': {
    id: 'queen-spider', name: 'Queen Spider', level: 4,
    stats: { STR: 9, END: 15, INT: 3, DEX: 5, CHA: 0, LCK: 3, AGI: 5 },
    skill: null, abilities: [{ type: 'poison-attack', chance: 0.30 }],
    loot: [{ itemId: 'SLIME_GEL', chance: 1.0, min: 2, max: 3 }, { itemId: 'IRON_ORE', chance: 0.4, min: 1, max: 2 }],
    spriteId: 'queen-spider',
  },

  // --- Level 5 ---
  'orc-warrior': {
    id: 'orc-warrior', name: 'Orc Warrior', level: 5,
    stats: { STR: 12, END: 15, INT: 2, DEX: 3, CHA: 0, LCK: 2, AGI: 3 },
    skill: null, abilities: [],
    loot: [{ itemId: 'ORC_TUSK', chance: 0.35, min: 1, max: 1 }, { itemId: 'IRON_ORE', chance: 0.25, min: 1, max: 3 }],
    spriteId: 'orc-warrior',
  },
  'dire-wolf': {
    id: 'dire-wolf', name: 'Dire Wolf', level: 5,
    stats: { STR: 11, END: 10, INT: 1, DEX: 6, CHA: 0, LCK: 3, AGI: 8 },
    skill: null, abilities: [{ type: 'stun-attack', chance: 0.10 }],
    loot: [{ itemId: 'WOLF_FANG', chance: 0.7, min: 1, max: 2 }],
    spriteId: 'dire-wolf',
  },

  // --- Level 6 ---
  'orc-berserker': {
    id: 'orc-berserker', name: 'Orc Berserker', level: 6,
    stats: { STR: 14, END: 10, INT: 1, DEX: 4, CHA: 0, LCK: 2, AGI: 5 },
    skill: null, abilities: [{ type: 'enrage', chance: 0.25 }],
    loot: [{ itemId: 'ORC_TUSK', chance: 0.5, min: 1, max: 1 }, { itemId: 'IRON_ORE', chance: 0.3, min: 1, max: 2 }],
    spriteId: 'orc-berserker',
  },

  // --- Level 7 ---
  'stone-golem': {
    id: 'stone-golem', name: 'Stone Golem', level: 7,
    stats: { STR: 14, END: 25, INT: 1, DEX: 1, CHA: 0, LCK: 1, AGI: 1 },
    skill: null, abilities: [],
    loot: [{ itemId: 'STONE', chance: 0.9, min: 2, max: 3 }, { itemId: 'IRON_ORE', chance: 0.4, min: 1, max: 2 }],
    spriteId: 'stone-golem',
  },

  // --- Level 8 (boss: warlord-grok) ---
  'warlord-grok': {
    id: 'warlord-grok', name: 'Warlord Grok', level: 8,
    stats: { STR: 18, END: 22, INT: 3, DEX: 5, CHA: 2, LCK: 3, AGI: 4 },
    skill: null, abilities: [{ type: 'enrage', chance: 0.20 }, { type: 'stun-attack', chance: 0.15 }],
    loot: [{ itemId: 'ORC_TUSK', chance: 1.0, min: 2, max: 3 }, { itemId: 'IRON_ORE', chance: 0.6, min: 2, max: 4 }],
    spriteId: 'warlord-grok',
  },
};
