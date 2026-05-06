/**
 * Workshop Blueprint card — single saved recipe row.
 * Shows name, qty badge, ingredient icons (+ tooltip preview), and
 * Use / Edit / Delete buttons. Stateless: parent handles modal toggling.
 */

import { useTranslation } from 'react-i18next';
import type { WorkshopBlueprint } from '@/game/data/workshop-types';
import { ITEM_DATABASE } from '@/game/data/items';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import { GameIcon } from '@/ui/components/game-icon';

interface Props {
  blueprint: WorkshopBlueprint;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function WorkshopBlueprintCard({ blueprint, onUse, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const tpl = EQUIPMENT_DATABASE[blueprint.templateId];
  const baseItem = ITEM_DATABASE[blueprint.baseMaterial];
  const monsterItem = blueprint.monsterMaterial ? ITEM_DATABASE[blueprint.monsterMaterial] : null;
  const baseCost = tpl?.craftCost ?? 0;

  // Tooltip ingredient preview (per-card hover via title attribute — keeps DOM light)
  const tooltipLines = [
    `${tpl?.name ?? blueprint.templateId}`,
    `${baseCost}× ${baseItem.name}`,
  ];
  if (monsterItem) tooltipLines.push(`1× ${monsterItem.name}`);
  const tooltip = tooltipLines.join('\n');

  return (
    <div className="ws-bp-card" title={tooltip}>
      <div className="ws-bp-card-info">
        <div className="ws-bp-card-head">
          <span className="ws-bp-name">{blueprint.name}</span>
          <span className="ws-bp-qty-badge">×{blueprint.quantity}</span>
        </div>
        <div className="ws-bp-card-icons">
          <span className="ws-bp-icon-cell" title={`${baseCost}× ${baseItem.name}`}>
            <GameIcon
              category="item" id={blueprint.baseMaterial} size={20}
              fallbackText={baseItem.name.slice(0, 2)}
            />
            <span className="ws-bp-icon-qty">×{baseCost}</span>
          </span>
          {monsterItem && blueprint.monsterMaterial && (
            <span className="ws-bp-icon-cell" title={`1× ${monsterItem.name}`}>
              <GameIcon
                category="item" id={blueprint.monsterMaterial} size={20}
                fallbackText={monsterItem.name.slice(0, 2)}
              />
              <span className="ws-bp-icon-qty">×1</span>
            </span>
          )}
          <span className="ws-bp-card-template">→ {tpl?.name ?? blueprint.templateId}</span>
        </div>
      </div>
      <div className="ws-bp-card-actions">
        <button className="ws-btn ws-btn-small ws-btn-primary" onClick={onUse}>
          {t('workshop.blueprint.card.use')}
        </button>
        <button className="ws-btn ws-btn-small" onClick={onEdit} title={t('workshop.blueprint.card.edit')}>
          ✎
        </button>
        <button className="ws-btn ws-btn-small ws-btn-danger" onClick={onDelete} title={t('workshop.blueprint.card.delete')}>
          ✕
        </button>
      </div>
    </div>
  );
}
