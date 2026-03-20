import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/game/state/store';
import { RosterListItem } from '@/ui/components/roster-list-item';
import { CharacterDetailPanel } from '@/ui/panels/character-detail-panel';
import { MISSIONS } from '@/game/data/missions';
import { canPromote } from '@/game/data/ranks';
import { CIVILIZATIONS, CIV_CONFIG } from '@/game/data/civilization-config';
import type { StatKey } from '@/game/state/game-state';
import '@/ui/styles/panels.css';

interface GuildRosterProps {
  onClose: () => void;
}

export function GuildRoster({ onClose }: GuildRosterProps) {
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const activeMissions = useGameStore((s) => s.activeMissions);
  const gold = useGameStore((s) => s.gold);
  const allocateStat = useGameStore((s) => s.allocateStat);
  const toggleAutoCast = useGameStore((s) => s.toggleAutoCast);
  const inviteMercenary = useGameStore((s) => s.inviteMercenary);
  const promoteMember = useGameStore((s) => s.promoteMember);
  const removeMember = useGameStore((s) => s.removeMember);

  const [civFilter, setCivFilter] = useState<string>('all');

  const members = useMemo(() => {
    const all = founder ? [founder, ...roster] : roster;
    if (civFilter === 'all') return all;
    return all.filter((m) => m.civilization === civFilter);
  }, [founder, roster, civFilter]);

  const totalCount = (founder ? 1 : 0) + roster.length;
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );

  const getMissionName = useCallback((memberId: string) => {
    const active = activeMissions.find((m) => m.memberIds.includes(memberId));
    if (!active) return undefined;
    const mission = MISSIONS.find((m) => m.id === active.missionId);
    return mission?.name;
  }, [activeMissions]);

  const handleSelect = (id: string) => {
    setSelectedMemberId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {/* Roster list — right side (standard panel position) */}
      <div className="panel-overlay">
        <h2>
          Guild Roster ({totalCount})
          <button className="panel-close-btn" onClick={onClose}>Close</button>
        </h2>

        {/* Civ filter */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          <button className="panel-btn" style={{ width: 'auto', padding: '3px 8px', fontSize: '0.75rem', marginTop: 0 }} onClick={() => setCivFilter('all')}>All</button>
          {CIVILIZATIONS.map((civ) => (
            <button key={civ} className="panel-btn" style={{ width: 'auto', padding: '3px 8px', fontSize: '0.75rem', marginTop: 0, opacity: civFilter === civ ? 1 : 0.6 }} onClick={() => setCivFilter(civ)}>
              {CIV_CONFIG[civ].displayName}
            </button>
          ))}
        </div>

        {members.map((member) => (
          <div key={member.id}>
            <RosterListItem
              member={member}
              isSelected={member.id === selectedMemberId}
              activeMissionName={getMissionName(member.id)}
              onClick={() => handleSelect(member.id)}
            />
            {!member.isFounder && member.id === selectedMemberId && (
              <button
                className="panel-btn"
                style={{ fontSize: '0.75rem', padding: '4px 8px', marginTop: 0, marginBottom: 8 }}
                onClick={() => { removeMember(member.id); setSelectedMemberId(null); }}
              >
                Release
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Character detail — separate popup on the left side */}
      {selectedMember && (
        <div className="panel-overlay" style={{
          left: 0, right: 'auto', width: 360,
          borderLeft: 'none', borderRight: '2px solid rgba(255, 215, 0, 0.3)',
        }}>
          <CharacterDetailPanel
            member={selectedMember}
            onAllocateStat={(stat) => allocateStat(selectedMember.id, stat as StatKey)}
            onToggleAutoCast={() => toggleAutoCast(selectedMember.id)}
            onInviteMercenary={
              selectedMember.rank === 'MERCENARY'
                ? () => inviteMercenary(selectedMember.id)
                : undefined
            }
            inviteCost={selectedMember.level * 100}
            canAffordInvite={gold >= selectedMember.level * 100}
            onPromote={
              selectedMember.rank !== 'MERCENARY'
                ? () => promoteMember(selectedMember.id)
                : undefined
            }
            canAffordPromote={canPromote(selectedMember, gold)}
            onClose={() => setSelectedMemberId(null)}
          />
        </div>
      )}
    </>
  );
}
