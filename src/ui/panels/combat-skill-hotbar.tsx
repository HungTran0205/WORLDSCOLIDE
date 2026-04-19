/**
 * Combat skill hotbar — bottom bar showing ally skills with cooldowns.
 * Keys 1-4 activate skills. Speed toggle (1x/2x) and combat timer included.
 */

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/game/state/store';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';

export function CombatSkillHotbar() {
  const entities = useGameStore(s => s.arenaEntities);
  const arenaTime = useGameStore(s => s.arenaTime);
  const speedMultiplier = useGameStore(s => s.speedMultiplier);
  const setSpeedMultiplier = useGameStore(s => s.setSpeedMultiplier);
  const activeAllyTurnId = useGameStore(s => s.activeAllyTurnId);

  // Get alive ally entities with skills (max 4)
  const allySkills = entities
    .filter(e => e.isAlly && e.currentHp > 0 && e.skillName)
    .slice(0, 4);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Q key: basic attack for first waiting ally (manual mode)
    if (e.key === 'q' || e.key === 'Q') {
      const waiting = entities.find(en => en.isAlly && en.currentHp > 0 && en.waitingForInput);
      if (waiting) {
        window.dispatchEvent(new CustomEvent('combat-attack', { detail: waiting.id }));
      }
      return;
    }
    const keyIndex = parseInt(e.key) - 1;
    if (keyIndex >= 0 && keyIndex < allySkills.length) {
      const ally = allySkills[keyIndex];
      if (ally.skillCooldownUntil <= arenaTime) {
        window.dispatchEvent(new CustomEvent('combat-skill', { detail: ally.id }));
      }
    }
  }, [allySkills, arenaTime, entities]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div style={HOTBAR_CONTAINER}>
      {/* Speed toggle */}
      <button
        onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 2 : 1)}
        style={SPEED_BTN}
      >
        {speedMultiplier}x
      </button>

      {/* Combat timer */}
      <div style={TIMER}>
        {Math.floor(arenaTime / 1000)}s
      </div>

      {/* Skill slots */}
      {allySkills.map((ally, idx) => (
        <SkillSlot
          key={ally.id}
          ally={ally}
          keyLabel={String(idx + 1)}
          arenaTime={arenaTime}
          waiting={ally.waitingForInput ?? false}
          isActiveTurn={activeAllyTurnId === null || ally.id === activeAllyTurnId}
          showYourTurn={ally.id === activeAllyTurnId}
        />
      ))}
    </div>
  );
}

function SkillSlot({ ally, keyLabel, arenaTime, waiting, isActiveTurn, showYourTurn }: {
  ally: ArenaEntitySnapshot;
  keyLabel: string;
  arenaTime: number;
  waiting: boolean;
  isActiveTurn: boolean;
  showYourTurn: boolean;
}) {
  const isReady = ally.skillCooldownUntil <= arenaTime;
  const isDead = ally.currentHp <= 0;
  const cooldownRemaining = Math.max(0, ally.skillCooldownUntil - arenaTime);
  const cooldownTotal = 10000; // approximate for overlay height

  const onClick = () => {
    if (isReady && !isDead) {
      window.dispatchEvent(new CustomEvent('combat-skill', { detail: ally.id }));
    }
  };

  const waitingStyle: React.CSSProperties = waiting ? {
    boxShadow: '0 0 10px rgba(255,235,59,0.8)',
    borderColor: 'rgba(255,235,59,0.8)',
  } : {};

  return (
    <div onClick={onClick} style={{
      ...SKILL_SLOT,
      opacity: isDead ? 0.3 : isActiveTurn ? 1 : 0.4,
      cursor: isReady && !isDead && isActiveTurn ? 'pointer' : 'default',
      ...waitingStyle,
    }}>
      {showYourTurn && (
        <div style={YOUR_TURN_BADGE}>YOUR TURN</div>
      )}
      <div style={KEY_BADGE}>{keyLabel}</div>
      <div style={{ fontSize: '0.7rem', color: '#ffd700', marginTop: 2 }}>{ally.skillName}</div>
      <div style={{ fontSize: '0.6rem', color: '#aaa' }}>{ally.name}</div>

      {/* Cooldown overlay */}
      {!isReady && !isDead && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${Math.min(100, (cooldownRemaining / cooldownTotal) * 100)}%`,
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '0 0 6px 6px',
          pointerEvents: 'none',
        }} />
      )}
      {isReady && !isDead && (
        <div style={{
          position: 'absolute', bottom: 2, left: 0, right: 0,
          textAlign: 'center', fontSize: '0.55rem',
          color: '#2ecc71', fontWeight: 'bold',
        }}>READY</div>
      )}
    </div>
  );
}

const HOTBAR_CONTAINER: React.CSSProperties = {
  position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
  display: 'flex', gap: 8, alignItems: 'center',
  padding: '8px 16px',
  background: 'rgba(20,20,30,0.9)',
  border: '1px solid rgba(255,215,0,0.3)',
  borderRadius: 12, zIndex: 80,
};

const SPEED_BTN: React.CSSProperties = {
  padding: '4px 10px', background: 'rgba(255,215,0,0.2)',
  color: '#ffd700', border: '1px solid rgba(255,215,0,0.4)',
  borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem',
};

const TIMER: React.CSSProperties = {
  color: '#aaa', fontSize: '0.8rem', minWidth: 40, textAlign: 'center',
  fontFamily: 'monospace',
};

const SKILL_SLOT: React.CSSProperties = {
  position: 'relative', width: 72, height: 64,
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,215,0,0.2)',
  borderRadius: 6, padding: '4px 6px',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  overflow: 'hidden',
};

const KEY_BADGE: React.CSSProperties = {
  position: 'absolute', top: 2, right: 4,
  fontSize: '0.6rem', color: '#888',
  background: 'rgba(0,0,0,0.4)', padding: '1px 4px',
  borderRadius: 3,
};

const YOUR_TURN_BADGE: React.CSSProperties = {
  position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
  background: '#ffd700', color: '#000',
  fontSize: '0.55rem', fontWeight: 'bold',
  padding: '1px 4px', borderRadius: 3,
  whiteSpace: 'nowrap', pointerEvents: 'none',
  zIndex: 1,
};
