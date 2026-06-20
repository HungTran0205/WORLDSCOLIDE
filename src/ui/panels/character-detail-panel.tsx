/**
 * Character detail panel — content only.
 * Shell (chrome, header, close button, open/close animation, SFX) is owned by
 * PanelFrame. This file contains only content-specific JSX.
 *
 * Positioning note: this panel is rendered inside guild-roster's .ink-panel
 * wrapper (guild-roster.tsx), which provides the outer chrome during the
 * guild-roster's own migration. PanelFrame here takes ownership of the
 * inner title/close; the outer .ink-panel is guild-roster's concern.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Member, SyringeLoadout } from '@/game/state/game-state';
import type { StatKey } from '@/game/state/game-state';
import { getBlessedPct } from '@/game/state/game-state';
import { HpExpBar } from '@/ui/components/stat-bar';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { calcMemberDerivedStats } from '@/game/systems/member-derived-stats';
import { GRADE_META } from '@/game/data/grades';
import { getEquipmentTemplate } from '@/game/data/equipment-templates';
import type { EquipmentSlot } from '@/game/data/equipment-templates';
import type { EquipmentItem } from '@/game/state/game-state';
import type { EquipmentSlotData } from '@/game/data/workshop-types';
import { StatsTab } from '@/ui/components/character-tabs/stats-tab';
import { DEFAULT_MEDICINE_SLOTS } from '@/game/state/guild-slice';
import { ITEM_DATABASE } from '@/game/data/items';
import type { ItemID } from '@/game/data/items';
import { tContent } from '@/i18n/content-localization';
import { SkillDetail } from '@/ui/components/skill-detail';
import { SkillIcon } from '@/ui/components/skill-icon';
import { getArchetypeSkillPool } from '@/game/data/skills';
import { applySkillRankMilestones } from '@/game/systems/skill-training-system';
import { PanelFrame } from '@/ui/components/panel-frame';
import '@/ui/styles/character-detail.css';

type TabKey = 'stats' | 'equipment' | 'skills' | 'bio';
const THRESHOLD_OPTIONS = [0.20, 0.30, 0.40, 0.50] as const;

export interface CharacterDetailPanelProps {
  member: Member;
  onAllocateStat: (stat: StatKey, amount?: number) => void;
  onToggleAutoCast: () => void;
  /** Equip a skill from the member's class pool as the carried (combat) skill. */
  onEquipSkill?: (skillId: string) => void;
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
  onOpenEquipMode?: () => void;
  /** Rename this member. Omit to disable renaming (e.g. founder / mercenaries). */
  onRename?: (name: string) => void;
}

export function CharacterDetailPanel({
  member, onAllocateStat, onToggleAutoCast, onEquipSkill,
  onInviteMercenary, inviteCost, canAffordInvite,
  onClose,
  syringeCount = 0, onSetSyringeLoadout,
  onUnequipGear, onOpenEquipMode, onRename,
}: CharacterDetailPanelProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>('stats');
  const [imgFailed, setImgFailed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const canRename = Boolean(onRename) && !member.isFounder && !member.isMercenary;
  const commitRename = () => {
    const next = nameDraft.trim();
    if (next && onRename) onRename(next);
    setEditingName(false);
  };

  const maxHp  = calcMemberDerivedStats(member).combat.maxHp;
  const isMerc = member.isMercenary;
  const gradeMeta = GRADE_META[member.grade];
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

  /* Title: member name is displayed directly — it is a proper noun chosen by
     the player and requires no i18n translation. Falls back to unknownName key
     only if the name string is somehow empty. */
  const panelTitle = member.name || t('characterDetail.unknownName');

  return (
    <PanelFrame title={panelTitle} onClose={onClose} variant="panel">
      {/* Flex column wrapper — lets char-tabs-body grow and scroll inside pf-content */}
      <div className="char-detail">
      {/* ── Portrait + identity row ── */}
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
          <div className="char-sub">
            <span style={{ color: gradeMeta.color, fontWeight: 'bold' }}>Grade {member.grade}</span>
            {isMerc && <span style={{ marginLeft: 6, opacity: 0.7, fontSize: '0.75em' }}>MERC</span>}
            {' · '}{civName}
          </div>
          <div className="char-bar-row">
            <div>
              <div className="char-bar-label"><span>{t('characterDetail.barHp')}</span><span>{maxHp}</span></div>
              <div className="ink-bar-track"><div className="ink-bar-fill ink-bar-hp" style={{ width: '100%' }} /></div>
            </div>
            {member.civilization === 'LinhSon' && (
              <HpExpBar kind="blessed" current={Math.round(getBlessedPct(member) * 100)} max={100} />
            )}
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="ink-tab-bar" style={{ padding: '0 16px' }}>
        {TABS.map(tabItem => (
          <button
            key={tabItem.key}
            className={`ink-tab${tab === tabItem.key ? ' active' : ''}`}
            onClick={() => tabItem.key === 'equipment' && onOpenEquipMode ? onOpenEquipMode() : setTab(tabItem.key)}
            type="button"
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="char-tabs-body">

        {tab === 'stats' && (
          <StatsTab member={member} isMerc={isMerc} onAllocateStat={onAllocateStat} />
        )}

        {tab === 'equipment' && (
          <>
            <p className="char-section-title">{t('characterDetail.gear')}</p>
            {(['weapon', 'armor'] as const).map(slot => {
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

        {tab === 'skills' && (() => {
          const pool = getArchetypeSkillPool(member.archetype);
          if (pool.length === 0) return <p className="ink-stat">{t('characterDetail.skillLocked')}</p>;
          const carriedId = member.skill?.id ?? null;
          const isTraining = member.status === 'training';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p className="char-sub">{t('characterDetail.skillPoolHint')}</p>
              {pool.map(base => {
                const rank = member.skillRanks?.[base.id]?.rank ?? 0; // 0 = not yet learned
                const isLearned = rank >= 1;
                const resolved = applySkillRankMilestones({ ...base }, Math.max(1, rank));
                const isCarried = carriedId === base.id;
                return (
                  <div key={base.id} className={`skill-pool-row${isCarried ? ' is-carried' : ''}${isLearned ? '' : ' is-locked'}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <SkillIcon skill={base} size={36} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--ink-text)', fontSize: '0.85rem', fontFamily: 'var(--ink-font-body)' }}>
                          {tContent('skills', base.id, 'name', base.name)}
                          <span className="char-sub" style={{ marginLeft: 8 }}>{t('characterDetail.skillLevel', { level: rank })}</span>
                        </div>
                        <div className="char-sub">{t('characterDetail.skillMeta', { mult: resolved.damageMultiplier, cooldown: Math.round(resolved.cooldownMs / 1000) })}</div>
                      </div>
                      {!isLearned
                        ? <span className="skill-locked-badge">{t('characterDetail.skillNeedLearn')}</span>
                        : isCarried
                          ? <span className="skill-carried-badge">{t('characterDetail.skillCarried')}</span>
                          : onEquipSkill && (
                              <button className="char-btn" disabled={isTraining} title={isTraining ? t('characterDetail.skillEquipLocked') : ''}
                                onClick={() => onEquipSkill(base.id)}>
                                {t('characterDetail.skillEquip')}
                              </button>
                            )
                      }
                    </div>
                    {tContent('skills', base.id, 'desc', '') && (
                      <p className="skill-desc">{tContent('skills', base.id, 'desc', '')}</p>
                    )}
                    <SkillDetail skill={resolved} t={t} />
                    {isCarried && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 2 }}>
                        <input type="checkbox" checked={!!member.skill?.autoEnabled} onChange={onToggleAutoCast} style={{ accentColor: 'var(--ink-gold)' }} />
                        <span className="ink-stat">{t('characterDetail.autoCast')}</span>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

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
    </PanelFrame>
  );
}
