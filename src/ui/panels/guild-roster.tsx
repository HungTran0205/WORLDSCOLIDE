import { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '@/game/state/store';
import { MemberCard } from '@/ui/components/member-card';
import { CharacterDetailPanel } from './character-detail-panel';
import { EquipModePanel } from '@/ui/components/equip-mode-panel';
import { ConfirmDialog } from '@/ui/components/confirm-dialog';
import { CIVILIZATIONS, CIV_CONFIG } from '@/game/data/civilization-config';
import { canPromote } from '@/game/data/ranks';
import type { MemberStatus, StatKey, SyringeLoadout } from '@/game/state/game-state';
import type { EquipmentSlot } from '@/game/data/equipment-templates';
import '@/ui/styles/guild-roster.css';

interface GuildRosterProps {
  onClose: () => void;
}

type CivFilter = 'all' | string;
type StatusFilter = 'all' | MemberStatus;

const STATUS_LABELS: Record<string, string> = {
  idle: 'Available', 'on-mission': 'On Quest', injured: 'Injured', training: 'Training', assigned: 'Assigned',
};

export function GuildRoster({ onClose }: GuildRosterProps) {
  const founder          = useGameStore(s => s.founder);
  const roster           = useGameStore(s => s.roster);
  const gold             = useGameStore(s => s.gold);
  const allocateStat     = useGameStore(s => s.allocateStat);
  const toggleAutoCast   = useGameStore(s => s.toggleAutoCast);
  const inviteMercenary  = useGameStore(s => s.inviteMercenary);
  const promoteMember    = useGameStore(s => s.promoteMember);
  const removeMember     = useGameStore(s => s.removeMember);
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
  const isMercenary = selected?.rank === 'MERCENARY';

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
  const inviteCost = (selected?.level ?? 0) * 100;

  function openDetail(id: string) {
    setSelectedId(id);
    setView('detail');
  }

  if (view === 'equip' && selected) {
    return (
      <div className="guild-roster-overlay">
        <EquipModePanel memberId={selected.id} onClose={() => setView('detail')} />
      </div>
    );
  }

  if (view === 'detail' && selected) {
    return (
      <div className="guild-roster-overlay">
        <div className="ink-panel guild-roster ink-enter">
          <CharacterDetailPanel
            member={selected}
            onAllocateStat={(stat, amount) => allocateStat(selected.id, stat as StatKey, amount)}
            onToggleAutoCast={() => toggleAutoCast(selected.id)}
            onInviteMercenary={isMercenary ? () => inviteMercenary(selected.id) : undefined}
            inviteCost={isMercenary ? inviteCost : undefined}
            canAffordInvite={isMercenary ? gold >= inviteCost : undefined}
            onPromote={!isMercenary && !selected.isFounder ? () => promoteMember(selected.id) : undefined}
            canAffordPromote={!isMercenary ? canPromote(selected, gold) : undefined}
            onClose={() => setView('grid')}
            syringeCount={syringeCount}
            onSetSyringeLoadout={loadout => setSyringeLoadout(selected.id, loadout as SyringeLoadout | null)}
            equipmentInventory={equipmentInventory}
            onEquipGear={id => equipGear(selected.id, id)}
            onUnequipGear={slot => unequipGear(selected.id, slot as EquipmentSlot)}
            onOpenEquipMode={() => setView('equip')}
          />
          {!selected.isFounder && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--ink-gold-dim)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="filter-pill"
                style={{ color: 'var(--ink-status-bad)', borderColor: 'rgba(196,74,74,0.4)' }}
                onClick={() => setReleaseTarget(selected.id)}
              >
                Release
              </button>
            </div>
          )}
        </div>
        {releaseTarget && (
          <ConfirmDialog
            message={`Release ${allMembers.find(m => m.id === releaseTarget)?.name ?? 'this member'}? This cannot be undone.`}
            confirmLabel="Release"
            danger
            onConfirm={() => { removeMember(releaseTarget); setReleaseTarget(null); setView('grid'); }}
            onCancel={() => setReleaseTarget(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="guild-roster-overlay">
      <div className="ink-panel guild-roster ink-enter">
        {/* Header */}
        <header className="roster-header">
          <span>
            <span className="roster-title">MEMBERS</span>
            <span className="roster-count">{allMembers.length}</span>
          </span>
          <button className="roster-close-btn" onClick={onClose} type="button">Close</button>
        </header>

        {/* Controls */}
        <div className="roster-controls">
          <input
            className="roster-search"
            placeholder="Search by name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="filter-group">
            <button className={`filter-pill${civFilter === 'all' ? ' active' : ''}`} onClick={() => setCivFilter('all')}>All</button>
            {CIVILIZATIONS.map(civ => (
              <button key={civ} className={`filter-pill${civFilter === civ ? ' active' : ''}`} onClick={() => setCivFilter(civ)}>
                {CIV_CONFIG[civ].displayName}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <button className={`filter-pill${statusFilter === 'all' ? ' active' : ''}`} onClick={() => setStatusFilter('all')}>All Status</button>
            {(Object.keys(STATUS_LABELS) as MemberStatus[]).map(s => (
              <button key={s} className={`filter-pill${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="member-grid">
          {visible.length === 0
            ? <p className="roster-empty">No members match filters.</p>
            : visible.map(m => <MemberCard key={m.id} member={m} onClick={() => openDetail(m.id)} />)
          }
        </div>
      </div>
    </div>
  );
}
