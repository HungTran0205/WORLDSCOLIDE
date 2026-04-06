/**
 * Dev-only Leva debug panel for combat arena.
 * Provides real-time tweaking for camera, background layers, and ground.
 * All controls are gated behind import.meta.env.DEV — zero cost in production.
 */

import { createContext, useContext, useMemo, useCallback } from 'react';
import { useControls, folder, button } from 'leva';
import { useThree, useFrame } from '@react-three/fiber';
import type { BiomeConfig, Prop3D } from './arena-biome-config';

/* ---------- shared types ---------- */

export interface DebugBgLayer {
  y: number; z: number; scale: number; opacity: number;
}

export interface ArenaDebugValues {
  bgLayers: [DebugBgLayer];
  groundTileSize: number;
  vignette: { strength: number };
  lighting?: { ambientIntensity: number; directionalIntensity: number };
  props3D?: Prop3D[];
  dioramaScale?: number;
  dioramaY?: number;
  paused: boolean;
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

/** Extract short label from GLB path: '/arena/cave/.../p_stonepilla.glb' → 'p_stonepilla' */
function propLabel(src: string): string {
  return src.split('/').pop()?.replace('.glb', '') ?? src;
}

/** Download a JSON blob as a file */
function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Mounts Leva controls initialized from current biome config. */
export function ArenaDebugProvider({ config, children }: ProviderProps) {
  const [far] = config.bgLayers;

  /* Single useControls call — folder() must nest inside a schema object */
  const ctrl = useControls({
    'BG Far': folder({
      farY:       { value: far?.y      ?? 0.0,  min: -15, max: 15,  step: 0.1  },
      farZ:       { value: far?.z      ?? -1, min: -20, max: 10,  step: 0.1  },
      farScale:   { value: far?.scale  ?? 0.65,  min: 0.1, max: 5,   step: 0.05 },
      farOpacity: { value: far?.opacity ?? 0.45, min: 0,   max: 1,   step: 0.01 },
    }),
    'Ground': folder({
      groundTileSize: { value: 1.75, min: 0.5, max: 15, step: 0.25, label: 'tile size (world units)' },
    }),
    'Vignette': folder({
      vignetteStrength: { value: 0.99, min: 0, max: 1.5, step: 0.01 },
    }),
    'Lighting': folder({
      ambientIntensity: { value: config.ambient.intensity, min: 0, max: 3, step: 0.05, label: 'ambient' },
      directionalIntensity: { value: config.directional.intensity, min: 0, max: 3, step: 0.05, label: 'directional' },
    }),
  });

  /* --- 3D props debug controls (only when biome has props3D) --- */
  const propsSchema: Record<string, ReturnType<typeof folder>> = {};
  if (config.diorama) {
    propsSchema['Diorama'] = folder({
      dioramaScale: { value: config.dioramaScale ?? 1, min: 1, max: 30, step: 0.5, label: 'scale' },
      dioramaY: { value: config.dioramaY ?? 0, min: -10, max: 5, step: 0.1, label: 'Y offset' },
    }, { collapsed: true });
  }
  if (config.props3D) {
    config.props3D.forEach((prop, i) => {
      const s = typeof prop.scale === 'number' ? prop.scale : prop.scale[0];
      propsSchema[`${i}: ${propLabel(prop.src)}`] = folder({
        [`p${i}X`]:     { value: prop.position[0], min: -15, max: 15, step: 0.1 },
        [`p${i}Y`]:     { value: prop.position[1], min: -5,  max: 10, step: 0.1 },
        [`p${i}Z`]:     { value: prop.position[2], min: -10, max: 10, step: 0.1 },
        [`p${i}RotY`]:  { value: prop.rotation?.[1] ?? 0, min: -Math.PI, max: Math.PI, step: 0.05 },
        [`p${i}Scale`]: { value: s, min: 0.01, max: 2, step: 0.01 },
      }, { collapsed: true });
    });
  }
  const propsCtrl = useControls('3D Props', propsSchema);

  /* --- Build current debug snapshot for export (includes ALL tunable values) --- */
  const buildSnapshot = useCallback(() => {
    const pv = propsCtrl as unknown as Record<string, number>;
    const snapshot: Record<string, unknown> = {
      biome: config.biome,
      bgLayers: [
        { src: config.bgLayers[0]?.src, y: ctrl.farY, z: ctrl.farZ, scale: ctrl.farScale, opacity: ctrl.farOpacity },
      ],
      ambient: { intensity: ctrl.ambientIntensity, color: config.ambient.color },
      directional: { intensity: ctrl.directionalIntensity, color: config.directional.color, position: config.directional.position },
      vignette: { strength: ctrl.vignetteStrength },
      groundTileSize: ctrl.groundTileSize,
      dioramaScale: pv.dioramaScale ?? config.dioramaScale,
      dioramaY: pv.dioramaY ?? config.dioramaY ?? 0,
    };
    if (config.props3D) {
      snapshot.props3D = config.props3D.map((prop, i) => ({
        src: prop.src,
        position: [pv[`p${i}X`] ?? prop.position[0], pv[`p${i}Y`] ?? prop.position[1], pv[`p${i}Z`] ?? prop.position[2]],
        rotation: [prop.rotation?.[0] ?? 0, pv[`p${i}RotY`] ?? 0, prop.rotation?.[2] ?? 0],
        scale: pv[`p${i}Scale`] ?? (typeof prop.scale === 'number' ? prop.scale : prop.scale[0]),
        ...(prop.light  && { light:  prop.light  }),
        ...(prop.sprite && { sprite: prop.sprite }),
      }));
    }
    return snapshot;
  }, [ctrl, propsCtrl, config]);

  /* --- Pause toggle + Export action --- */
  const { pauseCombat } = useControls('Actions', {
    pauseCombat: { value: false, label: 'Pause Combat' },
  });
  useControls('Actions', {
    'Export Config JSON': button(() => {
      const snapshot = buildSnapshot();
      downloadJson(`arena-debug-${config.biome}-${Date.now()}.json`, snapshot);
      console.log('[ArenaDebug] Exported config:', JSON.stringify(snapshot, null, 2));
    }),
  });

  const value = useMemo<ArenaDebugValues>(() => {
    const base: ArenaDebugValues = {
      bgLayers: [
        { y: ctrl.farY, z: ctrl.farZ, scale: ctrl.farScale, opacity: ctrl.farOpacity },
      ],
      groundTileSize:  ctrl.groundTileSize,
      vignette: { strength: ctrl.vignetteStrength },
      lighting: { ambientIntensity: ctrl.ambientIntensity, directionalIntensity: ctrl.directionalIntensity },
      paused: pauseCombat,
    };

    // Reconstruct props3D from Leva values — cast once to avoid repeated unsafe casts
    if (config.props3D) {
      const pv = propsCtrl as unknown as Record<string, number>;
      base.dioramaScale = pv.dioramaScale ?? config.dioramaScale;
      base.dioramaY = pv.dioramaY ?? config.dioramaY ?? 0;
      base.props3D = config.props3D.map((prop, i) => ({
        src: prop.src,
        position: [
          pv[`p${i}X`] ?? prop.position[0],
          pv[`p${i}Y`] ?? prop.position[1],
          pv[`p${i}Z`] ?? prop.position[2],
        ] as [number, number, number],
        rotation: [
          prop.rotation?.[0] ?? 0,
          pv[`p${i}RotY`] ?? 0,
          prop.rotation?.[2] ?? 0,
        ] as [number, number, number],
        scale: pv[`p${i}Scale`] ?? (typeof prop.scale === 'number' ? prop.scale : prop.scale[0]),
        // Preserve light and sprite — debug only tunes position/rotation/scale
        ...(prop.light  && { light:  prop.light  }),
        ...(prop.sprite && { sprite: prop.sprite }),
      }));
    }

    return base;
  }, [ctrl, propsCtrl, config, pauseCombat]);

  return <ArenaDebugCtx.Provider value={value}>{children}</ArenaDebugCtx.Provider>;
}

/* ---------- camera controller (lives inside Canvas) ---------- */

/**
 * Mounts camera controls via Leva and applies them each frame.
 * Must be rendered as a child of <Canvas>.
 */
export function DebugCameraController() {
  const camera = useThree(s => s.camera);

  // camY/camZ at 8.4/12.0 → atan(8.4/12) ≈ 35° elevation angle
  // X is omitted — managed by CombatFightController camera follow
  const { zoom, camY, camZ } = useControls('View', {
    zoom: { value: 80,  min: 30,  max: 400, step: 1,   label: 'zoom'   },
    camY: { value: 8.4, min: 0,   max: 30,  step: 0.1, label: 'pos Y'  },
    camZ: { value: 12.0, min: 1,  max: 40,  step: 0.1, label: 'pos Z'  },
  });

  useFrame(() => {
    camera.zoom = zoom;
    camera.position.y = camY;
    camera.position.z = camZ;
    camera.updateProjectionMatrix();
  });

  return null;
}
