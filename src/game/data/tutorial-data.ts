/** Tutorial-specific static data — Kael NPC template and the intro quest definition. */

import type { Member, Mission, TavernVisitor } from '@/game/state/game-state';

/** Single source of truth for the tutorial Moonbear mission id. Used by the
 *  HP-floor wiring (Phase 04) so the engine + every auto-resolve simulator path
 *  recognise the one fight that must never be lost. */
export const TUTORIAL_BEAR_MISSION_ID = 'tutorial-bear-the-bear';

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

/**
 * Tutorial quest — "Bear the Bear", the playable Moonbear boss fight that opens
 * the `chain-first-tremor` onboarding chain (GDD §4). A solo founder (requiredMembers: 1)
 * dispatches with a compressed ~4s travel, then fights one Moonbear boss for real.
 * Guaranteed win: the tutorial HP-floor (Phase 04) prevents loss; here we only ensure
 * the boss isn't one-shot-capable. Export name kept as TUTORIAL_QUEST so missions.ts
 * needs no import churn. zone 'Village Outskirts' falls back to the lolo-village-outskirt
 * combat map (the village below the mountain). chainOrder 2+ graduation: deferred (Q2).
 */
/**
 * Scripted first tavern recruit — a Ranger (scout, female → LS-SCOUT-F) spawned the
 * instant the player assigns a Tavern Keeper during the `assign-keeper` step, so the
 * tutorial doesn't have to wait for the next-day visitor roll. `guaranteedRecruit`
 * forces a 100% negotiation success (see rollNegotiation) so the closing beat always
 * lands. Stable id keeps the spawn idempotent across re-assigns.
 */
export const TUTORIAL_RECRUIT_VISITOR: TavernVisitor = {
  id: 'tutorial-recruit-ranger',
  name: 'Mai',
  archetype: 'scout',
  civilization: 'LinhSon',
  gender: 'F',
  rarity: 2,
  level: 1,
  stats: { STR: 5, END: 5, INT: 4, DEX: 8, CHA: 4, LCK: 5, AGI: 7 },
  derivedDemand: 20,
  dailyMoodBias: 0,
  traits: [],
  preferredGiftCategory: 'consumable',
  attemptHistory: [],
  veteranTag: false,
  spawnedDay: 0,
  guaranteedRecruit: true,
};

export const TUTORIAL_QUEST: Mission = {
  id: TUTORIAL_BEAR_MISSION_ID,
  tier: 'F',
  name: 'Bear the Bear',
  description: 'A Moonbear, driven from its cave by a strange tremor, is rampaging through the village below the mountain. Drive it off before anyone is hurt.',
  zone: 'Village Outskirts',
  durationMs: 8_000,
  travelTimeMs: 4_000,
  goldRewardMin: 50,
  goldRewardMax: 50,
  expReward: 80,
  enemyIds: ['moonbear'],
  requiredMembers: 1,
  requiredLevel: 1,
  chainId: 'chain-first-tremor',
  chainOrder: 1,
  waves: [{ enemyIds: ['moonbear'], spawnXOffset: 0, hpMultiplier: 0.8 }],
};
