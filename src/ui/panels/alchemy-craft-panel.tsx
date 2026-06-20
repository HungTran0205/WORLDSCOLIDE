/**
 * Alchemy crafting panel — content only.
 * Left: inventory items (draggable). Right: ingredient slots + output + craft controls.
 * Visible ingredient slots scale with the assigned alchemist's alchemy level.
 *
 * Shell (chrome, header, close button, open/close animation, SFX) is owned by
 * PanelFrame. This file contains only content-specific JSX.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { ITEM_DATABASE, type ItemID } from '@/game/data/items';
import { ALCHEMY_CONFIG } from '@/game/data/facility-definitions';
import { matchRecipe } from '@/game/data/alchemy-recipes';
import { calcAcLevel } from '@/game/systems/alchemy-production-system';
import { GameIcon } from '@/ui/components/game-icon';
import { PanelFrame } from '@/ui/components/panel-frame';
import type { GuildFacility } from '@/game/state/game-state';
import '@/ui/styles/alchemy-craft-panel.css';

interface AlchemyCraftPanelProps {
  facility: GuildFacility;
  onClose: () => void;
}

/**
 * Rarity border color map — uses token refs from the tier/status ramp so
 * no hardcoded hex values remain in logic code. Visually equivalent to the
 * original hex values: COMMON≈iron, UNCOMMON≈status-ok, RARE≈status-info,
 * EPIC≈rank-officer lavender, LEGENDARY≈bronze-light amber.
 */
const RARITY_BORDER: Record<string, string> = {
  COMMON:    'var(--bp-iron)',
  UNCOMMON:  'var(--bp-status-ok)',
  RARE:      'var(--bp-status-info)',
  EPIC:      'var(--ink-rank-officer)',
  LEGENDARY: 'var(--bp-bronze-light)',
};

export function AlchemyCraftPanel({ facility, onClose }: AlchemyCraftPanelProps) {
  const { t } = useTranslation();
  const items = useGameStore((s) => s.inventory.items);
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const removeItem = useGameStore((s) => s.removeItem);
  const addAlchemyCraftJob = useGameStore((s) => s.addAlchemyCraftJob);

  const allMembers = founder ? [founder, ...roster] : roster;
  const assigned = allMembers.filter((m) => facility.assignedMemberIds.includes(m.id));

  // Highest alchemy SKILL level among assigned members — gates which recipes match.
  const maxAcLevel = assigned.reduce((max, m) =>
    Math.max(max, calcAcLevel(m.craftSkills?.alchemy?.xpAccumulated ?? 0)), 0);
  // Visible ingredient slots = the LAB level (what the player upgrades): Lv1→1 … Lv3→3.
  // A very skilled alchemist (AC ≥ 4) can unlock the 4th slot beyond the lab cap.
  const slotLevel = Math.max(facility.level, maxAcLevel);
  const visibleSlots = Math.min(4, slotLevel);

  const [slots, setSlots] = useState<(ItemID | null)[]>([null, null, null, null]);
  const [qty, setQty] = useState(1);
  const [dragging, setDragging] = useState<ItemID | null>(null);

  const recipe = useMemo(
    () => matchRecipe(slots.slice(0, visibleSlots), slotLevel),
    [slots, visibleSlots, slotLevel],
  );

  // A recipe whose ingredients match but level is too low — for "level too low" hint.
  const blockedRecipe = useMemo(() => {
    if (recipe) return null;
    return matchRecipe(slots.slice(0, visibleSlots), 99);
  }, [recipe, slots, visibleSlots]);

  const canCraft = !!recipe && Object.entries(recipe.ingredients).every(
    ([id, cnt]) => (items[id as ItemID] ?? 0) >= (cnt as number) * qty,
  );

  function dropToSlot(i: number) {
    if (!dragging) return;
    const next = [...slots];
    next[i] = dragging;
    setSlots(next);
    setDragging(null);
  }

  function clearSlot(i: number) {
    const next = [...slots];
    next[i] = null;
    setSlots(next);
  }

  function handleCraft() {
    if (!canCraft || !recipe) return;

    // Compute craft time: faster with more batches/day from best assigned alchemist
    const batchesPerDay = assigned.length > 0
      ? ALCHEMY_CONFIG.batchesPerDay(
          Math.max(...assigned.map((m) => m.stats.INT)),
          Math.max(...assigned.map((m) => m.stats.DEX)),
          facility.level,
        )
      : 1;
    const secondsPerUnit = Math.max(15, Math.round(120 / batchesPerDay));
    const totalSeconds = qty * secondsPerUnit;

    // Consume ingredients immediately
    for (const [id, cnt] of Object.entries(recipe.ingredients)) {
      removeItem(id as ItemID, (cnt as number) * qty);
    }

    // Enqueue timed craft job
    addAlchemyCraftJob(facility.id, {
      id: `craft-${Date.now()}`,
      recipeId: recipe.id,
      outputItemId: recipe.output.itemId,
      outputQuantity: recipe.output.quantity * qty,
      remainingSeconds: totalSeconds,
      totalSeconds,
    });

    // Clear ingredient slots after queuing
    setSlots([null, null, null, null]);
    setQty(1);
  }

  const inventoryItems = (Object.keys(items) as ItemID[]).filter((id) => (items[id] ?? 0) > 0);

  return (
    <div className="ac-positioner">
      <PanelFrame title={t('alchemy.title')} onClose={onClose} variant="panel" size="lg">
        <div className="ac-layout">

          {/* ── Left: Inventory ── */}
          <div className="ac-inventory-col">
            <div className="ac-section-title">{t('alchemy.inventoryTitle')}</div>
            <div className="ac-inv-grid">
              {inventoryItems.map((id) => {
                const def = ITEM_DATABASE[id];
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={() => setDragging(id)}
                    onDragEnd={() => setDragging(null)}
                    title={`${def.name} ×${Math.floor(items[id] ?? 0)}`}
                    className="ac-item-cell"
                    style={{
                      border: `1px solid ${RARITY_BORDER[def.rarity] ?? RARITY_BORDER.COMMON}`,
                      opacity: dragging === id ? 0.45 : 1,
                    }}
                  >
                    <GameIcon category="item" id={id} size={30} fallbackText={def.name.slice(0, 3)} />
                    <span className="ac-item-qty">×{Math.floor(items[id] ?? 0)}</span>
                  </div>
                );
              })}
            </div>
            {inventoryItems.length === 0 && (
              <div className="ac-empty">{t('alchemy.inventoryEmpty')}</div>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="ac-divider" />

          {/* ── Right: Alchemy ── */}
          <div className="ac-craft-col">
            <div className="ac-section-title">{t('alchemy.title')}</div>

            {/* Ingredient slots → output */}
            <div className="ac-combine-row">
              <div>
                <div className="ac-slot-label">{t('alchemy.ingredients')}</div>
                <div className="ac-slots-grid">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const visible = i < visibleSlots;
                    const slotItem = slots[i];
                    return (
                      <div
                        key={i}
                        onDragOver={(e) => { if (visible) e.preventDefault(); }}
                        onDrop={() => visible && dropToSlot(i)}
                        onClick={() => slotItem && clearSlot(i)}
                        title={
                          slotItem ? t('alchemy.removeHint', { name: ITEM_DATABASE[slotItem].name })
                            : visible ? t('alchemy.dropHint')
                            : t('alchemy.lockedHint', { level: i + 1 })
                        }
                        className="ac-slot"
                        style={{
                          opacity: visible ? 1 : 0.2,
                          background: slotItem ? 'rgba(160,100,255,0.15)' : 'rgba(255,255,255,0.04)',
                          border: slotItem
                            ? `1.5px solid ${RARITY_BORDER.EPIC}`
                            : visible
                            ? `1.5px dashed ${RARITY_BORDER.RARE}`
                            : `1px dashed ${RARITY_BORDER.COMMON}`,
                          cursor: slotItem ? 'pointer' : 'default',
                        }}
                      >
                        {slotItem ? (
                          <GameIcon category="item" id={slotItem} size={34}
                            fallbackText={ITEM_DATABASE[slotItem].name.slice(0, 3)} />
                        ) : visible ? (
                          <span className="ac-slot-hint">{t('alchemy.dragHere')}</span>
                        ) : (
                          <span className="ac-slot-locked">Lv.{i + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <span className="ac-arrow">→</span>

              <div>
                <div className="ac-slot-label">{t('alchemy.output')}</div>
                <div
                  className="ac-slot ac-output-slot"
                  style={{
                    background: recipe ? 'rgba(100,200,80,0.12)' : 'rgba(255,255,255,0.03)',
                    border: recipe
                      ? `1.5px solid ${RARITY_BORDER.UNCOMMON}`
                      : `1.5px dashed ${RARITY_BORDER.COMMON}`,
                  }}
                >
                  {recipe ? (
                    <GameIcon category="item" id={recipe.output.itemId} size={40}
                      fallbackText={ITEM_DATABASE[recipe.output.itemId].name.slice(0, 3)} />
                  ) : (
                    <span className="ac-output-unknown">?</span>
                  )}
                </div>
              </div>
            </div>

            {/* Recipe hint */}
            {recipe && (
              <div className="ac-recipe-hint">
                {Object.entries(recipe.ingredients)
                  .map(([id, cnt]) => `${cnt}× ${ITEM_DATABASE[id as ItemID].name}`)
                  .join(' + ')}
                {' → '}{recipe.output.quantity}× {ITEM_DATABASE[recipe.output.itemId].name}
              </div>
            )}
            {!recipe && blockedRecipe && (
              <div className="ac-recipe-blocked">
                {t('alchemy.levelTooLow', { level: blockedRecipe.requiredAlchemyLevel })}
              </div>
            )}

            {/* Quantity */}
            <div className="ac-qty-row">
              <span className="ac-qty-label">{t('alchemy.quantity')}</span>
              <input
                type="number" min={1} value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="ac-qty-input"
              />
            </div>

            {/* Buttons */}
            <div className="ac-actions">
              <button
                onClick={handleCraft}
                disabled={!canCraft}
                className={`ac-btn ac-btn-craft${canCraft ? ' is-active' : ''}`}
              >
                {t('alchemy.craft')}
              </button>
              <button onClick={onClose} className="ac-btn ac-btn-cancel">
                {t('alchemy.cancel')}
              </button>
            </div>

            <div className="ac-level-note">
              {t('alchemy.levelSlots', { level: slotLevel, visible: visibleSlots })}
            </div>
          </div>

        </div>
      </PanelFrame>
    </div>
  );
}
