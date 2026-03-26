/** Full combat arena — dedicated R3F Canvas with CSS-based HD-2D effects */

import { Suspense, useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { CombatArenaEnvironment } from './combat-arena-environment';
import { CombatEntitySprite } from './combat-entity-sprite';
import { CombatFightController } from './combat-fight-controller';
import { CombatVfxLayer } from './combat-vfx-layer';
import { getBiomeConfig } from './arena-biome-config';

/** Target FPS — pixel art looks best at 24-30fps (Octopath style) */
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

/**
 * Drives invalidation at a capped frame rate via setInterval.
 * Lighter than rAF loop — no per-frame JS overhead between invalidations.
 */
function FrameRateLimiter() {
  const invalidate = useThree(s => s.invalidate);

  useEffect(() => {
    const id = setInterval(invalidate, FRAME_INTERVAL);
    return () => clearInterval(id);
  }, [invalidate]);

  return null;
}

/** CSS vignette — static layer, will-change avoids repaint cost */
const VIGNETTE_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, width: '100%', height: '100%',
  pointerEvents: 'none',
  zIndex: 1,
  willChange: 'transform',
  background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
};

export function CombatArenaCanvas() {
  const entities = useGameStore(s => s.arenaEntities);
  const missionId = useGameStore(s => s.arenaMissionId);

  const zone = useMemo(() => {
    if (!missionId) return undefined;
    return MISSIONS.find(m => m.id === missionId)?.zone;
  }, [missionId]);

  const biome = useMemo(() => getBiomeConfig(zone), [zone]);

  return (
    <>
      <Canvas
        frameloop="demand"
        orthographic
        camera={{ zoom: 120, position: [0, 7, 10], near: 0.1, far: 1000 }}
        dpr={1}
        gl={{ antialias: false, powerPreference: 'low-power' }}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <FrameRateLimiter />
        <CombatFightController />
        <color attach="background" args={[biome.fogColor]} />

        <Suspense fallback={null}>
          <CombatArenaEnvironment zone={zone} />
          {entities.map(entity => (
            <CombatEntitySprite key={entity.id} entity={entity} />
          ))}
          <CombatVfxLayer />
        </Suspense>

        {/* FPS monitor — dev only */}
        {import.meta.env.DEV && <Stats />}
      </Canvas>

      {/* CSS vignette — no GPU render passes needed */}
      <div style={VIGNETTE_STYLE} />
    </>
  );
}
