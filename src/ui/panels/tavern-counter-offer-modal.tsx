/**
 * Counter-offer modal — visitor refuses to join but offers merc work at 1.2× cost.
 * Accept → hireMerc(visitorId, 1.2) via store's `acceptCounterOffer` wrapper.
 * Decline → visitor leaves roster (removed from currentRoster).
 */

import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { TavernVisitor } from '@/game/state/game-state';
import { hireMercCost } from '@/game/systems/tavern-negotiation';
import { getSpritePath, getAvatarPath } from '@/scene/sprites/sprite-path-resolver';

interface CounterOfferModalProps {
  visitor: TavernVisitor;
  visibilityScore: number;
  onClose: () => void;
}

const formatGold = (n: number) => new Intl.NumberFormat('en-US').format(n);

export function TavernCounterOfferModal({ visitor, visibilityScore, onClose }: CounterOfferModalProps) {
  const { t } = useTranslation();
  const gold = useGameStore((s) => s.gold);
  const acceptCounterOffer = useGameStore((s) => s.acceptCounterOffer);

  const baseCost = hireMercCost(visitor);
  const counterCost = hireMercCost(visitor, 1.2);
  const canAfford = gold >= counterCost;
  const base = getSpritePath(visitor.civilization, visitor.archetype, visitor.gender);
  const src = getAvatarPath(base);

  return (
    <div className="tv-modal-overlay" onClick={onClose}>
      <div className="tv-modal-secondary parchment-surface parchment-frame" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="tv-card-portrait ink-pixelated" style={{ width: 48, height: 48 }}>
            <img src={src} alt={visitor.name} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <h3 className="parchment-title" style={{ margin: 0 }}>{t('tavern.counter.title')}</h3>
        </div>
        <div className="parchment-text">
          {t('tavern.counter.body', { archetype: visitor.archetype })}
        </div>
        <div className="tv-modal-line">
          <span>{t('tavern.counter.directCost')}</span>
          <span><span className="tv-money is-strike">{formatGold(baseCost)}g</span><span className="tv-money is-bumped">{formatGold(counterCost)}g</span></span>
        </div>
        {visibilityScore >= 27 && (
          <div className="parchment-text" style={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
            💡 {t('tavern.counter.premiumHint')}
          </div>
        )}
        <div className="tv-modal-footer">
          <button className="tv-btn is-ghost" onClick={onClose}>{t('tavern.counter.decline')}</button>
          <button
            className="tv-btn is-primary"
            onClick={() => {
              if (acceptCounterOffer(visitor.id)) onClose();
            }}
            disabled={!canAfford}
            title={!canAfford ? t('tavern.action.notEnoughGold', { cost: counterCost }) : ''}
          >
            {t('tavern.counter.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
