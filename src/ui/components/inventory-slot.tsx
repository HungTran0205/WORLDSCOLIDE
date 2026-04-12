/** Single inventory slot — shows item icon + quantity badge or empty placeholder. */

import type { ItemID } from '@/game/data/items';
import { ITEM_DATABASE } from '@/game/data/items';
import { GameIcon } from './game-icon';

/** Rarity → CSS border/tint color */
const RARITY_COLORS: Record<string, string> = {
  COMMON: 'transparent',
  UNCOMMON: '#2ecc71',
  RARE: '#3498db',
  EPIC: '#9b59b6',
  LEGENDARY: '#f39c12',
};

interface InventorySlotProps {
  item?: { itemId: ItemID; quantity: number };
  isSelected?: boolean;
  onClick?: () => void;
}

export function InventorySlot({ item, isSelected, onClick }: InventorySlotProps) {
  if (!item) {
    return <div className="inventory-slot inventory-slot--empty" />;
  }

  const template = ITEM_DATABASE[item.itemId];
  const rarityColor = RARITY_COLORS[template.rarity] ?? 'transparent';

  return (
    <div
      className={`inventory-slot inventory-slot--occupied${isSelected ? ' inventory-slot--selected' : ''}`}
      style={{ borderColor: isSelected ? '#ffd700' : rarityColor !== 'transparent' ? rarityColor : undefined }}
      onClick={onClick}
      title={template.name}
    >
      <GameIcon category="item" id={item.itemId} size={40} fallbackText={template.name.slice(0, 3)} />
      {item.quantity > 1 && <span className="inventory-slot__qty">{item.quantity}</span>}
    </div>
  );
}
