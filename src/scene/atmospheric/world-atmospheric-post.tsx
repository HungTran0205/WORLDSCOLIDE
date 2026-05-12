/**
 * World atmospheric post-processing — single global composer driven by the
 * active room preset (via `useAtmosphere()`). Replaces `world-bloom-post.tsx`.
 *
 * Gates (any returns null):
 *   - Combat scene open → CombatBloomPost + CombatDofPost own the composer.
 *   - `atmosphericEnabled` false → preset is null; no work.
 *   - WebGPU renderer → falls back to bloom-only TSL pass (parity gap in
 *     @react-three/postprocessing 3.0.4).
 *
 * Tier degradation: `graphicsQuality === 'low'` strips DOF, GodRays, and
 * ChromaticAberration. Bloom kernel reduction is handled at the bloom node
 * itself (Phase 06 may tune this further).
 *
 * Leva multipliers (bloomStrength / bloomRadius) preserve dev tuning from
 * the old `world-bloom-post` schema, but now scale the preset's intensity
 * rather than override it absolutely.
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { useGameStore } from '@/game/state/store';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { useAtmosphere } from './use-atmosphere';
import { AtmosphericEffectStack } from './atmospheric-effect-stack';
import { AtmosphericWebGPUPass } from './atmospheric-webgpu-pass';
import { ATMOSPHERIC_LEVA_SCHEMA } from './atmospheric-leva-controls';
import type { AtmospherePreset } from './atmosphere-types';

let webgpuParityWarned = false;

/** WebGPU path — Bloom only. Logs a one-time parity-gap warning so devs know
 *  why the rest of the stack isn't visible on WebGPU (plan-required). */
function WebGPUWithParityWarning({
  finalPreset,
  overrides,
}: {
  finalPreset: AtmospherePreset;
  overrides: { bloomStrength: number; bloomRadius: number };
}) {
  useEffect(() => {
    if (webgpuParityWarned) return;
    webgpuParityWarned = true;
    console.warn(
      '[atmospheric] WebGPU renderer detected — full HD-2D effect stack ' +
        '(DOF, TiltShift, Vignette, ColorGrade, ChromaticAberration, GodRays, ' +
        'ToneMapping) is not available via TSL in @react-three/postprocessing 3.0.4. ' +
        'Falling back to Bloom only. Switch to WebGL for the full preset.',
    );
  }, []);
  return <AtmosphericWebGPUPass preset={finalPreset} overrides={overrides} />;
}

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
  const bloomThreshold = useGameStore((s) => s.settings.bloomThreshold);
  const graphicsQuality = useGameStore((s) => s.settings.graphicsQuality);
  const isCombatOpen = useCombatPanelStore((s) => s.isOpen);

  const overrides = useControls('Atmospheric Post', ATMOSPHERIC_LEVA_SCHEMA, { collapsed: true });

  if (isCombatOpen) return null;
  if (!preset) return null;

  const tierAdjusted = graphicsQuality === 'low' ? applyLowTier(preset) : preset;

  // Honor existing user-tunable bloom threshold setting (overrides preset).
  // Keeps backward-compat for users who set this manually pre-atmospheric.
  const finalPreset: AtmospherePreset = {
    ...tierAdjusted,
    bloom: { ...tierAdjusted.bloom, threshold: bloomThreshold },
  };

  const isWebGPU = 'isWebGPURenderer' in gl;
  if (isWebGPU) {
    return (
      <WebGPUWithParityWarning
        finalPreset={finalPreset}
        overrides={overrides}
      />
    );
  }

  return (
    <AtmosphericEffectStack
      preset={finalPreset}
      shadowsEnabled={shadowsEnabled}
      overrides={overrides}
    />
  );
}
