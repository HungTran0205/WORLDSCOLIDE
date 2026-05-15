/**
 * Combat skill hotbar — bottom bar showing ally skills with cooldowns.
 * Keys 1-4 activate skills. Speed toggle (1x/2x) and combat timer included.
 *
 * Idle-mode (post Phase 1 cleanup): no manual basic-attack control.
 * Skills are still player-triggered to give the idle game a tactical hook.
 */

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/game/state/store';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';

export function CombatSkillHotbar() {
  const entities = useGameStore(s => s.arenaEntities);
  const arenaTime = useGameStore(s => s.arenaTime);
  const speedMultiplier = useGameStore(s => s.speedMultiplier);
  const setSpeedMultiplier = useGameStore(s => s.setSpeedMultiplier);

  // Get alive ally entities with skills (max 4)
  const allySkills = entities
    .filter(e => e.isAlly && e.currentHp > 0 && e.skillName)
    .slice(0, 4);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const keyIndex = parseInt(e.key) - 1;
    if (keyIndex >= 0 && keyIndex < allySkills.length) {
      const ally = allySkills[keyIndex];
      if (ally.skillCooldownUntil <= arenaTime) {
        window.dispatchEvent(new CustomEvent('combat-skill', { detail: ally.id }));
      }
    }
  }, [allySkills, arenaTime]);

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
        />
      ))}
    </div>
  );
}

function SkillSlot({ ally, keyLabel, arenaTime }: {
  ally: ArenaEntitySnapshot;
  keyLabel: string;
  arenaTime: number;
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

  return (
    <div onClick={onClick} style={{
      ...SKILL_SLOT,
      opacity: isDead ? 0.3 : 1,
      cursor: isReady && !isDead ? 'pointer' : 'default',
    }}>
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
