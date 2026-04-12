/** Item detail popup — shows full item info when an inventory slot is clicked. */

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
  onClose: () => void;
}

export function ItemDetailPopup({ itemId, quantity, onClose }: ItemDetailPopupProps) {
  const template = ITEM_DATABASE[itemId];
  const rarityColor = RARITY_COLORS[template.rarity] ?? '#808080';
  const totalValue = template.basePrice * quantity;

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
      </div>
    </div>
  );
}
