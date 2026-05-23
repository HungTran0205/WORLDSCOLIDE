/**
 * Combat WebGPU post — mounts the shared atmospheric TSL pass over the combat
 * scene so BG + sprites + ground are unified by bloom / tilt-shift / color-grade
 * / vignette / ACES (the HD-2D "glue").
 *
 * Before this, combat had ZERO post-processing on WebGPU: WorldAtmosphericPost
 * bails when combat opens (`isCombatOpen` guard) and CombatDofPost is WebGL-only
 * — so the three layers rendered as disjoint "pasted" planes.
 *
 * Composer-slot invariant: WorldAtmosphericPost returns null while combat is
 * open, so exactly one `PostProcessing` composer is ever active. This component
 * mounts only inside <CombatScene> (i.e. while combat is open) and only on
 * WebGPU; the WebGL combat path keeps <CombatDofPost>. The pass reads the
 * default camera, which is the combat ortho cam (`makeDefault` in world.tsx)
 * while combat is open — so `pass(scene, camera)` frames the combat scene with
 * no change to the pass internals.
 *
 * Pixelation is forced OFF (granularity 1): BG stays smooth so pixel sprites pop
 * (HD-2D), and already-pixel-art sprites aren't double-pixelated.
 */

import { useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useGameStore } from '@/game/state/store';
import { AtmosphericWebGPUPass } from '@/scene/atmospheric/atmospheric-webgpu-pass';
import { COMBAT_PRESET } from './combat-atmosphere-preset';
import type { AtmospherePreset } from '@/scene/atmospheric/atmosphere-types';

/** Combat keeps the BG smooth — never pixelate (sprites are already pixel art). */
const COMBAT_PIXEL_GRANULARITY = 1;

export function CombatWebGpuPost() {
  const gl = useThree((s) => s.gl);
  const bloomEnabled = useGameStore((s) => s.settings.bloomEnabled);

  // Dedicated tuning group — keeps combat tuning decoupled from the guild
  // 'Atmospheric Post' schema. Multipliers over COMBAT_PRESET (same semantics
  // as the guild overrides consumed by AtmosphericWebGPUPass).
  const overrides = useControls(
    'Combat / Post',
    {
      bloomStrength: { value: 1.0, min: 0, max: 3, step: 0.05, label: 'bloom × intensity' },
      bloomRadius: { value: 1.0, min: 0, max: 2, step: 0.05, label: 'bloom × radius' },
    },
    { collapsed: true },
  );

  // @react-three/postprocessing (WebGL) can't drive a WebGPU renderer. The TSL
  // pass IS the WebGPU path; on WebGL, CombatDofPost owns the composer instead.
  if (!('isWebGPURenderer' in gl)) return null;

  // Bloom user-toggle: zero intensity collapses bloom to a no-op without
  // rebuilding the pipeline (matches WorldAtmosphericPost's approach).
  const preset: AtmospherePreset = bloomEnabled
    ? COMBAT_PRESET
    : { ...COMBAT_PRESET, bloom: { ...COMBAT_PRESET.bloom, intensity: 0 } };

  return (
    <AtmosphericWebGPUPass
      preset={preset}
      overrides={overrides}
      pixelGranularity={COMBAT_PIXEL_GRANULARITY}
    />
  );
}
