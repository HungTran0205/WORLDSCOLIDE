/** Skill rank training costs and timing constants. */

import type { ItemID } from './items';

export interface RankCost {
  gold: number;
  material: ItemID | null;
  quantity: number;
}

/** Upfront cost to start training toward each rank. Rank 1 = learning the skill (Lv0→Lv1). */
export const RANK_COSTS: Record<number, RankCost> = {
  1: { gold: 50,   material: null,       quantity: 0 },
  2: { gold: 150,  material: null,       quantity: 0 },
  3: { gold: 350,  material: 'STONE',    quantity: 3 },
  4: { gold: 700,  material: 'IRON_ORE', quantity: 5 },
  5: { gold: 1500, material: 'GEM',      quantity: 8 },
};

/** Training time in game-days (facility-level-only speed, NOT stat-scaled) */
export const RANK_TRAIN_DAYS: Record<number, number> = {
  1: 0.25, 2: 0.5, 3: 1, 4: 2, 5: 3,
};

/** Max rank unlocked per Training Yard facility level. Learning (→Lv1) is allowed at any level. */
export const MAX_RANK_BY_FACILITY_LEVEL: Record<number, number> = {
  1: 2, 2: 4, 3: 5,
};

/** Train-time multiplier by Training Yard level (index = level-1). Lower = faster. */
export const TRAIN_SPEED_FACTOR = [1.0, 0.8, 0.6] as const;

/** Real milliseconds per one game-day (matches offline catch-up constant). */
export const GAME_DAY_REAL_MS = 30 * 60 * 1000;
