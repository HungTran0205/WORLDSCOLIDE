/** Detail panel for selected inventory entry — shows icon, stats, and action buttons. */

import type { UnifiedSlotEntry } from '@/game/state/inventory-slice';
import { ITEM_DATABASE } from '@/game/data/items';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import { GameIcon } from './game-icon';

interface InventoryDetailPanelProps {
  entry: UnifiedSlotEntry | null;
  equippedByName?: string;
  onEquip?: () => void;
  onUse?: () => void;
  onDrop?: (amount: number) => void;
}

const RARITY_COLOR: Record<string, string> = {
  COMMON: '#a09080', UNCOMMON: '#2ecc71', RARE: '#3498db', EPIC: '#9b59b6', LEGENDARY: '#f39c12',
};

export function InventoryDetailPanel({ entry, equippedByName, onEquip, onUse, onDrop }: InventoryDetailPanelProps) {
  if (!entry) {
    return <div className="inv-detail-empty">Select an item<br />to see details</div>;
  }

  if (entry.kind === 'item') {
    const tpl = ITEM_DATABASE[entry.itemId];
    const rarityColor = RARITY_COLOR[tpl.rarity] ?? '#a09080';
    const isConsumable = tpl.type === 'CONSUMABLE';
    return (
      <div>
        <div className="inv-detail-icon-frame">
          <GameIcon category="item" id={entry.itemId} size={48} fallbackText={tpl.name.slice(0, 3)} />
        </div>
        <h3 className="inv-detail-name">{tpl.name}</h3>
        <div className="inv-detail-type">{tpl.type}</div>
        <span className="inv-detail-rarity" style={{ color: rarityColor }}>{tpl.rarity}</span>
        <p className="inv-detail-desc">{tpl.description}</p>
        <div className="inv-detail-stats">
          <div className="inv-detail-stat-row">
            <span className="inv-detail-stat-label">Quantity</span>
            <span>{entry.quantity}</span>
          </div>
          <div className="inv-detail-stat-row">
            <span className="inv-detail-stat-label">Sell value</span>
            <span>{tpl.basePrice}g each</span>
          </div>
        </div>
        <div className="inv-detail-actions">
          {isConsumable && onUse && (
            <button className="inv-detail-btn inv-detail-btn--use" onClick={onUse}>Use</button>
          )}
          {onDrop && (
            <button className="inv-detail-btn inv-detail-btn--drop" onClick={() => onDrop(1)}>Drop 1</button>
          )}
        </div>
      </div>
    );
  }

  // equipment entry
  const tpl = EQUIPMENT_DATABASE[entry.templateId];
  const rarityColor = RARITY_COLOR[tpl.rarity] ?? '#a09080';
  const durPct = Math.round((entry.item.durability / tpl.maxDurability) * 100);
  const slotLabel = tpl.slot === 'headgear' ? 'Headgear' : tpl.slot.charAt(0).toUpperCase() + tpl.slot.slice(1);
  return (
    <div>
      <div className="inv-detail-icon-frame">
        <GameIcon category="item" id={entry.templateId} size={48} fallbackText={tpl.name.slice(0, 3)} />
      </div>
      <h3 className="inv-detail-name">{tpl.name}</h3>
      <div className="inv-detail-type">{slotLabel}</div>
      <span className="inv-detail-rarity" style={{ color: rarityColor }}>{tpl.rarity}</span>
      {equippedByName && (
        <div className="inv-detail-equipped-by">Equipped by: {equippedByName}</div>
      )}
      <div className="inv-detail-stats">
        {tpl.damage != null && (
          <div className="inv-detail-stat-row"><span className="inv-detail-stat-label">Damage</span><span>+{tpl.damage}</span></div>
        )}
        {tpl.defense != null && (
          <div className="inv-detail-stat-row"><span className="inv-detail-stat-label">Defense</span><span>+{tpl.defense}</span></div>
        )}
        {tpl.hp != null && (
          <div className="inv-detail-stat-row"><span className="inv-detail-stat-label">HP</span><span>+{tpl.hp}</span></div>
        )}
        <div className="inv-detail-stat-row">
          <span className="inv-detail-stat-label">Durability</span>
          <span style={{ color: durPct > 50 ? '#2ecc71' : durPct > 20 ? '#f39c12' : '#e74c3c' }}>
            {entry.item.durability}/{tpl.maxDurability}
          </span>
        </div>
      </div>
      <div className="inv-detail-actions">
        {!equippedByName && onEquip && (
          <button className="inv-detail-btn inv-detail-btn--equip" onClick={onEquip}>Equip</button>
        )}
        {onDrop && (
          <button className="inv-detail-btn inv-detail-btn--drop" onClick={() => onDrop(1)}>Drop</button>
        )}
      </div>
    </div>
  );
}
