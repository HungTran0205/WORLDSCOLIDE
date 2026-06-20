import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { DEFAULT_MEDICINE_SLOTS } from '@/game/state/guild-slice';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';
import { getEquipmentTemplate } from '@/game/data/equipment-templates';
import type { EquipmentSlot } from '@/game/data/equipment-templates';
import { ITEM_DATABASE } from '@/game/data/items';
import type { ItemID } from '@/game/data/items';
import type { MedicineCondition } from '@/game/state/game-state';
import { itemName, equipmentName } from '@/i18n/content-wrappers';
import { GameIcon } from './game-icon';
import { PanelFrame } from './panel-frame';
import '@/ui/styles/equip-mode.css';

// Condition keys mapped to i18n keys — values resolved at render time via t()
const COND_I18N_KEYS: Record<MedicineCondition, string> = {
  start: 'equipMode.condStart',
  '80': 'equipMode.cond80',
  '50': 'equipMode.cond50',
  '30': 'equipMode.cond30',
  never: 'equipMode.condNever',
};
const COND_OPTIONS = Object.keys(COND_I18N_KEYS) as MedicineCondition[];
const GEAR_SLOTS = ['weapon', 'armor'] as const;

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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useTranslation();
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

  function dropOnGearSlot(_slot: EquipmentSlot) {
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
    <div className="em-positioner">
      <PanelFrame title={member.name} onClose={onClose} variant="side" size="lg">
        {/* ── Meta row: avatar + grade badge + Done button ── */}
        <div className="em-meta">
          <div className="em-meta-avatar ink-pixelated">
            {!avatarFailed && avatarUrl
              ? <img src={avatarUrl} alt={member.name} onError={() => setAvatarFailed(true)} />
              : <span className="em-meta-avatar-fallback">{member.name.slice(0, 2)}</span>
            }
          </div>
          <div className="em-meta-info">
            <div className="em-meta-grade">Grade {member.grade}{member.isMercenary ? ' · MERC' : ''}</div>
          </div>
          <button className="em-done-btn" onClick={onClose} type="button">{t('equipMode.done')}</button>
        </div>

        {/* ── Body: split ── */}
        <div className="equip-split">
          {/* Left — slots */}
          <div className="equip-left">
            <div className="equip-section-title">{t('equipMode.equipment')}</div>
          <div className="equip-gear-grid">
            {GEAR_SLOTS.map(slot => {
              const equipped = member.equipment?.[slot] ?? null;
              const tpl = equipped ? getEquipmentTemplate(equipped.templateId) : null;
              return (
                <div
                  key={slot}
                  className={`equip-slot-box${equipped ? ' filled' : ''}${dropOver === slot ? ' drop-target' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDropOver(slot); }}
                  onDragLeave={() => setDropOver(null)}
                  onDrop={() => dropOnGearSlot(slot)}
                  onClick={() => equipped ? unequipGear(memberId, slot) : dropOnGearSlot(slot)}
                >
                  <span className="equip-slot-label">{slot}</span>
                  {tpl ? (
                    <>
                      <GameIcon category="item" id={equipped!.templateId} size={32} fallbackText={tpl.name.slice(0, 2)} />
                      <span className="equip-slot-item-name">{equipmentName(equipped!.templateId)}</span>
                      <span className="equip-slot-stat">
                        {tpl.damage ? `⚔${tpl.damage}` : ''}{tpl.defense ? ` 🛡${tpl.defense}` : ''}{tpl.hp ? ` ❤+${tpl.hp}` : ''}
                      </span>
                    </>
                  ) : (
                    <span className="equip-slot-empty">{t('equipMode.dropHere')}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="equip-section-title" style={{ marginTop: 8 }}>{t('equipMode.medicine')}</div>
          {([0, 1] as const).map(idx => {
            const ms = medSlots[idx];
            const hasMedItem = !!ms.itemId;
            return (
              <div
                key={idx}
                className={`med-slot-box${hasMedItem ? ' filled' : ''}${dropOver === `med${idx}` ? ' drop-target' : ''}`}
                onDragOver={e => { e.preventDefault(); setDropOver(`med${idx}`); }}
                onDragLeave={() => setDropOver(null)}
                onDrop={() => dropOnMedSlot(idx)}
              >
                <span className="med-slot-num">{idx + 1}</span>
                {hasMedItem
                  ? <>
                      <GameIcon category="item" id={ms.itemId as ItemID} size={24} fallbackText={(ms.itemId as string).slice(0, 2)} />
                      <span className="med-slot-name">{itemName(ms.itemId as ItemID)}</span>
                    </>
                  : <span className="med-slot-empty" onClick={() => dropOnMedSlot(idx)}>{t('equipMode.dropConsumable')}</span>
                }
                {hasMedItem && (
                  <button className="med-slot-clear" onClick={() => clearMedicineSlot(memberId, idx)} title={t('equipMode.clearSlotAria')}>✕</button>
                )}
                <select
                  className="med-condition-select"
                  value={ms.condition}
                  onChange={e => setMedicineSlot(memberId, idx, { ...ms, condition: e.target.value as MedicineCondition })}
                >
                  {COND_OPTIONS.map((v) => <option key={v} value={v}>{t(COND_I18N_KEYS[v])}</option>)}
                </select>
              </div>
            );
          })}
        </div>

        {/* Right — inventory */}
        <div className="equip-right">
          {equipInv.length > 0 && (
            <>
              <div className="equip-section-title">{t('equipMode.equipmentInStash')}</div>
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
                      <GameIcon category="item" id={item.templateId} size={24} fallbackText={tpl.name.slice(0, 2)} />
                      <span className="equip-inv-item-name">{equipmentName(item.templateId)}</span>
                      <span>{tpl.damage ? `⚔${tpl.damage}` : ''}{tpl.defense ? ` 🛡${tpl.defense}` : ''}{tpl.hp ? ` ❤+${tpl.hp}` : ''}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {consumables.length > 0 && (
            <>
              <div className="equip-section-title">{t('equipMode.consumables')}</div>
              <div className="equip-inv-grid">
                {consumables.map(id => {
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
                      <GameIcon category="item" id={id} size={24} fallbackText={id.slice(0, 2)} />
                      <span className="equip-inv-item-name">{itemName(id)}</span>
                      <span>×{Math.floor(items[id] ?? 0)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {equipInv.length === 0 && consumables.length === 0 && (
            <p className="equip-empty-hint">{t('equipMode.noStash')}</p>
          )}
        </div>
      </div>
      </PanelFrame>
    </div>
  );
}
