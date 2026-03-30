/**
 * Dev-only Leva debug panel for combat arena.
 * Provides real-time tweaking for camera, background layers, and ground.
 * All controls are gated behind import.meta.env.DEV — zero cost in production.
 */

import { createContext, useContext, useMemo } from 'react';
import { useControls, folder } from 'leva';
import { useThree, useFrame } from '@react-three/fiber';
import type { BiomeConfig } from './arena-biome-config';

/* ---------- shared types ---------- */

export interface DebugBgLayer {
  y: number; z: number; scale: number; opacity: number;
}

export interface ArenaDebugValues {
  bgLayers: [DebugBgLayer, DebugBgLayer, DebugBgLayer];
  groundTileSize: number;
  vignette: { strength: number };
}

/* ---------- context ---------- */

export const ArenaDebugCtx = createContext<ArenaDebugValues | null>(null);

/** Read debug overrides from context — returns null outside dev provider */
export function useArenaDebug(): ArenaDebugValues | null {
  return useContext(ArenaDebugCtx);
}

/* ---------- provider (lives outside Canvas) ---------- */

interface ProviderProps {
  config: BiomeConfig;
  children: React.ReactNode;
}

/** Mounts Leva controls initialized from current biome config. */
export function ArenaDebugProvider({ config, children }: ProviderProps) {
  const [far, mid, near] = config.bgLayers;

  /* Single useControls call — folder() must nest inside a schema object */
  const ctrl = useControls({
    'BG Far': folder({
      farY:       { value: far?.y      ?? 0.0,  min: -15, max: 15,  step: 0.1  },
      farZ:       { value: far?.z      ?? -1, min: -20, max: 10,  step: 0.1  },
      farScale:   { value: far?.scale  ?? 0.65,  min: 0.1, max: 5,   step: 0.05 },
      farOpacity: { value: far?.opacity ?? 0.45, min: 0,   max: 1,   step: 0.01 },
    }),
    'BG Mid': folder({
      midY:       { value: mid?.y      ?? 2,  min: -15, max: 15,  step: 0.1  },
      midZ:       { value: mid?.z      ?? -1, min: -20, max: 10,  step: 0.1  },
      midScale:   { value: mid?.scale  ?? 0.95,  min: 0.1, max: 5,   step: 0.05 },
      midOpacity: { value: mid?.opacity ?? 0.79, min: 0,   max: 1,   step: 0.01 },
    }),
    'BG Near': folder({
      nearY:       { value: near?.y      ?? 7.1,  min: -15, max: 15,  step: 0.1  },
      nearZ:       { value: near?.z      ?? 6.0, min: -20, max: 15,  step: 0.1  },
      nearScale:   { value: near?.scale  ?? 1.50,  min: 0.1, max: 5,   step: 0.05 },
      nearOpacity: { value: near?.opacity ?? 0.70, min: 0,   max: 1,   step: 0.01 },
    }),
    'Ground': folder({
      groundTileSize: { value: 1.75, min: 0.5, max: 15, step: 0.25, label: 'tile size (world units)' },
    }),
    'Vignette': folder({
      vignetteStrength: { value: 0.99, min: 0, max: 1.5, step: 0.01 },
    }),
  });

  const value = useMemo<ArenaDebugValues>(() => ({
    bgLayers: [
      { y: ctrl.farY,  z: ctrl.farZ,  scale: ctrl.farScale,  opacity: ctrl.farOpacity  },
      { y: ctrl.midY,  z: ctrl.midZ,  scale: ctrl.midScale,  opacity: ctrl.midOpacity  },
      { y: ctrl.nearY, z: ctrl.nearZ, scale: ctrl.nearScale, opacity: ctrl.nearOpacity },
    ],
    groundTileSize:  ctrl.groundTileSize,
    vignette: { strength: ctrl.vignetteStrength },
  }), [ctrl]);

  return <ArenaDebugCtx.Provider value={value}>{children}</ArenaDebugCtx.Provider>;
}

/* ---------- camera controller (lives inside Canvas) ---------- */

/**
 * Mounts camera controls via Leva and applies them each frame.
 * Must be rendered as a child of <Canvas>.
 */
export function DebugCameraController() {
  const camera = useThree(s => s.camera);

  const { zoom, camY, camZ } = useControls('Camera', {
    zoom: { value: 137, min: 30,  max: 400, step: 1,   label: 'zoom'   },
    camY: { value: 8.8,   min: 0,   max: 30,  step: 0.1, label: 'pos Y'  },
    camZ: { value: 8.2,  min: 1,   max: 40,  step: 0.1, label: 'pos Z'  },
  });

  useFrame(() => {
    camera.zoom = zoom;
    camera.position.y = camY;
    camera.position.z = camZ;
    camera.updateProjectionMatrix();
  });

  return null;
}
