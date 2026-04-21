/** Floating active-missions widget — always visible below HUD top bar */

import { useState, useEffect } from 'react';
import type { MissionPhase } from '@/game/state/game-state';
import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { MissionProgressBar } from '@/ui/components/mission-progress-bar';
import { GameIcon } from '@/ui/components/game-icon';
import { ArrivalModal } from '@/ui/panels/arrival-modal';

const PHASE_BADGE: Partial<Record<MissionPhase, string>> = {
  traveling: 'Traveling...',
  arrived: 'Arrived!',
  'in-combat': 'In Combat',
};

/** Floating container style — positioned top-right below HUD */
const CONTAINER_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 40,
  left: 16,
  width: 320,
  zIndex: 60,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  pointerEvents: 'auto',
};

const HEADER_STYLE: React.CSSProperties = {
  color: '#ffd700',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  margin: '0 0 2px',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
};

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(20, 20, 30, 0.9)',
  border: '1px solid rgba(255, 215, 0, 0.25)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#e0e0e0',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  fontSize: '0.85rem',
};

export function ActiveMissionsList() {
  const activeMissions = useGameStore((s) => s.activeMissions);
  const [now, setNow] = useState(() => Date.now());
  const [arrivalModalFor, setArrivalModalFor] = useState<string | null>(null);
  const setCombatMode = useGameStore((s) => s.setCombatMode);
  const updateMissionPhase = useGameStore((s) => s.updateMissionPhase);
  const enterCombatPrep = useGameStore((s) => s.enterCombatPrep);

  useEffect(() => {
    if (activeMissions.length === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeMissions.length]);

  if (activeMissions.length === 0) return null;

  const openArrival = (missionId: string) => setArrivalModalFor(missionId);
  const closeArrival = () => setArrivalModalFor(null);

  const handleCombatChoice = (missionId: string, mode: 'auto' | 'manual') => {
    setCombatMode(missionId, mode);
    // Tick loop pauses when gameScene becomes 'combat-arena', so we update phase explicitly
    updateMissionPhase(missionId, 'in-combat');
    if (mode === 'manual') {
      enterCombatPrep(missionId);
    }
    closeArrival();
  };

  return (
    <div style={CONTAINER_STYLE}>
      <div style={HEADER_STYLE}>Active Missions</div>
      {activeMissions.map((am) => {
        const missionData = MISSIONS.find((m) => m.id === am.missionId);
        const badge = PHASE_BADGE[am.phase];
        const isArrived = am.phase === 'arrived';

        return (
          <div
            key={`${am.missionId}-${am.startTime}`}
            style={{ ...CARD_STYLE, cursor: isArrived ? 'pointer' : 'default' }}
            onClick={isArrived ? () => openArrival(am.missionId) : undefined}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {missionData && <GameIcon category="badge" id={missionData.tier} size={18} fallbackText={missionData.tier} />}
                {missionData?.name ?? am.missionId}
              </strong>
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
            {isArrived && (
              <div style={{ fontSize: '0.8rem', color: '#f39c12', marginTop: 4 }}>
                ⚔️ Click to choose combat mode
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
            onChooseManual={() => handleCombatChoice(am.missionId, 'manual')}
            onChooseAuto={() => handleCombatChoice(am.missionId, 'auto')}
            onClose={closeArrival}
          />
        );
      })()}
    </div>
  );
}
