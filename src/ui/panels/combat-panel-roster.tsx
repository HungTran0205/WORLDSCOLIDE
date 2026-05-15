/**
 * Roster strips for the battle phase — slim HP-bar strips above (enemies) and
 * below (allies) the canvas.
 *
 * Phase 1 polish: slim design — name + thin HP bar only.
 * - Enemy strip: no portrait, no HP numbers
 * - Ally strip: no shield icon, no HP numbers, no chrome border/background
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
  return (
    <div className="combat-roster combat-roster--enemies">
      <div className="combat-roster__list">
        {enemies.map((e) => <SlimEnemyCard key={e.id} entity={e} />)}
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
      {allies.map((e) => <SlimAllyCard key={e.id} entity={e} />)}
    </div>
  );
}

/** Slim enemy card: name + thin HP bar, no portrait, no HP numbers */
function SlimEnemyCard({ entity }: { entity: ArenaEntitySnapshot }) {
  const pct = Math.max(0, Math.min(1, entity.currentHp / Math.max(1, entity.maxHp)));
  const isDead = entity.currentHp <= 0;
  return (
    <div className={'combat-card combat-card--enemy combat-card--slim' + (isDead ? ' combat-card--dead' : '')}>
      <div className="combat-card__name" title={entity.name}>{entity.name}</div>
      <div className="combat-card__bar combat-card__bar--thin">
        <div className="combat-card__fill" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

/** Slim ally card: name + thin HP bar, no shield icon, no HP numbers, no chrome */
function SlimAllyCard({ entity }: { entity: ArenaEntitySnapshot }) {
  const pct = Math.max(0, Math.min(1, entity.currentHp / Math.max(1, entity.maxHp)));
  const isDead = entity.currentHp <= 0;
  return (
    <div className={'combat-card combat-card--ally combat-card--slim combat-card--no-chrome' + (isDead ? ' combat-card--dead' : '')}>
      <div className="combat-card__name" title={entity.name}>{entity.name}</div>
      <div className="combat-card__bar combat-card__bar--thin">
        <div className="combat-card__fill" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}
