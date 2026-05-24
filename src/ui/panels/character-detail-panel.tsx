import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Member, SyringeLoadout } from '@/game/state/game-state';
import type { StatKey } from '@/game/state/game-state';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { expToNextLevel } from '@/game/systems/leveling-system';
import { calcMemberDerivedStats } from '@/game/systems/member-derived-stats';
import { getEquipmentTemplate } from '@/game/data/equipment-templates';
import type { EquipmentSlot } from '@/game/data/equipment-templates';
import type { EquipmentItem } from '@/game/state/game-state';
import type { EquipmentSlotData } from '@/game/data/workshop-types';
import { StatsTab } from '@/ui/components/character-tabs/stats-tab';
import { DEFAULT_MEDICINE_SLOTS } from '@/game/state/guild-slice';
import { ITEM_DATABASE } from '@/game/data/items';
import type { ItemID } from '@/game/data/items';
import { tContent } from '@/i18n/content-localization';
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
  /** Rename this member. Omit to disable renaming (e.g. founder / mercenaries). */
  onRename?: (name: string) => void;
}

export function CharacterDetailPanel({
  member, onAllocateStat, onToggleAutoCast,
  onInviteMercenary, inviteCost, canAffordInvite,
  onPromote, canAffordPromote, onClose,
  syringeCount = 0, onSetSyringeLoadout,
  onUnequipGear, onOpenEquipMode, onRename,
}: CharacterDetailPanelProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>('stats');
  const [imgFailed, setImgFailed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const canRename = Boolean(onRename) && !member.isFounder && member.rank !== 'MERCENARY';
  const commitRename = () => {
    const next = nameDraft.trim();
    if (next && onRename) onRename(next);
    setEditingName(false);
  };

  const expNeeded = expToNextLevel(member.level);
  const expPct    = Math.min(100, Math.floor((member.exp / expNeeded) * 100));
  const maxHp     = calcMemberDerivedStats(member).combat.maxHp;
  const isMerc    = member.rank === 'MERCENARY';
  const civConfig = CIV_CONFIG[member.civilization as Civilization];

  const avatarUrl = member.archetype && member.gender
    ? `${getSpritePath(member.civilization, member.archetype, member.gender)}/animations/avatar/frame_000.png`
    : '';

  const civName = civConfig ? tContent('civ', member.civilization, 'name', civConfig.displayName) : member.civilization;

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'stats',     label: t('characterDetail.tab.stats') },
    { key: 'equipment', label: t('characterDetail.tab.equipment') },
    { key: 'skills',    label: t('characterDetail.tab.skills') },
    { key: 'bio',       label: t('characterDetail.tab.bio') },
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
          <div className="char-name">
            {editingName ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="text"
                  value={nameDraft}
                  maxLength={24}
                  autoFocus
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    else if (e.key === 'Escape') setEditingName(false);
                  }}
                  style={{ font: 'inherit', maxWidth: '10rem', background: 'var(--ink-bg, #1a1a1a)', color: 'inherit', border: '1px solid var(--ink-gold-dim)', borderRadius: 4, padding: '2px 6px' }}
                />
                <button className="char-btn" type="button" onClick={commitRename} title={t('roster.renameSave')}>✓</button>
                <button className="char-btn" type="button" onClick={() => setEditingName(false)} title={t('roster.renameCancel')}>✕</button>
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {member.name || t('characterDetail.unknownName')}
                {canRename && (
                  <button
                    className="char-btn"
                    type="button"
                    style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                    onClick={() => { setNameDraft(member.name); setEditingName(true); }}
                    title={t('roster.rename')}
                  >✎</button>
                )}
              </span>
            )}
          </div>
          <div className="char-sub">{t('characterDetail.subline', { rank: member.rank, level: member.level, civ: civName })}</div>
          <div className="char-bar-row">
            <div>
              <div className="char-bar-label"><span>{t('characterDetail.barHp')}</span><span>{maxHp}</span></div>
              <div className="ink-bar-track"><div className="ink-bar-fill ink-bar-hp" style={{ width: '100%' }} /></div>
            </div>
            <div>
              <div className="char-bar-label"><span>{t('characterDetail.barExp')}</span><span>{expPct}%</span></div>
              <div className="ink-bar-track"><div className="ink-bar-fill ink-bar-exp" style={{ width: `${expPct}%` }} /></div>
            </div>
          </div>
        </div>
        <button className="char-btn" onClick={onClose} type="button">{t('characterDetail.back')}</button>
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
            <p className="char-section-title">{t('characterDetail.gear')}</p>
            {(['weapon', 'armor', 'headgear'] as const).map(slot => {
              const equipped = member.equipment?.[slot] ?? null;
              const tpl = equipped ? getEquipmentTemplate(equipped.templateId) : null;
              return (
                <div key={slot} className="equip-slot-row">
                  <span className="equip-slot-label">{t(`characterDetail.slot.${slot}`)}</span>
                  {tpl && equipped ? (
                    <>
                      <span className="equip-slot-name">{tContent('equipment', equipped.templateId, 'name', tpl.name)}</span>
                      <span className="equip-stat-hint">
                        {tpl.damage ? `⚔${tpl.damage}` : ''}{tpl.defense ? ` 🛡${tpl.defense}` : ''}{tpl.hp ? ` ❤+${tpl.hp}` : ''}
                        {equipped.slots?.map((s: EquipmentSlotData, i: number) => (
                          <span key={i} style={{ color: 'var(--ink-gold-dim)', marginLeft: 4 }}>
                            {s.statKey === 'HP' ? `❤+${s.value}` : `+${s.value}`}
                          </span>
                        ))}
                      </span>
                      {onUnequipGear && (
                        <button className="char-btn" style={{ fontSize: '0.6rem', padding: '2px 8px' }} onClick={() => onUnequipGear(slot)}>{t('characterDetail.remove')}</button>
                      )}
                    </>
                  ) : (
                    <span className="equip-slot-empty">{t('characterDetail.slot.empty')}</span>
                  )}
                </div>
              );
            })}
            {(member.medicineSlots ?? DEFAULT_MEDICINE_SLOTS).map((ms, idx) => {
              const itemName = ms.itemId
                ? tContent('items', ms.itemId, 'name', ITEM_DATABASE[ms.itemId as ItemID]?.name ?? ms.itemId)
                : null;
              return (
                <div key={idx} className="med-slot-row">
                  <span className="equip-slot-label">{t('characterDetail.medSlot', { index: idx + 1 })}</span>
                  {itemName
                    ? <span className="equip-slot-name">{itemName} <span style={{ color: 'var(--ink-text-muted)', fontSize: '0.65rem' }}>({t(`characterDetail.medCondition.${ms.condition}`)})</span></span>
                    : <span className="equip-slot-empty">{t('characterDetail.slot.empty')}</span>
                  }
                </div>
              );
            })}
            <button className="char-btn primary" style={{ marginTop: 8 }} onClick={onOpenEquipMode} type="button">
              {t('characterDetail.equip')}
            </button>
            {/* Syringe loadout */}
            {onSetSyringeLoadout && (
              <>
                <p className="char-section-title" style={{ marginTop: 10 }}>{t('characterDetail.healingSyringe')} <span style={{ color: syringeCount > 0 ? 'var(--ink-status-ok)' : 'var(--ink-status-bad)' }}>×{syringeCount}</span></p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {member.syringeLoadout
                    ? <button className="char-btn" onClick={() => onSetSyringeLoadout(null)}>{t('characterDetail.unequip')}</button>
                    : <button className="char-btn primary" disabled={syringeCount === 0} onClick={() => onSetSyringeLoadout({ autoUseThresholdPct: 0.30 })}>{t('characterDetail.equip')}</button>
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
              <div style={{ color: 'var(--ink-text)', fontSize: '0.9rem', fontFamily: 'var(--ink-font-body)' }}>{tContent('skills', member.skill.id, 'name', member.skill.name)}</div>
              <div className="char-sub">{t('characterDetail.skillMeta', { mult: member.skill.damageMultiplier, cooldown: Math.round(member.skill.cooldownMs / 1000) })}</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={member.skill.autoEnabled} onChange={onToggleAutoCast} style={{ accentColor: 'var(--ink-gold)' }} />
                <span className="ink-stat">{t('characterDetail.autoCast')}</span>
              </label>
            </div>
          ) : <p className="ink-stat">{t('characterDetail.skillLocked')}</p>
        )}

        {tab === 'bio' && (
          <>
            {civConfig && (
              <>
                <p className="char-section-title">{tContent('civ', member.civilization, 'passiveName', civConfig.passive.name)}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-text-dim)', lineHeight: 1.6 }}>{tContent('civ', member.civilization, 'passiveDescription', civConfig.passive.description)}</p>
              </>
            )}
            <p className="char-section-title" style={{ marginTop: 12 }}>{t('characterDetail.biography')}</p>
            <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--ink-text-muted)', lineHeight: 1.6 }}>
              {t('characterDetail.biographyEmpty')}
            </p>
          </>
        )}
      </div>

      {/* ── Footer (invite / promote for mercenaries) ── */}
      {isMerc && onInviteMercenary && (
        <div className="char-detail-footer">
          <button className="char-btn primary" disabled={!canAffordInvite} onClick={onInviteMercenary}>
            {t('characterDetail.inviteToGuild', { cost: inviteCost })}
          </button>
        </div>
      )}
    </div>
  );
}
