import { Suspense, useEffect, useRef, createContext, useContext, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useThree, useFrame } from '@react-three/fiber';
import { GuildHall } from './guild-hall/guild-hall';
import { MemberLayer } from './member-layer';
import { CameraController } from './camera-controller';
import { FacilityRoomsLayer } from './facility/facility-rooms-layer';
import { createWebGPURenderer, WebGPUInit } from './webgpu-init';
import { WorldPostProcessing } from './world-bloom-post';
import { getStoredGraphicsQuality } from '@/game/state/guild-slice';
import { useGameStore } from '@/game/state/store';
import { FACILITY_SLOTS } from '@/game/data/facility-slot-positions';

export type GraphicsQuality = 'high' | 'low';
const QualityContext = createContext<GraphicsQuality>('high');
export const useGraphicsQuality = () => useContext(QualityContext);

/** Nulls out scene.background so the CSS cave image shows through the canvas */
function TransparentBackground() {
  const { scene } = useThree();
  useEffect(() => { scene.background = null; }, [scene]);
  return null;
}

/**
 * Prevents the "freeze + rapid catchup" bug in three scenarios:
 *
 * 1. Initial load: WebGPU init + asset loading blocks for 5-10s. THREE.Clock
 *    accumulates wall-time. First useFrame receives huge delta → frame bunching.
 *
 * 2. Tab hidden → resumed: browser throttles rAF so THREE.Clock accumulates
 *    wall-time. On resume, getDelta() returns 5-10s → animation/particle
 *    catchup sprint.
 *
 * 3. Scene switch (combat → guild-hall): World is CSS-hidden during combat so
 *    rAF is paused (frameloop="demand" when !isActive), but THREE.Clock still
 *    runs wall-time. When World re-activates, same large delta problem.
 *
 * Fix: call clock.getDelta() once to drain the accumulated gap before the
 * first rendered frame uses it. Priority -100 ensures this runs before all
 * animation useFrames (default priority 0).
 */
function VisibilityGuard({ isActive }: { isActive: boolean }) {
  const { clock } = useThree();
  const prevActiveRef = useRef(isActive);
  const firstFrameRef = useRef(true);

  // Case 1: initial load — drain on very first frame before any animation runs
  useFrame(() => {
    if (!firstFrameRef.current) return;
    firstFrameRef.current = false;
    clock.getDelta();
  }, -100);

  // Case 2: tab hidden → visible
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) clock.getDelta();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [clock]);

  // Case 3: scene switch → World re-activates
  useEffect(() => {
    if (isActive && !prevActiveRef.current) {
      clock.getDelta(); // drain accumulated wall-time from combat phase
    }
    prevActiveRef.current = isActive;
  }, [isActive, clock]);

  return null;
}

/** Overlay shown while 3D assets are loading on initial mount */
function WorldLoadingOverlay() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0d0a08',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      pointerEvents: 'none',
    }}>
      <span style={{ color: '#c8a96e', fontFamily: 'serif', fontSize: '14px', letterSpacing: '0.15em', opacity: 0.8 }}>
        Loading...
      </span>
    </div>
  );
}

/** Renders only after all Suspense siblings have finished loading — signals scene ready */
function SceneReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady(); }, [onReady]);
  return null;
}

/** Dims global ambient + directional light when camera is inside the alchemy lab */
function SceneLighting() {
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const facilities = useGameStore((s) => s.facilities);
  const isInAlchemy = facilities.some(f => {
    if (f.type !== 'alchemy-lab' || f.placedSlot == null) return false;
    const [fx, , fz] = FACILITY_SLOTS[f.placedSlot];
    return Math.abs(cameraTarget[0] - fx) <= 3.5 && Math.abs(cameraTarget[2] - fz) <= 3.5;
  });
  return (
    <>
      <ambientLight intensity={isInAlchemy ? 0.08 : 0.6} />
      <directionalLight position={[5, 10, 5]} intensity={isInAlchemy ? 0.1 : 0.8} />
    </>
  );
}

export interface WorldProps {
  /** When false, pauses the render loop (saves GPU during combat). Clock drain
   *  is handled by VisibilityGuard on re-activation. Default: true. */
  isActive?: boolean;
}

/** Main 3D world — isometric guild hall view */
export function World({ isActive = true }: WorldProps) {
  // Read once at mount — dpr can't change on a live Canvas, so quality change = reload pattern.
  const quality = getStoredGraphicsQuality();
  // Tracks whether initial WebGPU init + asset loading has completed.
  // Stays true after first load — assets are cached so no loading on scene switch.
  const [assetsReady, setAssetsReady] = useState(false);
  const onAssetsReady = useCallback(() => setAssetsReady(true), []);

  return (
    <QualityContext.Provider value={quality}>
      {/* Show loading overlay until scene is ready, only when guild hall is visible */}
      {!assetsReady && isActive && <WorldLoadingOverlay />}
      <Canvas
        frameloop={isActive ? 'always' : 'demand'}
        orthographic
        camera={{ zoom: 65, position: [15, 10, 14], near: 0.1, far: 1000 }}
        dpr={quality === 'low' ? [0.75, 1] : [1, 1.5]}
        gl={createWebGPURenderer}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <WebGPUInit />
        <TransparentBackground />
        <VisibilityGuard isActive={isActive} />
        <SceneLighting />

        <CameraController />
        <Suspense fallback={null}>
          <GuildHall />
          <FacilityRoomsLayer />
          <MemberLayer />
          <WorldPostProcessing />
          <SceneReadySignal onReady={onAssetsReady} />
        </Suspense>
      </Canvas>
    </QualityContext.Provider>
  );
}
