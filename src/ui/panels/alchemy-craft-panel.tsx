/**
 * Alchemy crafting panel — full-screen overlay shown when entering the Alchemy Lab.
 * Left: inventory items (draggable). Right: ingredient slots + output + craft controls.
 * Visible ingredient slots scale with the assigned alchemist's alchemy level.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { ITEM_DATABASE, type ItemID } from '@/game/data/items';
import { ALCHEMY_CONFIG } from '@/game/data/facility-definitions';
import { matchRecipe } from '@/game/data/alchemy-recipes';
import { calcAcLevel } from '@/game/systems/alchemy-production-system';
import { GameIcon } from '@/ui/components/game-icon';
import type { GuildFacility } from '@/game/state/game-state';

interface AlchemyCraftPanelProps {
  facility: GuildFacility;
  onClose: () => void;
}

const RARITY_BORDER: Record<string, string> = {
  COMMON: '#444', UNCOMMON: '#2ecc71', RARE: '#3498db', EPIC: '#9b59b6', LEGENDARY: '#f39c12',
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
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={(e) => e.stopPropagation()}>

        {/* ── Left: Inventory ── */}
        <div style={{ minWidth: 270 }}>
          <div style={S.sectionTitle}>{t('alchemy.inventoryTitle')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 50px)', gap: 4 }}>
            {inventoryItems.map((id) => {
              const def = ITEM_DATABASE[id];
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => setDragging(id)}
                  onDragEnd={() => setDragging(null)}
                  title={`${def.name} ×${Math.floor(items[id] ?? 0)}`}
                  style={{
                    ...S.itemCell,
                    border: `1px solid ${RARITY_BORDER[def.rarity] ?? '#444'}`,
                    opacity: dragging === id ? 0.45 : 1,
                  }}
                >
                  <GameIcon category="item" id={id} size={30} fallbackText={def.name.slice(0, 3)} />
                  <span style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>×{Math.floor(items[id] ?? 0)}</span>
                </div>
              );
            })}
          </div>
          {inventoryItems.length === 0 && (
            <div style={{ color: '#555', fontSize: 12, marginTop: 8 }}>{t('alchemy.inventoryEmpty')}</div>
          )}
        </div>

        {/* ── Divider ── */}
        <div style={{ width: 1, background: 'rgba(160,100,255,0.18)', alignSelf: 'stretch' }} />

        {/* ── Right: Alchemy ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minWidth: 320 }}>
          <div style={S.sectionTitle}>{t('alchemy.title')}</div>

          {/* Ingredient slots → output */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ color: '#666', fontSize: 11, textAlign: 'center', marginBottom: 8 }}>{t('alchemy.ingredients')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 60px)', gap: 8 }}>
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
                      style={{
                        ...S.slot,
                        opacity: visible ? 1 : 0.2,
                        background: slotItem ? 'rgba(160,100,255,0.15)' : 'rgba(255,255,255,0.04)',
                        border: slotItem
                          ? '1.5px solid rgba(200,150,255,0.8)'
                          : visible
                          ? '1.5px dashed rgba(160,100,255,0.5)'
                          : '1px dashed rgba(80,80,80,0.35)',
                        cursor: slotItem ? 'pointer' : 'default',
                      }}
                    >
                      {slotItem ? (
                        <GameIcon category="item" id={slotItem} size={34}
                          fallbackText={ITEM_DATABASE[slotItem].name.slice(0, 3)} />
                      ) : visible ? (
                        <span style={{ color: '#444', fontSize: 11 }}>{t('alchemy.dragHere')}</span>
                      ) : (
                        <span style={{ color: '#333', fontSize: 10 }}>Lv.{i + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <span style={{ color: '#a78bfa', fontSize: 28, fontWeight: 'bold', lineHeight: 1 }}>→</span>

            <div>
              <div style={{ color: '#666', fontSize: 11, textAlign: 'center', marginBottom: 8 }}>{t('alchemy.output')}</div>
              <div style={{
                ...S.slot,
                width: 68, height: 68,
                background: recipe ? 'rgba(100,200,80,0.12)' : 'rgba(255,255,255,0.03)',
                border: recipe ? '1.5px solid rgba(120,220,80,0.65)' : '1.5px dashed rgba(70,70,70,0.5)',
              }}>
                {recipe ? (
                  <GameIcon category="item" id={recipe.output.itemId} size={40}
                    fallbackText={ITEM_DATABASE[recipe.output.itemId].name.slice(0, 3)} />
                ) : (
                  <span style={{ color: '#333', fontSize: 24 }}>?</span>
                )}
              </div>
            </div>
          </div>

          {/* Recipe hint */}
          {recipe && (
            <div style={{ color: '#666', fontSize: 11, textAlign: 'center' }}>
              {Object.entries(recipe.ingredients)
                .map(([id, cnt]) => `${cnt}× ${ITEM_DATABASE[id as ItemID].name}`)
                .join(' + ')}
              {' → '}{recipe.output.quantity}× {ITEM_DATABASE[recipe.output.itemId].name}
            </div>
          )}
          {!recipe && blockedRecipe && (
            <div style={{ color: '#f87171', fontSize: 11, textAlign: 'center' }}>
              {t('alchemy.levelTooLow', { level: blockedRecipe.requiredAlchemyLevel })}
            </div>
          )}

          {/* Quantity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#888', fontSize: 12 }}>{t('alchemy.quantity')}</span>
            <input
              type="number" min={1} value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={S.qtyInput}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleCraft}
              disabled={!canCraft}
              style={{
                ...S.btn,
                background: canCraft ? 'rgba(100,200,80,0.22)' : 'rgba(50,70,50,0.3)',
                border: `1px solid ${canCraft ? 'rgba(120,220,80,0.7)' : 'rgba(50,70,50,0.4)'}`,
                color: canCraft ? '#86efac' : '#3a5a3a',
                cursor: canCraft ? 'pointer' : 'not-allowed',
              }}
            >
              {t('alchemy.craft')}
            </button>
            <button onClick={onClose} style={{ ...S.btn, background: 'rgba(200,60,60,0.15)', border: '1px solid rgba(200,60,60,0.5)', color: '#f87171', cursor: 'pointer' }}>
              {t('alchemy.cancel')}
            </button>
          </div>

          <div style={{ color: '#444', fontSize: 10 }}>
            {t('alchemy.levelSlots', { level: slotLevel, visible: visibleSlots })}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200,
  } as React.CSSProperties,

  panel: {
    background: 'rgba(10,6,20,0.97)',
    border: '1px solid rgba(140,80,220,0.4)',
    borderRadius: 12,
    padding: '22px 26px',
    display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center',
    // Scaled up 30%; caps divided by zoom so the rendered panel fits the viewport
    // (incl. mobile landscape — vw/vh are multiplied by zoom).
    zoom: 1.3,
    maxWidth: 'calc(92vw / 1.3)', maxHeight: 'calc(88vh / 1.3)', overflowY: 'auto',
  } as React.CSSProperties,

  sectionTitle: {
    color: '#60a5fa', fontSize: 13, fontWeight: 600,
    marginBottom: 12, textAlign: 'center',
  } as React.CSSProperties,

  itemCell: {
    width: 50, height: 50, borderRadius: 6,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    cursor: 'grab', userSelect: 'none',
    background: 'rgba(255,255,255,0.05)',
  } as React.CSSProperties,

  slot: {
    width: 60, height: 60, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as React.CSSProperties,

  qtyInput: {
    width: 64,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(140,80,220,0.4)',
    borderRadius: 4, color: '#e0d0ff',
    fontSize: 13, padding: '4px 8px',
    outline: 'none', textAlign: 'center',
  } as React.CSSProperties,

  btn: {
    padding: '8px 22px', borderRadius: 6,
    fontSize: 13, fontWeight: 600,
  } as React.CSSProperties,
};
