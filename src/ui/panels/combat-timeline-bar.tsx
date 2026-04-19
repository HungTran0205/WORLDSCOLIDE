/**
 * CombatTimelineBar — top-strip ATB timeline showing entity attack order.
 * Sorted ascending by nextAttackAt, updated at Zustand 5Hz sync rate.
 */

import { useMemo } from 'react';
import { useGameStore } from '@/game/state/store';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';
import './combat-timeline.css';

export function CombatTimelineBar() {
  const arenaPhase = useGameStore(s => s.arenaPhase);
  const entities = useGameStore(s => s.arenaEntities);
  const arenaTime = useGameStore(s => s.arenaTime);

  const sorted = useMemo(
    () => entities
      .filter(e => e.currentHp > 0)
      .sort((a, b) => a.nextAttackAt - b.nextAttackAt)
      .slice(0, 12),
    [entities],
  );

  if (arenaPhase !== 'fighting') return null;

  return (
    <div className="combat-timeline">
      {sorted.map(e => (
        <TimelineEntry key={e.id} entity={e} arenaTime={arenaTime} />
      ))}
    </div>
  );
}

function TimelineEntry({ entity, arenaTime }: { entity: ArenaEntitySnapshot; arenaTime: number }) {
  const remaining = Math.max(0, entity.nextAttackAt - arenaTime);
  const percent = entity.attackIntervalMs > 0
    ? Math.min(1, Math.max(0, 1 - remaining / entity.attackIntervalMs))
    : 0;
  const isNearReady = percent >= 0.9;
  const isWaiting = entity.waitingForInput;
  const isActing = entity.attackMoveState === 'step-forward';

  const sideClass = entity.isAlly ? 'ally' : entity.isBoss ? 'boss' : 'enemy';

  return (
    <div className={[
      'timeline-entry',
      sideClass,
      isNearReady ? 'near-ready' : '',
      isWaiting ? 'waiting' : '',
      isActing ? 'acting' : '',
    ].filter(Boolean).join(' ')}>
      {/* Name abbreviation */}
      <div className="timeline-name">{entity.name.slice(0, 4)}</div>
      {/* Cooldown fill bar */}
      <div className="timeline-fill-track">
        <div className="timeline-fill" style={{ width: `${Math.round(percent * 100)}%` }} />
      </div>
      {isWaiting && <div className="timeline-waiting-icon">!</div>}
    </div>
  );
}
