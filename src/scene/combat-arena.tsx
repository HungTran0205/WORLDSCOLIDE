/** Full combat arena — dedicated R3F Canvas with HD-2D post-processing */

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
import { createWebGPURenderer, WebGPUInit } from './webgpu-init';
import { ArenaDebugProvider, DebugCameraController, useArenaDebug } from './combat-arena-debug';
import { CombatPostProcessing } from './combat-post-processing';
import { CombatShadowLayer } from './combat-shadow-layer';

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

/** Reads debug context (if present) and renders post-processing with live values */
function PostProcessing() {
  const debug = useArenaDebug();
  return <CombatPostProcessing vignetteStrength={debug?.vignette.strength} />;
}

export function CombatArenaCanvas() {
  const entities = useGameStore(s => s.arenaEntities);
  const missionId = useGameStore(s => s.arenaMissionId);

  const zone = useMemo(() => {
    if (!missionId) return undefined;
    return MISSIONS.find(m => m.id === missionId)?.zone;
  }, [missionId]);

  const biome = useMemo(() => getBiomeConfig(zone), [zone]);

  const canvas = (
    <>
      <Canvas
        frameloop="demand"
        orthographic
        shadows
        camera={{ zoom: 121, position: [0, 3.2, 11.8], near: 0.1, far: 1000 }}
        dpr={1}
        gl={createWebGPURenderer}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <WebGPUInit />
        <FrameRateLimiter />
        <CombatFightController />
        <color attach="background" args={[biome.fogColor]} />

        <Suspense fallback={null}>
          <CombatArenaEnvironment zone={zone} />
          <CombatShadowLayer entities={entities} />
          {entities.map(entity => (
            <CombatEntitySprite key={entity.id} entity={entity} />
          ))}
          <CombatVfxLayer />
        </Suspense>

        <PostProcessing />

        {/* Dev-only overlays */}
        {import.meta.env.DEV && <Stats />}
        {import.meta.env.DEV && <DebugCameraController />}
      </Canvas>
    </>
  );

  /* Wrap in Leva provider for dev; key resets controls when biome changes */
  if (import.meta.env.DEV) {
    return (
      <ArenaDebugProvider key={biome.biome} config={biome}>
        {canvas}
      </ArenaDebugProvider>
    );
  }

  return canvas;
}
