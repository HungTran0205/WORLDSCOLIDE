/**
 * Tavern inventory gift picker — modal-in-modal item chooser for negotiate.
 *
 * Maps visitor.preferredGiftCategory ('consumable' | 'material' | 'equipable')
 * to ITEM_DATABASE category ('consumable' | 'material' | …). Items matching
 * the visitor's preferred category get a `is-preferred` highlight and resolve
 * as `tier: 'personal'` (+15%); all others are `tier: 'generic'` (+5%).
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { ITEM_DATABASE, type ItemID } from '@/game/data/items';
import type { TavernVisitor } from '@/game/state/game-state';
import type { GiftSpec } from '@/game/systems/tavern-negotiation';

interface GiftPickerProps {
  visitor: TavernVisitor;
  visibilityScore: number;
  onClose: () => void;
  onPick: (gift: GiftSpec | undefined) => void;
}

const PREFERRED_TYPE_MAP: Record<TavernVisitor['preferredGiftCategory'], 'MATERIAL' | 'CONSUMABLE' | 'EQUIPMENT'> = {
  consumable: 'CONSUMABLE',
  material: 'MATERIAL',
  equipable: 'EQUIPMENT',
};

export function TavernInventoryGiftPicker({ visitor, visibilityScore, onClose, onPick }: GiftPickerProps) {
  const { t } = useTranslation();
  const items = useGameStore((s) => s.inventory.items);

  const preferredType = PREFERRED_TYPE_MAP[visitor.preferredGiftCategory];
  const showHighlight = visibilityScore >= 27;

  const entries = useMemo(() => {
    return Object.entries(items)
      .filter(([, qty]) => (qty ?? 0) > 0)
      .map(([id, qty]) => ({ id: id as ItemID, qty: qty ?? 0, template: ITEM_DATABASE[id as ItemID] }))
      .filter((e) => e.template);
  }, [items]);

  const [filter, setFilter] = useState<'all' | 'consumable' | 'material' | 'equipment'>('all');
  const filtered = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((e) => e.template.type.toLowerCase() === filter);
  }, [entries, filter]);

  return (
    <div className="tv-modal-overlay" onClick={onClose} style={{ zIndex: 270 }}>
      <div className="tv-negotiate-modal parchment-surface parchment-frame" onClick={(e) => e.stopPropagation()}>
        <div className="tv-modal-header">
          <h3 className="tv-modal-title parchment-title">{t('tavern.gift.title')}</h3>
          <button className="tv-btn is-small is-ghost" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', 'consumable', 'material', 'equipment'] as const).map((f) => (
            <button
              key={f}
              className={`tv-btn is-small ${filter === f ? 'is-primary' : ''}`}
              onClick={() => setFilter(f)}
            >
              {t(`tavern.gift.filter.${f}`)}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="tv-gift-empty">{t('tavern.gift.empty')}</div>
        ) : (
          <div className="tv-gift-grid">
            {filtered.map((e) => {
              const isPreferred = showHighlight && e.template.type === preferredType;
              return (
                <button
                  key={e.id}
                  className={`tv-gift-cell ${isPreferred ? 'is-preferred' : ''}`}
                  onClick={() => {
                    onPick({ itemId: e.id, tier: e.template.type === preferredType ? 'personal' : 'generic' });
                    onClose();
                  }}
                  title={`${e.template.name} ×${e.qty}${isPreferred ? ' (★ preferred)' : ''}`}
                >
                  <span style={{ fontSize: '0.55rem', lineHeight: 1.1 }}>{e.template.name.slice(0, 12)}</span>
                  <span style={{ color: 'var(--ink-faded)' }}>×{e.qty}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="tv-modal-footer">
          <button className="tv-btn is-ghost" onClick={() => { onPick(undefined); onClose(); }}>
            {t('tavern.gift.none')}
          </button>
          <button className="tv-btn" onClick={onClose}>{t('common.cancel')}</button>
        </div>
      </div>
    </div>
  );
}
