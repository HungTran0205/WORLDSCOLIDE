/** Full combat arena — dedicated R3F Canvas with CSS vignette overlay */

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
import { CombatShadowLayer } from './combat-shadow-layer';

/** Target FPS — pixel art looks best at 24-30fps (Octopath style) */
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

/**
 * Drives invalidation at a capped frame rate via setInterval.
 * Lighter than rAF loop — no per-frame JS overhead between invalidations.
 * Respects debug pause state — stops interval but still invalidates once
 * when debug values change so Leva tweaks render immediately.
 */
function FrameRateLimiter() {
  const invalidate = useThree(s => s.invalidate);
  const debug = useArenaDebug();
  const paused = debug?.paused ?? false;

  // Normal tick loop — disabled when paused
  useEffect(() => {
    if (paused) return;
    const id = setInterval(invalidate, FRAME_INTERVAL);
    return () => clearInterval(id);
  }, [invalidate, paused]);

  // When paused, still invalidate once per debug value change so Leva tweaks render
  useEffect(() => {
    if (paused && debug) invalidate();
  }, [paused, debug, invalidate]);

  return null;
}

/** Reads debug context (if present) and renders post-processing with live values */

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
        camera={{ zoom: 80, position: [0, 8.4, 12], near: 0.1, far: 1000 }}
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

        {/* Dev-only overlays */}
        {import.meta.env.DEV && <Stats />}
        {import.meta.env.DEV && <DebugCameraController />}
      </Canvas>
      {/* Tilt-shift blur — blurs top 30% and bottom 30%, keeps center sharp (Octopath style) */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        maskImage: 'linear-gradient(to bottom, black 0%, transparent 28%, transparent 72%, black 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 28%, transparent 72%, black 100%)',
      }} />
      {/* Vignette overlay — darkens corners for cinematic depth */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)',
      }} />
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
