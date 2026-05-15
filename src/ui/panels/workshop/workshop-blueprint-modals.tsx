/**
 * Workshop Blueprint sub-modals — Use / Edit / Delete.
 * Use modal: qty override + estimated total time + inventory shortfall warning.
 * Edit modal: rename + default qty (ingredients are immutable per spec §5).
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility } from '@/game/state/game-state';
import type { WorkshopBlueprint } from '@/game/data/workshop-types';
import { ITEM_DATABASE } from '@/game/data/items';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import { getCraftingTime, getTierForMaterial } from '@/game/data/workshop-config';

function formatSeconds(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// ─── Use modal ─────────────────────────────────────────────────────────────

export function BlueprintUseModal({
  facility, blueprint, onClose,
}: { facility: GuildFacility; blueprint: WorkshopBlueprint; onClose: () => void }) {
  const { t } = useTranslation();
  const enqueueBlueprint = useGameStore((s) => s.enqueueBlueprint);
  const items = useGameStore((s) => s.inventory.items);
  const [qty, setQty] = useState<number>(blueprint.quantity);

  const tpl = EQUIPMENT_DATABASE[blueprint.templateId];
  const baseCost = tpl?.craftCost ?? 0;
  const workerCount = Math.max(1, facility.assignedMemberIds.length);
  const tierTime = getCraftingTime(getTierForMaterial(blueprint.baseMaterial));
  const totalSeconds = Math.ceil((qty * tierTime) / workerCount);

  // Inventory feasibility — how many of `qty` will actually run start-to-finish
  // with the materials currently on hand. The system will skip-on-missing-mat
  // at task-start, so this is a "best case if no other consumers" estimate.
  const haveBase = Math.floor(items[blueprint.baseMaterial] ?? 0);
  const haveMonster = blueprint.monsterMaterial
    ? Math.floor(items[blueprint.monsterMaterial] ?? 0)
    : Infinity;
  const maxByBase = baseCost > 0 ? Math.floor(haveBase / baseCost) : qty;
  const feasibleCount = Math.min(qty, maxByBase, haveMonster);
  const skipCount = Math.max(0, qty - feasibleCount);

  function handleConfirm() {
    enqueueBlueprint(facility.id, blueprint.id, qty);
    onClose();
  }

  return (
    <div className="ws-modal-overlay" onClick={onClose}>
      <div className="ws-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ws-modal-title">{t('workshop.blueprint.use.title')}</div>
        <div className="ws-bp-modal-recipe">
          <span>{tpl?.name ?? blueprint.templateId}</span>
          <span className="ws-bp-meta">
            {ITEM_DATABASE[blueprint.baseMaterial].name}
            {blueprint.monsterMaterial ? ` + ${ITEM_DATABASE[blueprint.monsterMaterial].name}` : ''}
          </span>
        </div>
        <label className="ws-modal-field">
          {t('workshop.blueprint.use.qty')}
          <input
            className="ws-input" type="number" min={1} max={99} value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)))}
            autoFocus
          />
        </label>
        <div className="ws-bp-estimate">
          {t('workshop.blueprint.use.estimateTime', { time: formatSeconds(totalSeconds) })}
          <span className="ws-bp-estimate-note"> {t('workshop.blueprint.use.estimateNote')}</span>
        </div>
        {skipCount > 0 && (
          <div className="ws-bp-warn">
            {t('workshop.blueprint.use.warning', { count: skipCount })}
          </div>
        )}
        <div className="ws-actions">
          <button className="ws-btn ws-btn-primary" onClick={handleConfirm}>
            {t('workshop.blueprint.use.confirm')}
          </button>
          <button className="ws-btn ws-btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit modal ────────────────────────────────────────────────────────────

export function BlueprintEditModal({
  facility, blueprint, onClose,
}: { facility: GuildFacility; blueprint: WorkshopBlueprint; onClose: () => void }) {
  const { t } = useTranslation();
  const updateBlueprint = useGameStore((s) => s.updateBlueprint);
  const [name, setName] = useState<string>(blueprint.name);
  const [qty, setQty] = useState<number>(blueprint.quantity);

  const trimmed = name.trim();
  const dirty = (trimmed !== blueprint.name && trimmed.length > 0) || qty !== blueprint.quantity;

  function handleSave() {
    if (!dirty) { onClose(); return; }
    updateBlueprint(facility.id, blueprint.id, { name: trimmed, quantity: qty });
    onClose();
  }

  return (
    <div className="ws-modal-overlay" onClick={onClose}>
      <div className="ws-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ws-modal-title">{t('workshop.blueprint.edit.title')}</div>
        <label className="ws-modal-field">
          {t('workshop.blueprint.edit.name')}
          <input
            className="ws-input" value={name} maxLength={24}
            onChange={(e) => setName(e.target.value)} autoFocus
          />
        </label>
        <label className="ws-modal-field">
          {t('workshop.blueprint.edit.qty')}
          <input
            className="ws-input" type="number" min={1} max={99} value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)))}
          />
        </label>
        <div className="ws-bp-edit-note">{t('workshop.blueprint.edit.lockedNote')}</div>
        <div className="ws-actions">
          <button className="ws-btn ws-btn-primary" disabled={!dirty} onClick={handleSave}>
            {t('common.save')}
          </button>
          <button className="ws-btn ws-btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ────────────────────────────────────────────────────────

export function BlueprintDeleteConfirm({
  facility, blueprint, onClose,
}: { facility: GuildFacility; blueprint: WorkshopBlueprint; onClose: () => void }) {
  const { t } = useTranslation();
  const deleteBlueprint = useGameStore((s) => s.deleteBlueprint);
  function handleDelete() {
    deleteBlueprint(facility.id, blueprint.id);
    onClose();
  }
  return (
    <div className="ws-modal-overlay" onClick={onClose}>
      <div className="ws-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ws-modal-title">{t('workshop.blueprint.delete.title')}</div>
        <div className="ws-bp-edit-note">
          {t('workshop.blueprint.delete.confirm', { name: blueprint.name })}
        </div>
        <div className="ws-actions">
          <button className="ws-btn ws-btn-danger" onClick={handleDelete}>
            {t('common.delete')}
          </button>
          <button className="ws-btn ws-btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
