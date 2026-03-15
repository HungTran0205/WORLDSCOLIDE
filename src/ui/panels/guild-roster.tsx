import { useMemo, useCallback } from 'react';
import { useGameStore } from '@/game/state/store';
import { MemberCard } from '@/ui/components/member-card';
import { MISSIONS } from '@/game/data/missions';
import type { StatKey } from '@/game/state/game-state';
import '@/ui/styles/panels.css';

interface GuildRosterProps {
  onClose: () => void;
}

export function GuildRoster({ onClose }: GuildRosterProps) {
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const activeMissions = useGameStore((s) => s.activeMissions);
  const members = useMemo(() => {
    return founder ? [founder, ...roster] : roster;
  }, [founder, roster]);
  const allocateStat = useGameStore((s) => s.allocateStat);
  const removeMember = useGameStore((s) => s.removeMember);

  const getMissionName = useCallback((memberId: string) => {
    const active = activeMissions.find((m) => m.memberIds.includes(memberId));
    if (!active) return undefined;
    const mission = MISSIONS.find((m) => m.id === active.missionId);
    return mission?.name;
  }, [activeMissions]);

  return (
    <div className="panel-overlay">
      <h2>
        Guild Roster ({members.length})
        <button className="panel-close-btn" onClick={onClose}>Close</button>
      </h2>

      {members.map((member) => (
        <div key={member.id}>
          <MemberCard
            member={member}
            onAllocateStat={(stat) => allocateStat(member.id, stat as StatKey)}
            activeMissionName={getMissionName(member.id)}
          />
          {!member.isFounder && (
            <button
              className="panel-btn"
              style={{ fontSize: '0.75rem', padding: '4px 8px', marginTop: 0, marginBottom: 12 }}
              onClick={() => removeMember(member.id)}
            >
              Release
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
