/**
 * Tavern rumor banner — next-day reveal hint at top of panel.
 * Hidden if Keeper INT < 15 (effective max INT across assigned keepers).
 */

import { useTranslation } from 'react-i18next';
import type { RumorEntry } from '@/game/state/game-state';

interface RumorBannerProps {
  rumor: RumorEntry | null;
  keeperInt: number;
}

export function TavernRumorBanner({ rumor, keeperInt }: RumorBannerProps) {
  const { t } = useTranslation();
  if (!rumor || keeperInt < 15) return null;

  let text = '';
  if (rumor.tier === 'specific' && rumor.archetype && rumor.civilization) {
    text = t('tavern.rumor.specific', { archetype: rumor.archetype, civ: rumor.civilization });
  } else if (rumor.tier === 'class' && rumor.archetype) {
    text = t('tavern.rumor.class', { archetype: rumor.archetype });
  } else {
    text = t('tavern.rumor.vague');
  }

  return (
    <div className="tv-rumor" role="status" aria-live="polite">
      <span className="tv-rumor-icon" aria-hidden="true">📜</span>
      <span>{text}</span>
      <span className="tv-rumor-tag">— {t('tavern.rumor.tomorrow')}</span>
    </div>
  );
}
