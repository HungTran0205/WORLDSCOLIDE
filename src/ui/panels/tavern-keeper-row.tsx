/**
 * Tavern keeper row — avatar slots + assign/unassign dropdown.
 * Reuses FacilityMemberAvatar pattern. Up to maxSlots[level-1] keepers.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { Member, GuildFacility } from '@/game/state/game-state';
import { getSpritePath, getBattleIdleFramePath } from '@/scene/sprites/sprite-path-resolver';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { handleKeeperAssigned } from '@/game/systems/tutorial-keeper-handler';

interface KeeperRowProps {
  facility: GuildFacility;
}

export function TavernKeeperRow({ facility }: KeeperRowProps) {
  const { t } = useTranslation();
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const assignMember = useGameStore((s) => s.assignMemberToFacility);
  const unassignMember = useGameStore((s) => s.unassignMemberFromFacility);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const highlightKeeper = tutorialStep === 'assign-keeper';

  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allMembers = useMemo(() => (founder ? [founder, ...roster] : roster), [founder, roster]);
  const memberMap = useMemo(() => new Map(allMembers.map((m) => [m.id, m])), [allMembers]);
  const eligible = useMemo(() => allMembers.filter((m) => m.status === 'idle'), [allMembers]);

  const maxSlots = FACILITY_DEFINITIONS[facility.type].maxSlots[facility.level - 1] ?? 1;
  const assigned: (Member | undefined)[] = facility.assignedMemberIds.map((id) => memberMap.get(id));

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(false);
      }
    };
    if (openDropdown) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [openDropdown]);

  const hasOpenSlot = assigned.length < maxSlots;
  const isEmpty = assigned.filter(Boolean).length === 0;

  return (
    <div className={`tv-keeper-row ${isEmpty ? 'is-empty' : ''}`}>
      {assigned.map((member) =>
        member ? (
          <KeeperAvatar key={member.id} member={member} onUnassign={() => unassignMember(member.id, facility.id)} />
        ) : null,
      )}
      {hasOpenSlot && (
        <button
          className={`tv-keeper-avatar${highlightKeeper ? ' tutorial-highlight' : ''}`}
          onClick={() => setOpenDropdown((v) => !v)}
          aria-label={t('tavern.keeper.assign')}
          title={t('tavern.keeper.assignHint')}
        >+</button>
      )}
      <div className="tv-keeper-info">
        {isEmpty ? (
          <span className="tv-keeper-name" style={{ color: 'var(--ink-text-muted)', fontStyle: 'italic' }}>
            {t('tavern.keeper.noneAssigned')}
          </span>
        ) : (
          <>
            <span className="tv-keeper-name">
              {assigned.filter(Boolean).map((m) => m!.name).join(' · ')}
            </span>
            <div className="tv-keeper-stats">
              {assigned.filter(Boolean).map((m) => (
                <span key={m!.id} className="tv-stat-chip">
                  INT {m!.stats.INT} · CHA {m!.stats.CHA}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
      {hasOpenSlot && (
        <div className="tv-keeper-dropdown" ref={dropdownRef}>
          <button
            className={`tv-btn is-small${highlightKeeper ? ' tutorial-highlight' : ''}`}
            onClick={() => setOpenDropdown((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={openDropdown}
          >
            {t('tavern.keeper.choose')} ▼
          </button>
          {openDropdown && (
            <div className="tv-keeper-dropdown-list" role="listbox">
              {eligible.length === 0 ? (
                <div className="tv-keeper-option is-empty">{t('tavern.keeper.noneEligible')}</div>
              ) : (
                eligible.map((m) => (
                  <div
                    key={m.id}
                    role="option"
                    className="tv-keeper-option"
                    onClick={() => {
                      if (assignMember(m.id, facility.id)) {
                        // Tutorial: assigning the keeper spawns the scripted recruit + advances.
                        handleKeeperAssigned(m.id, facility.id);
                        setOpenDropdown(false);
                      }
                    }}
                  >
                    <span>{m.name}</span>
                    <span style={{ color: 'var(--ink-text-muted)' }}>
                      CHA {m.stats.CHA}/INT {m.stats.INT}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KeeperAvatar({ member, onUnassign }: { member: Member; onUnassign: () => void }) {
  const base = getSpritePath(member.civilization, member.archetype ?? 'warrior', member.gender ?? 'M');
  const src = getBattleIdleFramePath(base, 'east', 0);
  return (
    <button
      className="tv-keeper-avatar is-set"
      onClick={onUnassign}
      title={`Unassign ${member.name}`}
      aria-label={`Unassign ${member.name}`}
    >
      <img src={src} alt={member.name} />
    </button>
  );
}
