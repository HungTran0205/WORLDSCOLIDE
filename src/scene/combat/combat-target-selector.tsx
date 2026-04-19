/**
 * CombatTargetSelector — invisible R3F hitboxes over each enemy entity.
 * Click an enemy in manual mode to set it as the active manual target.
 * Hover shows a semi-transparent green overlay.
 * Only active during manual mode + fighting phase.
 */

import { useState, useCallback } from 'react';
import { useGameStore } from '@/game/state/store';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';

export function CombatTargetSelector() {
  const arenaPhase = useGameStore(s => s.arenaPhase);
  const arenaMissionId = useGameStore(s => s.arenaMissionId);
  const combatMode = useGameStore(s =>
    s.activeMissions.find(m => m.missionId === arenaMissionId)?.combatMode ?? 'auto',
  );
  const entities = useGameStore(s => s.arenaEntities);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = useCallback((enemyId: string) => {
    const allies = entities.filter(e => e.isAlly && e.currentHp > 0);
    // Prefer the waiting ally; fallback to soonest-to-act ally
    const waiting = allies.find(e => e.waitingForInput);
    const allyId = waiting?.id
      ?? allies.sort((a, b) => a.nextAttackAt - b.nextAttackAt)[0]?.id;
    if (!allyId) return;
    window.dispatchEvent(new CustomEvent('combat-target', { detail: { allyId, enemyId } }));
    window.dispatchEvent(new CustomEvent('combat-attack', { detail: allyId }));
  }, [entities]);

  if (arenaPhase !== 'fighting' || combatMode !== 'manual') return null;

  const enemies = entities.filter(e => !e.isAlly && e.currentHp > 0);

  return (
    <>
      {enemies.map(e => (
        <EnemyHitbox
          key={e.id}
          entity={e}
          hovered={hoveredId === e.id}
          onHover={setHoveredId}
          onClick={handleClick}
        />
      ))}
    </>
  );
}

function EnemyHitbox({
  entity,
  hovered,
  onHover,
  onClick,
}: {
  entity: ArenaEntitySnapshot;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) {
  return (
    <mesh
      position={[entity.position.x, 1.1, entity.position.z]}
      onPointerOver={(ev) => { ev.stopPropagation(); onHover(entity.id); }}
      onPointerOut={() => onHover(null)}
      onClick={(ev) => { ev.stopPropagation(); onClick(entity.id); }}
    >
      <boxGeometry args={[1.2, 2.2, 1.2]} />
      <meshBasicMaterial
        color={hovered ? '#4caf50' : '#ffffff'}
        transparent
        opacity={hovered ? 0.25 : 0}
        depthWrite={false}
      />
    </mesh>
  );
}
