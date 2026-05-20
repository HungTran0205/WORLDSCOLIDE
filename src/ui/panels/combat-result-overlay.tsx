/** Victory/defeat result screen — shows combat stats, survivors, rewards, continue button */

import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { applyArenaResult } from '@/game/systems/arena-result-handler';
import { TUTORIAL_BEAR_MISSION_ID } from '@/game/data/tutorial-data';
import { useMemo } from 'react';

export function CombatResultOverlay() {
  const arenaResult = useGameStore(s => s.arenaResult);
  const arenaMissionId = useGameStore(s => s.arenaMissionId);
  const founder = useGameStore(s => s.founder);
  const roster = useGameStore(s => s.roster);

  const allMembers = useMemo(() => founder ? [founder, ...roster] : roster, [founder, roster]);

  if (!arenaResult) return null;

  const mission = MISSIONS.find(m => m.id === arenaMissionId);
  const getName = (id: string) => allMembers.find(m => m.id === id)?.name ?? id;
  const isVictory = arenaResult.outcome !== 'full-wipe';

  const handleContinue = () => {
    applyArenaResult();
  };

  return (
    <div style={OVERLAY}>
      <div style={BANNER}>
        <h1 style={{ color: isVictory ? '#ffd700' : '#e74c3c', margin: 0, fontSize: '2rem' }}>
          {isVictory ? 'VICTORY' : 'DEFEAT'}
        </h1>
      </div>

      <div style={CONTENT}>
        {/* Combat stats */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 12, color: '#aaa', fontSize: '0.85rem' }}>
          <span>Duration: {Math.round(arenaResult.durationMs / 1000)}s</span>
          <span>Damage: {arenaResult.totalDamageDealt}</span>
        </div>

        {/* Survivors */}
        {arenaResult.survivors.length > 0 && (
          <div style={{ color: '#2ecc71', marginBottom: 8, fontSize: '0.9rem' }}>
            Survivors: {arenaResult.survivors.map(getName).join(', ')}
          </div>
        )}

        {/* Injured */}
        {arenaResult.injured.length > 0 && (
          <div style={{ color: '#e74c3c', marginBottom: 8, fontSize: '0.9rem' }}>
            Injured: {arenaResult.injured.map(getName).join(', ')}
          </div>
        )}

        {/* Rewards */}
        {isVictory && mission && (
          <div style={{ marginTop: 8, padding: '8px 16px', background: 'rgba(255,215,0,0.1)', borderRadius: 6 }}>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: 4 }}>Rewards</div>
            <div style={{ color: '#e0e0e0', fontSize: '0.85rem' }}>
              Gold: {mission.goldRewardMin}–{mission.goldRewardMax}
            </div>
            <div style={{ color: '#e0e0e0', fontSize: '0.85rem' }}>
              EXP: {mission.expReward}
            </div>
            {/* Tutorial-specific bonus reward */}
            {arenaMissionId === TUTORIAL_BEAR_MISSION_ID && (
              <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,215,0,0.2)', paddingTop: 8 }}>
                <div style={{ color: '#ffd700', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  ★ Rescue Reward
                </div>
                <div style={{ color: '#2ecc71', fontSize: '0.85rem' }}>
                  Kael joins your guild!
                </div>
                <div style={{ color: '#a8d8ea', fontSize: '0.85rem' }}>
                  + Logging Site Access (permit)
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={handleContinue} style={CONTINUE_BTN}>
          Continue
        </button>
      </div>
    </div>
  );
}

const OVERLAY: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  zIndex: 100,
};

const BANNER: React.CSSProperties = {
  textAlign: 'center', marginBottom: 16,
};

const CONTENT: React.CSSProperties = {
  background: 'rgba(20,20,30,0.95)',
  border: '1px solid rgba(255,215,0,0.3)',
  borderRadius: 12, padding: 24,
  minWidth: 320, textAlign: 'center',
};

const CONTINUE_BTN: React.CSSProperties = {
  marginTop: 16, padding: '10px 32px',
  background: '#ffd700', color: '#1a1a2e',
  border: 'none', borderRadius: 6,
  fontWeight: 'bold', fontSize: '1rem',
  cursor: 'pointer',
};
