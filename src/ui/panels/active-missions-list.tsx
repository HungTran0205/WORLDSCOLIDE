/** Active missions list with phase-aware progress — extracted from quest-board */

import { useState, useEffect } from 'react';
import type { ActiveMission, MissionPhase } from '@/game/state/game-state';
import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { ARRIVAL_TIMEOUT_MS } from '@/game/systems/mission-tick';
import { MissionProgressBar } from '@/ui/components/mission-progress-bar';
import { ArrivalModal } from '@/ui/panels/arrival-modal';

const PHASE_BADGE: Partial<Record<MissionPhase, string>> = {
  traveling: 'Traveling...',
  arrived: 'Arrived!',
  'in-combat': 'In Combat',
};

interface ActiveMissionsListProps {
  activeMissions: ActiveMission[];
}

export function ActiveMissionsList({ activeMissions }: ActiveMissionsListProps) {
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
