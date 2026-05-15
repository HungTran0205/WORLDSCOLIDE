/**
 * World atmospheric post-processing — single global composer driven by the
 * active room preset (via `useAtmosphere()`). Replaces `world-bloom-post.tsx`.
 *
 * Gates (any returns null):
 *   - Combat scene open → CombatBloomPost + CombatDofPost own the composer.
 *   - `atmosphericEnabled` false → preset is null; no work.
 *   - WebGPU renderer → TSL pass with Bloom + ColorGrade + Vignette + ACES
 *     (the four staple effects); DOF/GodRays/ChromAb/TiltShift remain
 *     WebGL-only pending later phases.
 *
 * Tier degradation: `graphicsQuality === 'low'` strips DOF, GodRays, and
 * ChromaticAberration. Bloom kernel reduction is handled at the bloom node
 * itself (Phase 06 may tune this further).
 *
 * Leva multipliers (bloomStrength / bloomRadius) preserve dev tuning from
 * the old `world-bloom-post` schema, but now scale the preset's intensity
 * rather than override it absolutely.
 */

import { useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useGameStore } from '@/game/state/store';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { useAtmosphere } from './use-atmosphere';
import { AtmosphericEffectStack } from './atmospheric-effect-stack';
import { AtmosphericWebGPUPass } from './atmospheric-webgpu-pass';
import { ATMOSPHERIC_LEVA_SCHEMA } from './atmospheric-leva-controls';
import type { AtmospherePreset } from './atmosphere-types';

function applyLowTier(preset: AtmospherePreset): AtmospherePreset {
  return {
    ...preset,
    dof: { ...preset.dof, enabled: false },
    godRays: preset.godRays ? { ...preset.godRays, enabled: false } : null,
    chromaticAberration: preset.chromaticAberration
      ? { ...preset.chromaticAberration, enabled: false }
      : null,
  };
}

export function WorldAtmosphericPost() {
  const gl = useThree((s) => s.gl);
  const preset = useAtmosphere();
  const shadowsEnabled = useGameStore((s) => s.settings.shadowsEnabled);
  const bloomEnabled = useGameStore((s) => s.settings.bloomEnabled);
  const graphicsQuality = useGameStore((s) => s.settings.graphicsQuality);
  const isCombatOpen = useCombatPanelStore((s) => s.isOpen);

  const overrides = useControls('Atmospheric Post', ATMOSPHERIC_LEVA_SCHEMA, { collapsed: true });

  if (isCombatOpen) return null;
  if (!preset) return null;

  const tierAdjusted = graphicsQuality === 'low' ? applyLowTier(preset) : preset;

  // User toggle from settings — zero intensity collapses bloom to a no-op for
  // both WebGL (<Bloom intensity={0}>) and WebGPU (uniform strength = 0)
  // without rebuilding either pipeline.
  const finalPreset: AtmospherePreset = bloomEnabled
    ? tierAdjusted
    : { ...tierAdjusted, bloom: { ...tierAdjusted.bloom, intensity: 0 } };

  const isWebGPU = 'isWebGPURenderer' in gl;
  if (isWebGPU) {
    return <AtmosphericWebGPUPass preset={finalPreset} overrides={overrides} />;
  }

  return (
    <AtmosphericEffectStack
      preset={finalPreset}
      shadowsEnabled={shadowsEnabled}
      overrides={overrides}
    />
  );
}
