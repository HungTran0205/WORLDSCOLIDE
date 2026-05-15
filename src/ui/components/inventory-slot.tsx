/** Single inventory slot — shows item icon + quantity badge or empty placeholder. */

import type { ItemID } from '@/game/data/items';
import { ITEM_DATABASE } from '@/game/data/items';
import { GameIcon } from './game-icon';

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
  const rarityMod = template.rarity !== 'COMMON'
    ? ` inventory-slot--rarity-${template.rarity.toLowerCase()}`
    : '';
  const selectedMod = isSelected ? ' inventory-slot--selected' : '';

  return (
    <div
      className={`inventory-slot inventory-slot--occupied${rarityMod}${selectedMod}`}
      onClick={onClick}
      title={template.name}
    >
      <GameIcon category="item" id={item.itemId} size={40} fallbackText={template.name.slice(0, 3)} />
      {item.quantity > 1 && <span className="inventory-slot__qty">{item.quantity}</span>}
    </div>
  );
}
