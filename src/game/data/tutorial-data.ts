/** Tutorial-specific static data — Kael NPC template and the intro quest definition. */

import type { Member, Mission } from '@/game/state/game-state';

/** Kael — LinhSon warrior, first guild member recruited during tutorial */
export const KAEL_TEMPLATE: Omit<Member, 'id'> = {
  name: 'Kael',
  civilization: 'LinhSon',
  archetype: 'warrior',
  gender: 'M',
  level: 1,
  exp: 0,
  stats: { STR: 8, END: 7, DEX: 5, AGI: 5, INT: 3, CHA: 4, LCK: 3 },
  unallocatedPoints: 0,
  skill: null,
  status: 'idle',
  injuredUntil: null,
  isFounder: false,
  rank: 'MEMBER',
  missionsCompleted: 0,
  rarity: 1,
  traits: [],
};

/** Tutorial quest — trivial slime fight, 5s duration, guaranteed win */
export const TUTORIAL_QUEST: Mission = {
  id: 'tutorial-into-the-clearing',
  tier: 'F',
  name: 'Into the Clearing',
  description: 'A local traveler was spotted near the eastern clearing — and something hostile is lurking there.',
  zone: 'Eastern Clearing',
  durationMs: 5_000,
  travelTimeMs: 2_000,
  goldRewardMin: 25,
  goldRewardMax: 25,
  expReward: 50,
  enemyIds: ['slime'],
  requiredMembers: 1,
  requiredLevel: 1,
  waves: [{ enemyIds: ['slime'], spawnXOffset: 0, hpMultiplier: 0.1 }],
};
