/** Full combat arena — dedicated R3F Canvas replacing World during combat */

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '@/game/state/store';
import { CombatArenaEnvironment } from './combat-arena-environment';
import { CombatEntitySprite } from './combat-entity-sprite';
import { CombatFightController } from './combat-fight-controller';
import { CombatVfxLayer } from './combat-vfx-layer';
export function CombatArenaCanvas() {
  const entities = useGameStore(s => s.arenaEntities);

  return (
    <Canvas
      frameloop="always"
      orthographic
      camera={{ zoom: 60, position: [0, 7, 10], near: 0.1, far: 1000 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <CombatFightController />
      <Suspense fallback={null}>
        <CombatArenaEnvironment />
        {entities.map(entity => (
          <CombatEntitySprite key={entity.id} entity={entity} />
        ))}
        <CombatVfxLayer />
      </Suspense>
    </Canvas>
  );
}
