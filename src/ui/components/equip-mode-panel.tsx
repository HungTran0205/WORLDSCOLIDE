import { useState } from 'react';
import { useGameStore } from '@/game/state/store';
import { DEFAULT_MEDICINE_SLOTS } from '@/game/state/guild-slice';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';
import { getEquipmentTemplate } from '@/game/data/equipment-templates';
import type { EquipmentSlot } from '@/game/data/equipment-templates';
import { ITEM_DATABASE } from '@/game/data/items';
import type { ItemID } from '@/game/data/items';
import type { MedicineCondition } from '@/game/state/game-state';
import '@/ui/styles/equip-mode.css';

const COND_LABELS: Record<MedicineCondition, string> = {
  start: 'Combat Start', '80': 'Below 80%', '50': 'Below 50%', '30': 'Below 30%', never: 'Never',
};
const COND_OPTIONS = Object.entries(COND_LABELS) as [MedicineCondition, string][];
const GEAR_SLOTS = ['weapon', 'armor', 'headgear'] as const;

interface EquipModePanelProps {
  memberId: string;
  onClose: () => void;
}

export function EquipModePanel({ memberId, onClose }: EquipModePanelProps) {
  const founder   = useGameStore(s => s.founder);
  const roster    = useGameStore(s => s.roster);
  const equipInv  = useGameStore(s => s.inventory.equipmentInventory ?? []);
  const items     = useGameStore(s => s.inventory.items);
  const equipGear     = useGameStore(s => s.equipGear);
  const unequipGear   = useGameStore(s => s.unequipGear);
  const setMedicineSlot   = useGameStore(s => s.setMedicineSlot);
  const clearMedicineSlot = useGameStore(s => s.clearMedicineSlot);

  const member = (founder?.id === memberId ? founder : roster.find(m => m.id === memberId)) ?? null;
  if (!member) return null;

  const medSlots = member.medicineSlots ?? DEFAULT_MEDICINE_SLOTS;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [dragging, setDragging]   = useState<{ id: string; kind: 'eq' | 'con' } | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selected, setSelected]   = useState<{ id: string; kind: 'eq' | 'con' } | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [dropOver, setDropOver]   = useState<string | null>(null);

  const avatarUrl = member.archetype && member.gender
    ? `${getSpritePath(member.civilization, member.archetype, member.gender)}/animations/avatar/frame_000.png`
    : '';
  const [avatarFailed, setAvatarFailed] = useState(false);  // eslint-disable-line react-hooks/rules-of-hooks

  const consumables = (Object.keys(items) as ItemID[])
    .filter(id => (items[id] ?? 0) > 0 && ITEM_DATABASE[id]?.type === 'CONSUMABLE');

  function dropOnGearSlot(slot: EquipmentSlot) {
    const src = dragging ?? selected;
    if (src?.kind === 'eq') equipGear(memberId, src.id);
    setDragging(null); setSelected(null); setDropOver(null);
  }

  function dropOnMedSlot(idx: 0 | 1) {
    const src = dragging ?? selected;
    if (src?.kind === 'con') {
      setMedicineSlot(memberId, idx, { itemId: src.id, condition: medSlots[idx].condition });
    }
    setDragging(null); setSelected(null); setDropOver(null);
  }

  function handleItemClick(id: string, kind: 'eq' | 'con') {
    setSelected(prev => (prev?.id === id ? null : { id, kind }));
  }

  return (
    <div className="ink-panel equip-panel ink-enter">
      {/* ── Header ── */}
      <div className="equip-header">
        <div className="equip-header-avatar ink-pixelated">
          {!avatarFailed && avatarUrl
            ? <img src={avatarUrl} alt={member.name} onError={() => setAvatarFailed(true)} />
            : <span style={{ fontFamily: 'var(--ink-font-title)', color: 'var(--ink-gold-dim)' }}>{member.name.slice(0, 2)}</span>
          }
        </div>
        <div>
          <div className="equip-header-name">{member.name}</div>
          <div className="equip-header-sub">{member.rank} · Lv.{member.level}</div>
        </div>
        <button className="char-btn" onClick={onClose} type="button" style={{ marginLeft: 'auto' }}>Done</button>
      </div>

      {/* ── Body: split ── */}
      <div className="equip-split">
        {/* Left — slots */}
        <div className="equip-left">
          <div className="equip-section-title">Equipment</div>
          <div className="equip-gear-grid">
            {GEAR_SLOTS.map(slot => {
              const equipped = member.equipment?.[slot] ?? null;
              const tpl = equipped ? getEquipmentTemplate(equipped.templateId) : null;
              const isHg = slot === 'headgear';
              return (
                <div
                  key={slot}
                  className={`equip-slot-box${equipped ? ' filled' : ''}${dropOver === slot ? ' drop-target' : ''}${isHg ? ' headgear-full' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDropOver(slot); }}
                  onDragLeave={() => setDropOver(null)}
                  onDrop={() => dropOnGearSlot(slot)}
                  onClick={() => equipped ? unequipGear(memberId, slot) : dropOnGearSlot(slot)}
                >
                  <span className="equip-slot-label">{slot}</span>
                  {tpl ? (
                    <>
                      <span className="equip-slot-item-name">{tpl.name}</span>
                      <span className="equip-slot-stat">
                        {tpl.damage ? `⚔${tpl.damage}` : ''}{tpl.defense ? ` 🛡${tpl.defense}` : ''}{tpl.hp ? ` ❤+${tpl.hp}` : ''}
                      </span>
                    </>
                  ) : (
                    <span className="equip-slot-empty">Drop here</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="equip-section-title" style={{ marginTop: 8 }}>Medicine</div>
          {([0, 1] as const).map(idx => {
            const ms = medSlots[idx];
            const itemName = ms.itemId ? (ITEM_DATABASE[ms.itemId as ItemID]?.name ?? ms.itemId) : null;
            return (
              <div
                key={idx}
                className={`med-slot-box${ms.itemId ? ' filled' : ''}${dropOver === `med${idx}` ? ' drop-target' : ''}`}
                onDragOver={e => { e.preventDefault(); setDropOver(`med${idx}`); }}
                onDragLeave={() => setDropOver(null)}
                onDrop={() => dropOnMedSlot(idx)}
              >
                <span className="med-slot-num">{idx + 1}</span>
                {itemName
                  ? <span className="med-slot-name">{itemName}</span>
                  : <span className="med-slot-empty" onClick={() => dropOnMedSlot(idx)}>Drop consumable</span>
                }
                {itemName && (
                  <button className="med-slot-clear" onClick={() => clearMedicineSlot(memberId, idx)} title="Clear slot">✕</button>
                )}
                <select
                  className="med-condition-select"
                  value={ms.condition}
                  onChange={e => setMedicineSlot(memberId, idx, { ...ms, condition: e.target.value as MedicineCondition })}
                >
                  {COND_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            );
          })}
        </div>

        {/* Right — inventory */}
        <div className="equip-right">
          {equipInv.length > 0 && (
            <>
              <div className="equip-section-title">Equipment in Stash</div>
              <div className="equip-inv-grid">
                {equipInv.map(item => {
                  const tpl = getEquipmentTemplate(item.templateId);
                  const isDragging = dragging?.id === item.id;
                  const isSel = selected?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`equip-inv-item${isDragging ? ' dragging' : ''}${isSel ? ' selected' : ''}`}
                      draggable
                      onDragStart={() => setDragging({ id: item.id, kind: 'eq' })}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => handleItemClick(item.id, 'eq')}
                    >
                      <span className="equip-inv-item-name">{tpl.name}</span>
                      <span>{tpl.damage ? `⚔${tpl.damage}` : ''}{tpl.defense ? ` 🛡${tpl.defense}` : ''}{tpl.hp ? ` ❤+${tpl.hp}` : ''}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {consumables.length > 0 && (
            <>
              <div className="equip-section-title">Consumables</div>
              <div className="equip-inv-grid">
                {consumables.map(id => {
                  const def = ITEM_DATABASE[id];
                  const isDragging = dragging?.id === id;
                  const isSel = selected?.id === id;
                  return (
                    <div
                      key={id}
                      className={`equip-inv-item${isDragging ? ' dragging' : ''}${isSel ? ' selected' : ''}`}
                      draggable
                      onDragStart={() => setDragging({ id, kind: 'con' })}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => handleItemClick(id, 'con')}
                    >
                      <span className="equip-inv-item-name">{def.name}</span>
                      <span>×{Math.floor(items[id] ?? 0)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {equipInv.length === 0 && consumables.length === 0 && (
            <p className="equip-empty-hint">No equipment in stash.</p>
          )}
        </div>
      </div>
    </div>
  );
}
