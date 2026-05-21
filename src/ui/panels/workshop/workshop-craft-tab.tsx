/**
 * Workshop Craft tab — Path A (base material only, 20% slot chance) or
 * Path B (base + monster material → guaranteed slot from affinity).
 * Wires to addWorkshopTask + saveBlueprint. MVP: T1 only, Slime Gel only.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { ITEM_DATABASE, type ItemID } from '@/game/data/items';
import { EQUIPMENT_DATABASE, type EquipmentTemplateId } from '@/game/data/equipment-templates';
import type { GuildFacility } from '@/game/state/game-state';
import { getAffinity, isMaterialEnabled } from '@/game/data/workshop-material-affinity';
import { WORKSHOP_CONFIG } from '@/game/data/workshop-config';
import { GameIcon } from '@/ui/components/game-icon';
import { WorkshopBlueprintList } from './workshop-blueprint-list';
import { itemName } from '@/i18n/content-wrappers';

const BASE_MATERIALS: ItemID[] = ['WOOD', 'STONE'];
const MONSTER_MATERIALS: ItemID[] = ['SLIME_GEL'];

interface Props { facility: GuildFacility; }

export function WorkshopCraftTab({ facility }: Props) {
  const { t } = useTranslation();
  const items = useGameStore((s) => s.inventory.items);
  const addWorkshopTask = useGameStore((s) => s.addWorkshopTask);
  const saveBlueprint = useGameStore((s) => s.saveBlueprint);

  const [baseMat, setBaseMat] = useState<ItemID>('WOOD');
  const [monsterMat, setMonsterMat] = useState<ItemID | null>(null);
  const [templateId, setTemplateId] = useState<EquipmentTemplateId>('WOODEN_AXE');
  const [bpModalOpen, setBpModalOpen] = useState(false);
  const [bpName, setBpName] = useState('');
  const [bpQty, setBpQty] = useState(1);

  const eligibleTemplates = useMemo(
    () => Object.values(EQUIPMENT_DATABASE).filter((tpl) => tpl.craftMaterial === baseMat),
    [baseMat],
  );

  // Auto-pick a valid template when base material switches; avoids setState-in-render
  const effectiveTemplateId: EquipmentTemplateId =
    eligibleTemplates.some((tpl) => tpl.id === templateId)
      ? templateId
      : (eligibleTemplates[0]?.id ?? templateId);

  const tpl = EQUIPMENT_DATABASE[effectiveTemplateId];
  const baseCost = tpl?.craftCost ?? 0;
  const haveBase = (items[baseMat] ?? 0) >= baseCost;
  const haveMonster = !monsterMat || (items[monsterMat] ?? 0) >= 1;
  const canCraft = haveBase && haveMonster && eligibleTemplates.length > 0;

  const path = monsterMat ? 'B' : 'A';
  const aff = monsterMat ? getAffinity(monsterMat) : undefined;
  const blueprints = facility.workshopBlueprints ?? [];
  const slotLimit = WORKSHOP_CONFIG.blueprintSlotsByLevel[facility.level - 1] ?? 3;

  function handleCraft() {
    if (!canCraft) return;
    addWorkshopTask(facility.id, {
      kind: 'CRAFT', baseMaterial: baseMat, templateId: effectiveTemplateId,
      ...(monsterMat ? { monsterMaterial: monsterMat } : {}),
    });
  }

  function handleSaveBlueprint() {
    if (!bpName.trim()) return;
    saveBlueprint(facility.id, {
      name: bpName.trim(), baseMaterial: baseMat, templateId: effectiveTemplateId,
      quantity: bpQty,
      ...(monsterMat ? { monsterMaterial: monsterMat } : {}),
    });
    setBpName(''); setBpQty(1); setBpModalOpen(false);
  }

  return (
    <div className="ws-tab-body ws-craft">
      {/* Base material picker */}
      <div className="ws-section">
        <div className="ws-section-title">{t('workshop.craft.baseMaterial')}</div>
        <div className="ws-mat-row">
          {BASE_MATERIALS.map((id) => {
            const owned = Math.floor(items[id] ?? 0);
            return (
              <button
                key={id}
                className={`ws-mat-cell ${baseMat === id ? 'is-selected' : ''}`}
                onClick={() => setBaseMat(id)}
                title={`${itemName(id)} ×${owned}`}
              >
                <GameIcon category="item" id={id} size={28} fallbackText={ITEM_DATABASE[id].name.slice(0, 2)} />
                <span className="ws-mat-count">×{owned}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional monster material (Path B) */}
      <div className="ws-section">
        <div className="ws-section-title">{t('workshop.craft.monsterMaterialTitle')}</div>
        <div className="ws-mat-row">
          <button
            className={`ws-mat-cell ${monsterMat === null ? 'is-selected' : ''}`}
            onClick={() => setMonsterMat(null)}
            title={t('workshop.craft.nonePathA')}
          >
            <span className="ws-mat-none">∅</span>
          </button>
          {MONSTER_MATERIALS.map((id) => {
            const owned = Math.floor(items[id] ?? 0);
            const enabled = isMaterialEnabled(id);
            return (
              <button
                key={id}
                className={`ws-mat-cell ${monsterMat === id ? 'is-selected' : ''} ${enabled ? '' : 'is-disabled'}`}
                onClick={() => enabled && setMonsterMat(id)}
                disabled={!enabled}
                title={enabled ? `${itemName(id)} ×${owned}` : `${itemName(id)} (locked)`}
              >
                <GameIcon category="item" id={id} size={28} fallbackText={ITEM_DATABASE[id].name.slice(0, 2)} />
                <span className="ws-mat-count">×{owned}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template selector */}
      <div className="ws-section">
        <div className="ws-section-title">{t('workshop.craft.template')}</div>
        <select className="ws-select" value={effectiveTemplateId} onChange={(e) => setTemplateId(e.target.value as EquipmentTemplateId)}>
          {eligibleTemplates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
          ))}
        </select>
      </div>

      {/* Path indicator + range */}
      <div className="ws-path-card">
        <div className="ws-path-label">{t('workshop.craft.pathLabel', { path })}</div>
        <div className="ws-path-detail">
          {path === 'A'
            ? t('workshop.craft.pathADetail', { chance: Math.round(WORKSHOP_CONFIG.pathASlotChance * 100) })
            : aff
              ? t('workshop.craft.pathBDetail', { statKey: aff.statKey, min: aff.range[0], max: aff.range[1] })
              : t('workshop.craft.pathBUnavailable')}
        </div>
        <div className="ws-cost-line">
          {monsterMat
            ? t('workshop.craft.costLineWithMonster', {
                baseCost,
                baseName: itemName(baseMat),
                monsterName: itemName(monsterMat),
              })
            : t('workshop.craft.costLine', { baseCost, baseName: itemName(baseMat) })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="ws-actions">
        <button className="ws-btn ws-btn-primary" disabled={!canCraft} onClick={handleCraft}>
          {t('workshop.craft.action.craft')}
        </button>
        <button
          className="ws-btn ws-btn-ghost"
          disabled={blueprints.length >= slotLimit}
          onClick={() => setBpModalOpen(true)}
          title={blueprints.length >= slotLimit ? t('workshop.blueprint.save.fullHint') : undefined}
        >
          {t('workshop.craft.action.saveBlueprint', { used: blueprints.length, limit: slotLimit })}
        </button>
      </div>

      {/* Blueprint list (Use / Edit / Delete + slot indicator) */}
      <WorkshopBlueprintList facility={facility} />

      {/* Save Blueprint modal */}
      {bpModalOpen && (
        <div className="ws-modal-overlay" onClick={() => setBpModalOpen(false)}>
          <div className="ws-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ws-modal-title">{t('workshop.blueprint.save.title')}</div>
            <label className="ws-modal-field">
              {t('workshop.blueprint.edit.name')}
              <input
                className="ws-input" value={bpName} maxLength={24}
                onChange={(e) => setBpName(e.target.value)} autoFocus
              />
            </label>
            <label className="ws-modal-field">
              {t('workshop.blueprint.edit.qty')}
              <input
                className="ws-input" type="number" min={1} max={99} value={bpQty}
                onChange={(e) => setBpQty(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)))}
              />
            </label>
            <div className="ws-actions">
              <button className="ws-btn ws-btn-primary" disabled={!bpName.trim()} onClick={handleSaveBlueprint}>
                {t('common.save')}
              </button>
              <button className="ws-btn ws-btn-ghost" onClick={() => setBpModalOpen(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
