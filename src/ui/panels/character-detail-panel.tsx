import { useState } from 'react';
import type { Member, SyringeLoadout } from '@/game/state/game-state';
import type { StatKey } from '@/game/state/game-state';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { expToNextLevel } from '@/game/systems/leveling-system';
import { calcMaxHp } from '@/game/systems/combat-formulas';
import { getEquipmentTemplate } from '@/game/data/equipment-templates';
import type { EquipmentSlot } from '@/game/data/equipment-templates';
import type { EquipmentItem } from '@/game/state/game-state';
import { StatsTab } from '@/ui/components/character-tabs/stats-tab';
import { DEFAULT_MEDICINE_SLOTS } from '@/game/state/guild-slice';
import { ITEM_DATABASE } from '@/game/data/items';
import type { ItemID } from '@/game/data/items';
import '@/ui/styles/character-detail.css';

type TabKey = 'stats' | 'equipment' | 'skills' | 'bio';
const THRESHOLD_OPTIONS = [0.20, 0.30, 0.40, 0.50] as const;

export interface CharacterDetailPanelProps {
  member: Member;
  onAllocateStat: (stat: StatKey, amount?: number) => void;
  onToggleAutoCast: () => void;
  onInviteMercenary?: () => void;
  inviteCost?: number;
  canAffordInvite?: boolean;
  onPromote?: () => void;
  canAffordPromote?: boolean;
  onClose: () => void;
  syringeCount?: number;
  onSetSyringeLoadout?: (loadout: SyringeLoadout | null) => void;
  equipmentInventory?: EquipmentItem[];
  onEquipGear?: (id: string) => void;
  onUnequipGear?: (slot: EquipmentSlot) => void;
  onOpenEquipMode?: () => void; // wired in phase 04
}

export function CharacterDetailPanel({
  member, onAllocateStat, onToggleAutoCast,
  onInviteMercenary, inviteCost, canAffordInvite,
  onPromote, canAffordPromote, onClose,
  syringeCount = 0, onSetSyringeLoadout,
  onUnequipGear, onOpenEquipMode,
}: CharacterDetailPanelProps) {
  const [tab, setTab] = useState<TabKey>('stats');
  const [imgFailed, setImgFailed] = useState(false);

  const expNeeded = expToNextLevel(member.level);
  const expPct    = Math.min(100, Math.floor((member.exp / expNeeded) * 100));
  const maxHp     = calcMaxHp(member.stats.END, member.level);
  const isMerc    = member.rank === 'MERCENARY';
  const civConfig = CIV_CONFIG[member.civilization as Civilization];

  const avatarUrl = member.archetype && member.gender
    ? `${getSpritePath(member.civilization, member.archetype, member.gender)}/animations/avatar/frame_000.png`
    : '';

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'stats',     label: 'Stats' },
    { key: 'equipment', label: 'Equipment' },
    { key: 'skills',    label: 'Skills' },
    { key: 'bio',       label: 'Bio' },
  ];

  return (
    <div className="char-detail">
      {/* ── Header ── */}
      <div className="char-detail-header">
        <div className="char-portrait-frame ink-pixelated">
          {!imgFailed && avatarUrl
            ? <img src={avatarUrl} alt={member.name} onError={() => setImgFailed(true)} />
            : <div className="char-portrait-initials">{(member.name || '??').slice(0, 2).toUpperCase()}</div>
          }
        </div>
        <div className="char-identity">
          <div className="char-name">{member.name || '???'}</div>
          <div className="char-sub">{member.rank} · Lv.{member.level} · {civConfig?.displayName ?? member.civilization}</div>
          <div className="char-bar-row">
            <div>
              <div className="char-bar-label"><span>HP</span><span>{maxHp}</span></div>
              <div className="ink-bar-track"><div className="ink-bar-fill ink-bar-hp" style={{ width: '100%' }} /></div>
            </div>
            <div>
              <div className="char-bar-label"><span>EXP</span><span>{expPct}%</span></div>
              <div className="ink-bar-track"><div className="ink-bar-fill ink-bar-exp" style={{ width: `${expPct}%` }} /></div>
            </div>
          </div>
        </div>
        <button className="char-btn" onClick={onClose} type="button">← Back</button>
      </div>

      {/* ── Tab Bar ── */}
      <div className="ink-tab-bar" style={{ padding: '0 16px' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`ink-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => t.key === 'equipment' && onOpenEquipMode ? onOpenEquipMode() : setTab(t.key)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="char-tabs-body">

        {tab === 'stats' && (
          <StatsTab member={member} isMerc={isMerc} onAllocateStat={onAllocateStat} onPromote={onPromote} canAffordPromote={canAffordPromote} />
        )}

        {tab === 'equipment' && (
          <>
            <p className="char-section-title">Gear</p>
            {(['weapon', 'armor', 'headgear'] as const).map(slot => {
              const equipped = member.equipment?.[slot] ?? null;
              const tpl = equipped ? getEquipmentTemplate(equipped.templateId) : null;
              return (
                <div key={slot} className="equip-slot-row">
                  <span className="equip-slot-label">{slot}</span>
                  {tpl ? (
                    <>
                      <span className="equip-slot-name">{tpl.name}</span>
                      <span className="equip-stat-hint">
                        {tpl.damage ? `⚔${tpl.damage}` : ''}{tpl.defense ? ` 🛡${tpl.defense}` : ''}{tpl.hp ? ` ❤+${tpl.hp}` : ''}
                      </span>
                      {onUnequipGear && (
                        <button className="char-btn" style={{ fontSize: '0.6rem', padding: '2px 8px' }} onClick={() => onUnequipGear(slot)}>Remove</button>
                      )}
                    </>
                  ) : (
                    <span className="equip-slot-empty">—</span>
                  )}
                </div>
              );
            })}
            {(member.medicineSlots ?? DEFAULT_MEDICINE_SLOTS).map((ms, idx) => {
              const itemName = ms.itemId ? (ITEM_DATABASE[ms.itemId as ItemID]?.name ?? ms.itemId) : null;
              return (
                <div key={idx} className="med-slot-row">
                  <span className="equip-slot-label">Med {idx + 1}</span>
                  {itemName
                    ? <span className="equip-slot-name">{itemName} <span style={{ color: 'var(--ink-text-muted)', fontSize: '0.65rem' }}>({ms.condition})</span></span>
                    : <span className="equip-slot-empty">—</span>
                  }
                </div>
              );
            })}
            <button className="char-btn primary" style={{ marginTop: 8 }} onClick={onOpenEquipMode} type="button">
              Equip
            </button>
            {/* Syringe loadout */}
            {onSetSyringeLoadout && (
              <>
                <p className="char-section-title" style={{ marginTop: 10 }}>Healing Syringe <span style={{ color: syringeCount > 0 ? 'var(--ink-status-ok)' : 'var(--ink-status-bad)' }}>×{syringeCount}</span></p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {member.syringeLoadout
                    ? <button className="char-btn" onClick={() => onSetSyringeLoadout(null)}>Unequip</button>
                    : <button className="char-btn primary" disabled={syringeCount === 0} onClick={() => onSetSyringeLoadout({ autoUseThresholdPct: 0.30 })}>Equip</button>
                  }
                  {member.syringeLoadout && THRESHOLD_OPTIONS.map(pct => (
                    <button key={pct} className={`char-btn${member.syringeLoadout?.autoUseThresholdPct === pct ? ' primary' : ''}`}
                      onClick={() => onSetSyringeLoadout({ autoUseThresholdPct: pct })}>
                      {Math.round(pct * 100)}%
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'skills' && (
          member.skill ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: 'var(--ink-text)', fontSize: '0.9rem', fontFamily: 'var(--ink-font-body)' }}>{member.skill.name}</div>
              <div className="char-sub">{member.skill.damageMultiplier}× damage · {Math.round(member.skill.cooldownMs / 1000)}s cooldown</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={member.skill.autoEnabled} onChange={onToggleAutoCast} style={{ accentColor: 'var(--ink-gold)' }} />
                <span className="ink-stat">Auto Cast</span>
              </label>
            </div>
          ) : <p className="ink-stat">Skill unlocks at Lv.5</p>
        )}

        {tab === 'bio' && (
          <>
            {civConfig && (
              <>
                <p className="char-section-title">{civConfig.passive.name}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-text-dim)', lineHeight: 1.6 }}>{civConfig.passive.description}</p>
              </>
            )}
            <p className="char-section-title" style={{ marginTop: 12 }}>Biography</p>
            <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--ink-text-muted)', lineHeight: 1.6 }}>
              This warrior's tale is yet unwritten.
            </p>
          </>
        )}
      </div>

      {/* ── Footer (invite / promote for mercenaries) ── */}
      {isMerc && onInviteMercenary && (
        <div className="char-detail-footer">
          <button className="char-btn primary" disabled={!canAffordInvite} onClick={onInviteMercenary}>
            Invite to Guild ({inviteCost}g)
          </button>
        </div>
      )}
    </div>
  );
}
