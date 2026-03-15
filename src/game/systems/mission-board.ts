import type { Mission, QuestTier } from '@/game/state/game-state';
import { MISSIONS, TIER_REQUIREMENTS } from '@/game/data/missions';

/** Filter missions available at current guild level */
export function generateMissionBoard(guildLevel: number, unlockedTiers: QuestTier[]): Mission[] {
  return MISSIONS.filter(
    (m) => unlockedTiers.includes(m.tier) && TIER_REQUIREMENTS[m.tier].guildLevel <= guildLevel,
  );
}

/** Shuffle and pick N missions for the board */
export function refreshBoard(available: Mission[], count: number = 5): Mission[] {
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
