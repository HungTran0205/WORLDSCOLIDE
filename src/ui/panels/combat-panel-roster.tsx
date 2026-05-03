/**
 * Roster strips for the battle phase — horizontal HP-bar cards above the
 * canvas (enemies) and below it (allies). Mirrors the mockup layout so the
 * player sees aggregate party + threat status without hunting through the
 * floating HP bars over each sprite.
 */

import { useGameStore } from '@/game/state/store';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';

export function CombatPanelEnemyRoster() {
  // Subscribe to the stable arenaEntities ref; filter in render body so the
  // selector returns a stable identity (filtering inside a Zustand selector
  // produces a fresh array every snapshot → infinite re-render loop).
  const entities = useGameStore((s) => s.arenaEntities);
  const enemies = entities.filter((e) => !e.isAlly);
  if (enemies.length === 0) return null;
  const aliveCount = enemies.filter((e) => e.currentHp > 0).length;
  return (
    <div className="combat-roster combat-roster--enemies">
      <div className="combat-roster__label">
        ENEMIES <span className="combat-roster__count">{aliveCount} ALIVE</span>
      </div>
      <div className="combat-roster__list">
        {enemies.map((e) => <RosterCard key={e.id} entity={e} />)}
      </div>
    </div>
  );
}

export function CombatPanelAllyRoster() {
  const entities = useGameStore((s) => s.arenaEntities);
  const allies = entities.filter((e) => e.isAlly);
  if (allies.length === 0) return null;
  return (
    <div className="combat-roster combat-roster--allies">
      {allies.map((e) => <RosterCard key={e.id} entity={e} />)}
    </div>
  );
}

function RosterCard({ entity }: { entity: ArenaEntitySnapshot }) {
  const pct = Math.max(0, Math.min(1, entity.currentHp / Math.max(1, entity.maxHp)));
  const isDead = entity.currentHp <= 0;
  const sideClass = entity.isAlly ? 'combat-card--ally' : 'combat-card--enemy';
  const deadClass = isDead ? ' combat-card--dead' : '';
  return (
    <div className={`combat-card ${sideClass}${deadClass}`}>
      <div className="combat-card__name" title={entity.name}>{entity.name}</div>
      <div className="combat-card__bar">
        <div className="combat-card__fill" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="combat-card__hp">
        {Math.max(0, Math.round(entity.currentHp))}/{entity.maxHp}
      </div>
    </div>
  );
}
