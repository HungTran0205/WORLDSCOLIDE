import { useState, useMemo, useEffect } from 'react';
import type { ActiveMission, MissionPhase } from '@/game/state/game-state';
import { useGameStore } from '@/game/state/store';
import type { Mission, QuestTier } from '@/game/state/game-state';
import { MISSIONS } from '@/game/data/missions';
import { createActiveMission } from '@/game/systems/mission-dispatch';
import { ARRIVAL_TIMEOUT_MS } from '@/game/systems/mission-tick';
import { MissionProgressBar } from '@/ui/components/mission-progress-bar';
import { QuestDetailModal } from '@/ui/panels/quest-detail-modal';
import { ArrivalModal } from '@/ui/panels/arrival-modal';
import { playSFX } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
import '@/ui/styles/panels.css';

const TIER_UNLOCK: Record<number, QuestTier[]> = {
  1: ['F', 'E'],
  2: ['F', 'E', 'D'],
  3: ['F', 'E', 'D', 'C'],
  4: ['F', 'E', 'D', 'C', 'B'],
  5: ['F', 'E', 'D', 'C', 'B', 'A'],
  6: ['F', 'E', 'D', 'C', 'B', 'A', 'S'],
};

interface QuestBoardProps {
  onClose: () => void;
}

export function QuestBoard({ onClose }: QuestBoardProps) {
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const guildLevel = useGameStore((s) => s.guildLevel);
  const activeMissions = useGameStore((s) => s.activeMissions);

  const availableMembers = useMemo(() => {
    const all = founder ? [founder, ...roster] : roster;
    return all.filter((m) => m.status === 'idle');
  }, [founder, roster]);

  const unlockedTiers = useMemo(() => {
    return TIER_UNLOCK[Math.min(guildLevel, 6)] ?? ['F' as QuestTier];
  }, [guildLevel]);
  const dispatchMission = useGameStore((s) => s.dispatchMission);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [filterTier, setFilterTier] = useState<QuestTier | 'all'>('all');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const filteredMissions = MISSIONS.filter(
    (m) => (filterTier === 'all' || m.tier === filterTier) && unlockedTiers.includes(m.tier),
  );

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const updateMemberStatus = useGameStore((s) => s.updateMemberStatus);

  const handleDispatch = (mission: Mission) => {
    if (selectedMembers.length < mission.requiredMembers) return;
    const dispatched = selectedMembers.slice(0, mission.requiredMembers);
    const now = Date.now();
    dispatchMission(createActiveMission(mission, dispatched, now));
    dispatched.forEach((id) => updateMemberStatus(id, 'on-mission'));
    setSelectedMembers([]);
    playSFX(AUDIO.SFX_DISPATCH);
  };

  return (
    <div className="panel-overlay">
      <h2>
        Quest Board
        <button className="panel-close-btn" onClick={onClose}>Close</button>
      </h2>

      {/* Tier filter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          className="panel-btn"
          style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
          onClick={() => setFilterTier('all')}
        >
          All
        </button>
        {unlockedTiers.map((tier) => (
          <button
            key={tier}
            className="panel-btn"
            style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
            onClick={() => setFilterTier(tier)}
          >
            {tier}
          </button>
        ))}
      </div>

      {/* Available missions */}
      {filteredMissions.map((mission) => (
        <div
          key={mission.id}
          className="panel-section"
          style={{ cursor: 'pointer' }}
          onClick={() => setSelectedMission(mission)}
        >
          <strong>{mission.name}</strong>
          <span style={{ float: 'right', color: '#ffd700' }}>Tier {mission.tier}</span>
          <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: 4 }}>
            Duration: {Math.round(mission.durationMs / 60000)}min |
            Gold: {mission.goldRewardMin}-{mission.goldRewardMax} |
            EXP: {mission.expReward} |
            Members: {mission.requiredMembers} | Lv.{mission.requiredLevel}+
          </div>
          <button
            className="panel-btn"
            disabled={selectedMembers.length < mission.requiredMembers}
            onClick={(e) => { e.stopPropagation(); handleDispatch(mission); }}
          >
            Dispatch ({selectedMembers.length}/{mission.requiredMembers})
          </button>
        </div>
      ))}

      {/* Quest detail modal */}
      {selectedMission && (
        <QuestDetailModal
          mission={selectedMission}
          canDispatch={selectedMembers.length >= selectedMission.requiredMembers}
          selectedCount={selectedMembers.length}
          onDispatch={() => { handleDispatch(selectedMission); setSelectedMission(null); }}
          onClose={() => setSelectedMission(null)}
        />
      )}

      {/* Member selection */}
      <h3 style={{ color: '#ffd700', marginTop: 16 }}>Select Members</h3>
      {availableMembers.map((m) => (
        <label
          key={m.id}
          style={{ display: 'flex', gap: 8, padding: 4, cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={selectedMembers.includes(m.id)}
            onChange={() => toggleMember(m.id)}
          />
          <span>{m.name} (Lv.{m.level})</span>
        </label>
      ))}

      {/* Active missions */}
      {activeMissions.length > 0 && (
        <ActiveMissionsList activeMissions={activeMissions} />
      )}
    </div>
  );
}

const PHASE_BADGE: Partial<Record<MissionPhase, string>> = {
  traveling: '🚶 Traveling...',
  arrived: '📍 Arrived!',
  'in-combat': '⚔️ In Combat',
};

/** Live-updating active missions list with phase-aware progress */
function ActiveMissionsList({ activeMissions }: { activeMissions: ActiveMission[] }) {
  const [now, setNow] = useState(() => Date.now());
  const [arrivalModalFor, setArrivalModalFor] = useState<string | null>(null);
  const setCombatMode = useGameStore((s) => s.setCombatMode);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openArrival = (missionId: string) => setArrivalModalFor(missionId);
  const closeArrival = () => setArrivalModalFor(null);

  const handleCombatChoice = (missionId: string, mode: 'auto' | 'manual') => {
    setCombatMode(missionId, mode);
    closeArrival();
  };

  return (
    <>
      <h3 style={{ color: '#ffd700', marginTop: 16 }}>Active Missions</h3>
      {activeMissions.map((am) => {
        const missionData = MISSIONS.find((m) => m.id === am.missionId);
        const badge = PHASE_BADGE[am.phase];
        const isArrived = am.phase === 'arrived';
        const arrivalSecs = isArrived && am.arrivalTime
          ? Math.max(0, Math.ceil((am.arrivalTime + ARRIVAL_TIMEOUT_MS - now) / 1000))
          : null;

        return (
          <div
            key={am.missionId}
            className="panel-section"
            style={{ cursor: isArrived ? 'pointer' : 'default' }}
            onClick={isArrived ? () => openArrival(am.missionId) : undefined}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{missionData?.name ?? am.missionId}</strong>
              {badge && (
                <span style={{ fontSize: '0.75rem', color: isArrived ? '#f39c12' : '#aaa' }}>
                  {badge}
                </span>
              )}
            </div>

            {am.phase === 'traveling' && missionData && (
              <MissionProgressBar
                startTime={am.startTime}
                endTime={am.startTime + missionData.travelTimeMs}
                now={now}
              />
            )}
            {isArrived && arrivalSecs !== null && (
              <div style={{ fontSize: '0.8rem', color: '#f39c12', marginTop: 4 }}>
                Auto-combat in {arrivalSecs}s — click to choose
              </div>
            )}
            {am.phase === 'in-combat' && (
              <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: 4 }}>Resolving...</div>
            )}
          </div>
        );
      })}

      {arrivalModalFor && (() => {
        const am = activeMissions.find((m) => m.missionId === arrivalModalFor);
        const missionData = MISSIONS.find((m) => m.id === arrivalModalFor);
        if (!am || !missionData || !am.arrivalTime) return null;
        return (
          <ArrivalModal
            missionId={am.missionId}
            missionName={missionData.name}
            zone={missionData.zone ?? ''}
            enemyIds={missionData.enemyIds}
            arrivalTime={am.arrivalTime}
            timeoutMs={ARRIVAL_TIMEOUT_MS}
            onChooseManual={() => handleCombatChoice(am.missionId, 'manual')}
            onChooseAuto={() => handleCombatChoice(am.missionId, 'auto')}
            onClose={closeArrival}
          />
        );
      })()}
    </>
  );
}
