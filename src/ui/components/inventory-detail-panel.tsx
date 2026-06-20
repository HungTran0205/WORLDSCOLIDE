/** Detail panel for selected inventory entry — shows icon, stats, and action buttons. */

import { useTranslation } from 'react-i18next';
import type { UnifiedSlotEntry } from '@/game/state/inventory-slice';
import { ITEM_DATABASE } from '@/game/data/items';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import { itemName, itemDescription, equipmentName } from '@/i18n/content-wrappers';
import { GameIcon } from './game-icon';

interface InventoryDetailPanelProps {
  entry: UnifiedSlotEntry | null;
  equippedByName?: string;
  onEquip?: () => void;
  onUse?: () => void;
  onDrop?: (amount: number) => void;
}

// Rarity colors used as inline style on chip borders inside pf-content (parchment bg).
// These are border colors only — text is forced to --bp-text-ink via .inv-detail-rarity CSS.
// COMMON uses bp-text-muted (#5a4630) since it has no distinct hue tier.
const RARITY_COLOR: Record<string, string> = {
  COMMON:    '#5a4630', // = --bp-text-muted; neutral ink border (6.1:1 on parchment ✓)
  UNCOMMON:  '#2ecc71', // green — border only, not text
  RARE:      '#3498db', // blue  — border only, not text
  EPIC:      '#9b59b6', // purple — border only, not text
  LEGENDARY: '#f39c12', // amber — border only, not text
};

export function InventoryDetailPanel({ entry, equippedByName, onEquip, onUse, onDrop }: InventoryDetailPanelProps) {
  const { t } = useTranslation();

  if (!entry) {
    return <div className="inv-detail-empty">{t('inventoryDetail.empty')}</div>;
  }

  if (entry.kind === 'item') {
    const tpl = ITEM_DATABASE[entry.itemId];
    const rarityColor = RARITY_COLOR[tpl.rarity] ?? '#a09080';
    const isConsumable = tpl.type === 'CONSUMABLE';
    const displayName = itemName(entry.itemId);
    const displayDesc = itemDescription(entry.itemId);
    return (
      <div>
        <div className="inv-detail-icon-frame">
          <GameIcon category="item" id={entry.itemId} size={48} fallbackText={displayName.slice(0, 3)} />
        </div>
        <h3 className="inv-detail-name">{displayName}</h3>
        <div className="inv-detail-type">{tpl.type}</div>
        <span className="inv-detail-rarity" style={{ borderColor: rarityColor }}>{tpl.rarity}</span>
        <p className="inv-detail-desc">{displayDesc}</p>
        <div className="inv-detail-stats">
          <div className="inv-detail-stat-row">
            <span className="inv-detail-stat-label">{t('inventoryDetail.quantity')}</span>
            <span>{entry.quantity}</span>
          </div>
          <div className="inv-detail-stat-row">
            <span className="inv-detail-stat-label">{t('inventoryDetail.sellValue')}</span>
            <span>{t('inventoryDetail.sellPer', { price: tpl.basePrice })}</span>
          </div>
        </div>
        <div className="inv-detail-actions">
          {isConsumable && onUse && (
            <button className="inv-detail-btn inv-detail-btn--use" onClick={onUse}>{t('inventoryDetail.use')}</button>
          )}
          {onDrop && (
            <button className="inv-detail-btn inv-detail-btn--drop" onClick={() => onDrop(1)}>{t('inventoryDetail.drop1')}</button>
          )}
        </div>
      </div>
    );
  }

  // equipment entry
  const tpl = EQUIPMENT_DATABASE[entry.templateId];
  const rarityColor = RARITY_COLOR[tpl.rarity] ?? '#a09080';
  const durPct = Math.round((entry.item.durability / tpl.maxDurability) * 100);
  const displayName = equipmentName(entry.templateId);
  const slotLabel = tpl.slot.charAt(0).toUpperCase() + tpl.slot.slice(1);
  return (
    <div>
      <div className="inv-detail-icon-frame">
        <GameIcon category="item" id={entry.templateId} size={48} fallbackText={displayName.slice(0, 3)} />
      </div>
      <h3 className="inv-detail-name">{displayName}</h3>
      <div className="inv-detail-type">{slotLabel}</div>
      <span className="inv-detail-rarity" style={{ borderColor: rarityColor }}>{tpl.rarity}</span>
      {equippedByName && (
        <div className="inv-detail-equipped-by">{t('inventoryDetail.equippedBy', { name: equippedByName })}</div>
      )}
      <div className="inv-detail-stats">
        {tpl.damage != null && (
          <div className="inv-detail-stat-row"><span className="inv-detail-stat-label">{t('inventoryDetail.damage')}</span><span>+{tpl.damage}</span></div>
        )}
        {tpl.defense != null && (
          <div className="inv-detail-stat-row"><span className="inv-detail-stat-label">{t('inventoryDetail.defense')}</span><span>+{tpl.defense}</span></div>
        )}
        {tpl.hp != null && (
          <div className="inv-detail-stat-row"><span className="inv-detail-stat-label">{t('inventoryDetail.hp')}</span><span>+{tpl.hp}</span></div>
        )}
        <div className="inv-detail-stat-row">
          <span className="inv-detail-stat-label">{t('inventoryDetail.durability')}</span>
          <span style={{ color: durPct > 50 ? '#2ecc71' : durPct > 20 ? '#f39c12' : '#e74c3c' }}>
            {entry.item.durability}/{tpl.maxDurability}
          </span>
        </div>
        {entry.item.slots && entry.item.slots.length > 0 && (
          <div className="inv-detail-stat-row">
            <span className="inv-detail-stat-label">{t('inventoryDetail.affixes')}</span>
            <span className="inv-detail-affix-chips">
              {entry.item.slots.map((s, i) => (
                <span key={i} className="inv-detail-affix-chip">{s.statKey} +{s.value}</span>
              ))}
            </span>
          </div>
        )}
      </div>
      <div className="inv-detail-actions">
        {!equippedByName && onEquip && (
          <button className="inv-detail-btn inv-detail-btn--equip" onClick={onEquip}>{t('inventoryDetail.equip')}</button>
        )}
        {onDrop && (
          <button className="inv-detail-btn inv-detail-btn--drop" onClick={() => onDrop(1)}>{t('inventoryDetail.drop')}</button>
        )}
      </div>
    </div>
  );
}
