/** Full combat arena — dedicated R3F Canvas with CSS vignette overlay */

import { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { CombatArenaEnvironment } from './combat-arena-environment';
import { CombatFightController, getCombatRenderState } from './combat-fight-controller';
import { getBiomeConfig } from './arena-biome-config';
import { createWebGPURenderer, WebGPUInit } from './webgpu-init';
import { ArenaDebugProvider, DebugCameraController, useArenaDebug } from './combat-arena-debug';
import { CombatShadowLayer } from './combat-shadow-layer';
// New instanced rendering components (Phase 01-03)
import { InstancedSpriteRenderer } from './combat/instanced-sprite-renderer';
import { InstancedHpBars } from './combat/instanced-hp-bars';
import { CombatTextLayer } from './combat/combat-text-layer';
import { DamageNumberPool } from './combat/damage-number-pool';
import type { DamageNumberPoolHandle } from './combat/damage-number-pool';
import { CombatBloomPost } from './combat-bloom-post';
import { CombatSlashPool } from './combat-slash-pool';
import type { CombatSlashPoolHandle } from './combat-slash-pool';
import { CombatArrowPool } from './combat-arrow-pool';
import type { CombatArrowPoolHandle } from './combat-arrow-pool';

/** Target FPS — pixel art looks best at 24-30fps (Octopath style) */
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

/**
 * Drives invalidation at a capped frame rate via setInterval.
 * Lighter than rAF loop — no per-frame JS overhead between invalidations.
 */
function FrameRateLimiter() {
  const invalidate = useThree(s => s.invalidate);
  const debug = useArenaDebug();
  const paused = debug?.paused ?? false;

  useEffect(() => {
    if (paused) return;
    const id = setInterval(invalidate, FRAME_INTERVAL);
    return () => clearInterval(id);
  }, [invalidate, paused]);

  useEffect(() => {
    if (paused && debug) invalidate();
  }, [paused, debug, invalidate]);

  return null;
}

/**
 * Instanced combat renderer — replaces per-entity CombatEntitySprite mapping.
 * Reads render state from CombatFightController and renders:
 * - ALL sprites in 1 draw call (InstancedSpriteRenderer)
 * - ALL HP bars in 2 draw calls (InstancedHpBars)
 * - Entity names via troika SDF text (~1 draw call)
 * - Damage numbers via pooled troika text
 */
function InstancedCombatRenderer({
  damagePoolRef,
  slashPoolRef,
  arrowPoolRef,
}: {
  damagePoolRef: React.RefObject<DamageNumberPoolHandle | null>;
  slashPoolRef: React.RefObject<CombatSlashPoolHandle | null>;
  arrowPoolRef: React.RefObject<CombatArrowPoolHandle | null>;
}) {
  const renderState = getCombatRenderState();

  if (!renderState) {
    // Atlas not ready yet — show nothing (brief loading moment)
    return null;
  }

  const { bridge, atlasTextures, registry } = renderState;

  return (
    <>
      <InstancedSpriteRenderer
        stateBuffer={bridge.buffer}
        registry={registry}
        atlasTextures={atlasTextures}
      />
      <InstancedHpBars stateBuffer={bridge.buffer} />
      <CombatTextLayer stateBuffer={bridge.buffer} />
      <DamageNumberPool ref={damagePoolRef} />
      <CombatSlashPool ref={slashPoolRef} />
      <CombatArrowPool ref={arrowPoolRef} />
    </>
  );
}

export function CombatArenaCanvas() {
  const entities = useGameStore(s => s.arenaEntities);
  const missionId = useGameStore(s => s.arenaMissionId);
  const damagePoolRef = useRef<DamageNumberPoolHandle | null>(null);
  const slashPoolRef = useRef<CombatSlashPoolHandle | null>(null);
  const arrowPoolRef = useRef<CombatArrowPoolHandle | null>(null);

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
        camera={{ zoom: 76, position: [0, 11.7, 12], near: 0.1, far: 1000 }}
        dpr={1}
        gl={createWebGPURenderer}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <WebGPUInit />
        <FrameRateLimiter />
        <CombatFightController
          damagePoolRef={damagePoolRef}
          slashPoolRef={slashPoolRef}
          arrowPoolRef={arrowPoolRef}
        />
        <color attach="background" args={[biome.fogColor]} />

        <Suspense fallback={null}>
          <CombatArenaEnvironment zone={zone} />
          {/* Shadows still use store entities (static enough for throttled sync) */}
          <CombatShadowLayer entities={entities} />
          {/* New instanced renderers — driven by AnimationStateBuffer */}
          <InstancedCombatRenderer
            damagePoolRef={damagePoolRef}
            slashPoolRef={slashPoolRef}
            arrowPoolRef={arrowPoolRef}
          />
          {/* Bloom postprocessing — mounts last so it sees the finished frame */}
          <CombatBloomPost />
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
        background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${biome.vignette?.strength ?? 0.65}) 100%)`,
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
