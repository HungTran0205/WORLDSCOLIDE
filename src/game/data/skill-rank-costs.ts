/** Skill rank training costs and timing constants. */

import type { ItemID } from './items';

export interface RankCost {
  gold: number;
  material: ItemID | null;
  quantity: number;
}

/** Upfront cost to start training toward each rank */
export const RANK_COSTS: Record<number, RankCost> = {
  2: { gold: 150,  material: null,       quantity: 0 },
  3: { gold: 350,  material: 'STONE',    quantity: 3 },
  4: { gold: 700,  material: 'IRON_ORE', quantity: 5 },
  5: { gold: 1500, material: 'GEM',      quantity: 8 },
};

/** Training time in game-days (facility-level-only speed, NOT stat-scaled) */
export const RANK_TRAIN_DAYS: Record<number, number> = {
  2: 0.5, 3: 1, 4: 2, 5: 3,
};

/** Max rank unlocked per Training Yard facility level */
export const MAX_RANK_BY_FACILITY_LEVEL: Record<number, number> = {
  1: 2, 2: 4, 3: 5,
};
