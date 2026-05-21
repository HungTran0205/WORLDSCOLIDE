/** Rank info + promotion button for character detail panel */

import { useTranslation } from 'react-i18next';
import type { Member, GuildRank } from '@/game/state/game-state';
import { GUILD_RANKS, meetsPromotionRequirements, getNextRank } from '@/game/data/ranks';
import { rankLabel } from '@/i18n/content-wrappers';

interface RankPromotionSectionProps {
  member: Member;
  onPromote?: () => void;
  canAffordPromote?: boolean;
}

export function RankPromotionSection({ member, onPromote, canAffordPromote }: RankPromotionSectionProps) {
  const { t } = useTranslation();
  const currentRank = member.rank as GuildRank;
  const def = GUILD_RANKS[currentRank];
  const perks = def?.perks;
  const nextRank = getNextRank(currentRank);
  const promotion = def?.promotion;
  const meetsReqs = meetsPromotionRequirements(member);

  const upkeepSuffix = perks
    ? perks.upkeepModifier < 1
      ? t('rankPromotion.upkeepLess', { pct: Math.round((1 - perks.upkeepModifier) * 100) })
      : perks.upkeepModifier > 1
        ? t('rankPromotion.upkeepMore', { pct: Math.round((perks.upkeepModifier - 1) * 100) })
        : t('rankPromotion.upkeepNormal')
    : '';

  return (
    <div className="panel-section">
      <div style={{ color: '#ffd700', fontSize: '0.85rem', marginBottom: 6 }}>
        {t('rankPromotion.title')}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: 4 }}>
        {t('rankPromotion.missions', { count: member.missionsCompleted })}
      </div>
      {perks && (
        <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 8 }}>
          {t('rankPromotion.perks', { expBonus: perks.expBonusPct })}{upkeepSuffix}
        </div>
      )}
      {nextRank && promotion && (
        <div>
          <div style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: 4 }}>
            {t('rankPromotion.next', {
              rank: rankLabel(nextRank),
              level: promotion.minLevel,
              missions: promotion.minMissionsCompleted,
              gold: promotion.goldCost,
            })}
          </div>
          <button
            className="panel-btn"
            disabled={!meetsReqs || !canAffordPromote}
            onClick={onPromote}
            style={{ marginTop: 4 }}
          >
            {t('rankPromotion.promote', { rank: rankLabel(nextRank), gold: promotion.goldCost })}
          </button>
        </div>
      )}
    </div>
  );
}
