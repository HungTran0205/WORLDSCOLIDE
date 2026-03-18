/** Rank info + promotion button for character detail panel */

import type { Member, GuildRank } from '@/game/state/game-state';
import { GUILD_RANKS, meetsPromotionRequirements, getNextRank } from '@/game/data/ranks';

interface RankPromotionSectionProps {
  member: Member;
  onPromote?: () => void;
  canAffordPromote?: boolean;
}

export function RankPromotionSection({ member, onPromote, canAffordPromote }: RankPromotionSectionProps) {
  const currentRank = member.rank as GuildRank;
  const def = GUILD_RANKS[currentRank];
  const perks = def?.perks;
  const nextRank = getNextRank(currentRank);
  const promotion = def?.promotion;
  const meetsReqs = meetsPromotionRequirements(member);

  return (
    <div className="panel-section">
      <div style={{ color: '#ffd700', fontSize: '0.85rem', marginBottom: 6 }}>
        Rank & Progression
      </div>
      <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: 4 }}>
        Missions Completed: {member.missionsCompleted}
      </div>
      {perks && (
        <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 8 }}>
          Perks: +{perks.expBonusPct}% EXP
          {perks.upkeepModifier < 1 ? `, ${Math.round((1 - perks.upkeepModifier) * 100)}% less upkeep` :
           perks.upkeepModifier > 1 ? `, +${Math.round((perks.upkeepModifier - 1) * 100)}% upkeep` :
           ', normal upkeep'}
        </div>
      )}
      {nextRank && promotion && (
        <div>
          <div style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: 4 }}>
            Next: {nextRank} — Lv.{promotion.minLevel}+ | {promotion.minMissionsCompleted}+ missions | {promotion.goldCost}g
          </div>
          <button
            className="panel-btn"
            disabled={!meetsReqs || !canAffordPromote}
            onClick={onPromote}
            style={{ marginTop: 4 }}
          >
            Promote to {GUILD_RANKS[nextRank].label} ({promotion.goldCost}g)
          </button>
        </div>
      )}
    </div>
  );
}
