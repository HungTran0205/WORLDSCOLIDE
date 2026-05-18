/**
 * Hire merc confirm modal — direct mercenary hire at 1.0× cost.
 * Validates gold + concurrent-merc cap before dispatching `hireMerc`.
 */

import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { TavernVisitor } from '@/game/state/game-state';
import { hireMercCost } from '@/game/systems/tavern-negotiation';
import { concurrentMercCap } from '@/game/systems/tavern-merc-lifecycle';

interface HireMercModalProps {
  visitor: TavernVisitor;
  onClose: () => void;
}

const formatGold = (n: number) => new Intl.NumberFormat('en-US').format(n);

export function TavernHireMercModal({ visitor, onClose }: HireMercModalProps) {
  const { t } = useTranslation();
  const gold = useGameStore((s) => s.gold);
  const tavern = useGameStore((s) => s.tavern);
  const hireMerc = useGameStore((s) => s.hireMerc);

  const cost = hireMercCost(visitor);
  const canAfford = gold >= cost;
  const slotsUsed = tavern.mercContracts.length;
  const slotsCap = concurrentMercCap(tavern.level);
  const slotsFull = slotsUsed >= slotsCap;
  const canHire = canAfford && !slotsFull;

  return (
    <div className="tv-modal-overlay" onClick={onClose}>
      <div className="tv-modal-secondary parchment-surface parchment-frame" onClick={(e) => e.stopPropagation()}>
        <h3 className="parchment-title">{t('tavern.hireMerc.title', { archetype: visitor.archetype })}</h3>
        <div className="parchment-text">{t('tavern.hireMerc.body')}</div>
        <div className="tv-modal-line">
          <span>{t('tavern.hireMerc.cost')}</span>
          <span className="tv-money" style={{ color: canAfford ? 'var(--ink-status-ok)' : 'var(--ink-status-bad)' }}>
            {formatGold(cost)}g
          </span>
        </div>
        <div className="tv-modal-line">
          <span>{t('tavern.hireMerc.gold')}</span>
          <span className="tv-money">{formatGold(gold)}g</span>
        </div>
        <div className="tv-modal-line">
          <span>{t('tavern.hireMerc.slots')}</span>
          <span>{slotsUsed}/{slotsCap}</span>
        </div>
        <div className="tv-slot-bar">
          <div className="tv-slot-bar-fill" style={{ width: `${(slotsUsed / slotsCap) * 100}%` }} />
        </div>
        {slotsFull && (
          <div className="parchment-text" style={{ color: 'var(--ink-red)', fontSize: '0.7rem' }}>
            {t('tavern.hireMerc.slotsFullHint')}
          </div>
        )}
        <div className="tv-modal-footer">
          <button className="tv-btn is-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button
            className="tv-btn is-primary"
            onClick={() => { if (hireMerc(visitor.id)) onClose(); }}
            disabled={!canHire}
          >
            {t('tavern.hireMerc.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
