/**
 * Iterates the arena entity snapshot list and mounts a `<CombatIdleSprite />`
 * per entity. Render is keyed on entity.id so wave spawns mount cleanly and
 * removed entities unmount (releasing their textures via React Three Fiber's
 * standard dispose).
 *
 * Wrapped in <Suspense> by the parent CombatScene so per-entity texture loads
 * (useLoader inside CombatIdleSprite) can fall back gracefully on first mount.
 */

import { useGameStore } from '@/game/state/store';
import { CombatIdleSprite } from './combat-idle-sprite';

export function CombatEntityLayer() {
  const entities = useGameStore((s) => s.arenaEntities);
  if (entities.length === 0) return null;

  return (
    <>
      {entities.map((entity) => (
        <CombatIdleSprite key={entity.id} entity={entity} />
      ))}
    </>
  );
}
