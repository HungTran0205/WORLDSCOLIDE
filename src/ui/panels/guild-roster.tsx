/**
 * Guild Roster panel — member grid, character detail, and equip mode views.
 *
 * Shell (chrome, header, close button, open/close animation, SFX) is owned by
 * PanelFrame for the grid and detail views. EquipModePanel manages its own
 * full-screen chrome.
 */

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { MemberCard } from '@/ui/components/member-card';
import { CharacterDetailPanel } from './character-detail-panel';
import { EquipModePanel } from '@/ui/components/equip-mode-panel';
import { ConfirmDialog } from '@/ui/components/confirm-dialog';
import { PanelFrame } from '@/ui/components/panel-frame';
import { CIVILIZATIONS, CIV_CONFIG } from '@/game/data/civilization-config';
import { tContent } from '@/i18n/content-localization';
import type { MemberStatus, StatKey, SyringeLoadout } from '@/game/state/game-state';
import type { EquipmentSlot } from '@/game/data/equipment-templates';
import '@/ui/styles/guild-roster.css';
import '@/ui/styles/member-card.css';

interface GuildRosterProps {
  onClose: () => void;
}

type CivFilter = 'all' | string;
type StatusFilter = 'all' | MemberStatus;

const STATUS_FILTERS: MemberStatus[] = ['idle', 'on-mission', 'injured', 'training', 'assigned'];

export function GuildRoster({ onClose }: GuildRosterProps) {
  const { t }            = useTranslation();
  const founder          = useGameStore(s => s.founder);
  const roster           = useGameStore(s => s.roster);
  const gold             = useGameStore(s => s.gold);
  const allocateStat     = useGameStore(s => s.allocateStat);
  const toggleAutoCast   = useGameStore(s => s.toggleAutoCast);
  const equipMemberSkill = useGameStore(s => s.equipMemberSkill);
  const inviteMercenary  = useGameStore(s => s.inviteMercenary);
  const removeMember     = useGameStore(s => s.removeMember);
  const renameMember     = useGameStore(s => s.renameMember);
  const setSyringeLoadout = useGameStore(s => s.setSyringeLoadout);
  const equipGear        = useGameStore(s => s.equipGear);
  const unequipGear      = useGameStore(s => s.unequipGear);
  const syringeCount     = useGameStore(s => s.inventory.items.HEALING_SYRINGE ?? 0);
  const equipmentInventory = useGameStore(s => s.inventory.equipmentInventory ?? []);

  const allMembers = useMemo(() => (founder ? [founder, ...roster] : roster), [founder, roster]);

  const [view, setView]           = useState<'grid' | 'detail' | 'equip'>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery]         = useState('');
  const [civFilter, setCivFilter] = useState<CivFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [releaseTarget, setReleaseTarget] = useState<string | null>(null);

  const visible = useMemo(() => allMembers
    .filter(m => !query || m.name.toLowerCase().includes(query.toLowerCase()))
    .filter(m => civFilter === 'all' || m.civilization === civFilter)
    .filter(m => statusFilter === 'all' || m.status === statusFilter),
    [allMembers, query, civFilter, statusFilter]);

  const selected = allMembers.find(m => m.id === selectedId) ?? null;
  const isMercenary = selected?.isMercenary ?? false;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (view === 'equip') setView('detail');
      else if (view === 'detail') setView('grid');
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, onClose]);

  const inviteCost = selected
    ? (({ F:1,E:2,D:3,C:4,B:5,A:6,S:7 } as Record<string,number>)[selected.grade] ?? 1) * 150
    : 0;

  function openDetail(id: string) {
    setSelectedId(id);
    setView('detail');
  }

  // EquipModePanel manages its own chrome — keep as-is
  if (view === 'equip' && selected) {
    return (
      <div className="roster-positioner">
        <EquipModePanel memberId={selected.id} onClose={() => setView('detail')} />
      </div>
    );
  }

  if (view === 'detail' && selected) {
    return (
      <div className="roster-positioner">
        <PanelFrame title={t('facilityNames.roster')} onClose={() => setView('grid')} variant="panel" size="lg">
          <CharacterDetailPanel
            member={selected}
            onAllocateStat={(stat, amount) => allocateStat(selected.id, stat as StatKey, amount)}
            onToggleAutoCast={() => toggleAutoCast(selected.id)}
            onEquipSkill={skillId => equipMemberSkill(selected.id, skillId)}
            onInviteMercenary={isMercenary ? () => inviteMercenary(selected.id) : undefined}
            inviteCost={isMercenary ? inviteCost : undefined}
            canAffordInvite={isMercenary ? gold >= inviteCost : undefined}
            onClose={() => setView('grid')}
            syringeCount={syringeCount}
            onSetSyringeLoadout={loadout => setSyringeLoadout(selected.id, loadout as SyringeLoadout | null)}
            equipmentInventory={equipmentInventory}
            onEquipGear={id => equipGear(selected.id, id)}
            onUnequipGear={slot => unequipGear(selected.id, slot as EquipmentSlot)}
            onOpenEquipMode={() => setView('equip')}
            onRename={name => renameMember(selected.id, name)}
          />
          {!selected.isFounder && (
            <div className="roster-release-row">
              <button
                className="filter-pill"
                style={{ color: 'var(--ink-status-bad)', borderColor: 'rgba(196,74,74,0.4)' }}
                onClick={() => setReleaseTarget(selected.id)}
              >
                {t('roster.release')}
              </button>
            </div>
          )}
        </PanelFrame>
        {releaseTarget && (
          <ConfirmDialog
            message={t('roster.releaseConfirm', { name: allMembers.find(m => m.id === releaseTarget)?.name ?? t('roster.releaseConfirmFallback') })}
            confirmLabel={t('roster.release')}
            danger
            onConfirm={() => { removeMember(releaseTarget); setReleaseTarget(null); setView('grid'); }}
            onCancel={() => setReleaseTarget(null)}
          />
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div className="roster-positioner">
      <PanelFrame title={t('facilityNames.roster')} onClose={onClose} variant="panel" size="lg">
        {/* Controls */}
        <div className="roster-controls">
          <input
            className="roster-search"
            placeholder={t('roster.searchPlaceholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="filter-group">
            <button className={`filter-pill${civFilter === 'all' ? ' active' : ''}`} onClick={() => setCivFilter('all')}>{t('roster.filterAll')}</button>
            {CIVILIZATIONS.map(civ => (
              <button key={civ} className={`filter-pill${civFilter === civ ? ' active' : ''}`} onClick={() => setCivFilter(civ)}>
                {tContent('civ', civ, 'name', CIV_CONFIG[civ].displayName)}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <button className={`filter-pill${statusFilter === 'all' ? ' active' : ''}`} onClick={() => setStatusFilter('all')}>{t('roster.filterAllStatus')}</button>
            {STATUS_FILTERS.map(s => (
              <button key={s} className={`filter-pill${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
                {t(`roster.status.${s}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Member count badge */}
        <div className="roster-count-row">
          <span className="roster-count">{allMembers.length}</span>
        </div>

        {/* Grid */}
        <div className="member-grid">
          {visible.length === 0
            ? <p className="roster-empty">{t('roster.empty')}</p>
            : visible.map(m => <MemberCard key={m.id} member={m} onClick={() => openDetail(m.id)} />)
          }
        </div>
      </PanelFrame>
    </div>
  );
}
