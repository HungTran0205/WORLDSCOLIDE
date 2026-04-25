/** Item detail popup — shows full item info when an inventory slot is clicked. */

import { useState } from 'react';
import type { ItemID } from '@/game/data/items';
import { ITEM_DATABASE } from '@/game/data/items';
import { GameIcon } from './game-icon';

/** Rarity → display color */
const RARITY_COLORS: Record<string, string> = {
  COMMON: '#808080',
  UNCOMMON: '#2ecc71',
  RARE: '#3498db',
  EPIC: '#9b59b6',
  LEGENDARY: '#f39c12',
};

interface ItemDetailPopupProps {
  itemId: ItemID;
  quantity: number;
  stackable: boolean;
  onClose: () => void;
  onDrop?: (amount: number) => void;
}

export function ItemDetailPopup({ itemId, quantity, stackable, onClose, onDrop }: ItemDetailPopupProps) {
  const template = ITEM_DATABASE[itemId];
  const rarityColor = RARITY_COLORS[template.rarity] ?? '#808080';
  const totalValue = template.basePrice * quantity;

  const [dropAmount, setDropAmount] = useState(1);

  function handleDrop() {
    const amount = stackable ? Math.min(Math.max(1, dropAmount), quantity) : 1;
    onDrop?.(amount);
  }

  return (
    <div className="item-detail-backdrop" onClick={onClose}>
      <div
        className="item-detail-popup"
        style={{ borderColor: rarityColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="item-detail-popup__header">
          <GameIcon category="item" id={itemId} size={48} fallbackText={template.name.slice(0, 3)} />
          <div>
            <h3 className="item-detail-popup__name">{template.name}</h3>
            <span className="item-detail-popup__type">{template.type}</span>
          </div>
        </div>

        <span className="item-detail-popup__rarity" style={{ color: rarityColor }}>
          {template.rarity}
        </span>

        <p className="item-detail-popup__desc">{template.description}</p>

        <div className="item-detail-popup__stats">
          <div><span className="label">Quantity</span><span>{quantity}</span></div>
          {template.basePrice > 0 && (
            <>
              <div><span className="label">Sell Value</span><span>{template.basePrice}g each</span></div>
              <div><span className="label">Total Value</span><span>{totalValue}g</span></div>
            </>
          )}
        </div>

        {onDrop && (
          <div className="item-detail-popup__drop">
            {stackable && quantity > 1 && (
              <input
                type="number"
                min={1}
                max={quantity}
                value={dropAmount}
                onChange={(e) => setDropAmount(Math.min(quantity, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="item-detail-popup__drop-input"
              />
            )}
            <button className="item-detail-popup__drop-btn" onClick={handleDrop}>
              Drop{stackable && quantity > 1 ? ` ×${Math.min(Math.max(1, dropAmount), quantity)}` : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
