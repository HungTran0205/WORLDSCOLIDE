/**
 * Insult event modal — punishing UI for >45 margin outcome.
 * 30% gone-forever, 70% storm-off + Tavern Rep -1 + 24h global debuff.
 * Single action: "Acknowledge" (consequence is enforced).
 */

import { useTranslation } from 'react-i18next';
import type { TavernVisitor } from '@/game/state/game-state';

interface InsultEventModalProps {
  visitor: TavernVisitor;
  goneForever: boolean;
  onClose: () => void;
}

export function TavernInsultEventModal({ visitor, goneForever, onClose }: InsultEventModalProps) {
  const { t } = useTranslation();
  return (
    <div className="tv-modal-overlay" onClick={onClose}>
      <div
        className="tv-modal-secondary parchment-surface parchment-frame is-insult"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
      >
        <h3 className="parchment-title" style={{ color: 'var(--ink-red)' }}>
          {t('tavern.insult.title', { archetype: visitor.archetype })}
        </h3>
        <div className="parchment-text">
          {t('tavern.insult.stormOff', { archetype: visitor.archetype })}
        </div>
        <div className="parchment-text" style={{ fontStyle: 'italic' }}>
          {goneForever
            ? t('tavern.insult.goneForever')
            : t('tavern.insult.consequences')}
        </div>
        <div className="tv-modal-footer">
          <button className="tv-btn is-primary" onClick={onClose}>{t('tavern.insult.acknowledge')}</button>
        </div>
      </div>
    </div>
  );
}
