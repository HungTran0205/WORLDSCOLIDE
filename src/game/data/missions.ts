import type { Mission, QuestTier } from '@/game/state/game-state';

export const MISSIONS: Mission[] = [
  // F-Tier
  {
    id: 'slime-extermination', name: 'Slime Extermination', tier: 'F',
    description: 'The outskirts forest is overrun with slimes. Clear them out.',
    zone: 'Outskirts Forest',
    durationMs: 60_000, travelTimeMs: 10_000,
    goldRewardMin: 10, goldRewardMax: 20, expReward: 100,
    enemyIds: ['slime', 'slime', 'slime'], requiredMembers: 1, requiredLevel: 1,
  },
  {
    id: 'slime-king-lair', name: 'Slime King Lair', tier: 'F',
    description: 'A massive slime rules the cave depths. Defeat the Slime King.',
    zone: 'Crystal Cave',
    durationMs: 120_000, travelTimeMs: 10_000,
    goldRewardMin: 30, goldRewardMax: 50, expReward: 200,
    enemyIds: ['slime', 'slime', 'slime-king'], requiredMembers: 1, requiredLevel: 3,
  },
  // E-Tier
  {
    id: 'goblin-camp-raid', name: 'Goblin Camp Raid', tier: 'E',
    description: 'A goblin camp threatens nearby trade routes. Raid and disband them.',
    zone: 'Dusty Plains',
    durationMs: 150_000, travelTimeMs: 15_000,
    goldRewardMin: 40, goldRewardMax: 70, expReward: 275,
    enemyIds: ['goblin', 'goblin', 'goblin', 'goblin'], requiredMembers: 2, requiredLevel: 2,
  },
  {
    id: 'wolf-pack-hunt', name: 'Wolf Pack Hunt', tier: 'E',
    description: 'A feral wolf pack stalks the highland trails. Hunt them down.',
    zone: 'Highland Trails',
    durationMs: 180_000, travelTimeMs: 15_000,
    goldRewardMin: 50, goldRewardMax: 65, expReward: 300,
    enemyIds: ['wolf', 'wolf', 'wolf'], requiredMembers: 2, requiredLevel: 3,
  },
  // D-Tier
  {
    id: 'orc-stronghold', name: 'Orc Stronghold', tier: 'D',
    description: 'Orcs have fortified a mountain pass. Storm their stronghold.',
    zone: 'Iron Pass',
    durationMs: 300_000, travelTimeMs: 20_000,
    goldRewardMin: 150, goldRewardMax: 250, expReward: 750,
    enemyIds: ['orc-warrior', 'orc-warrior', 'goblin', 'goblin'], requiredMembers: 3, requiredLevel: 5,
  },
];

export const TIER_REQUIREMENTS: Record<QuestTier, { guildLevel: number }> = {
  F: { guildLevel: 1 },
  E: { guildLevel: 1 },
  D: { guildLevel: 2 },
  C: { guildLevel: 3 },
  B: { guildLevel: 4 },
  A: { guildLevel: 5 },
  S: { guildLevel: 6 },
};
