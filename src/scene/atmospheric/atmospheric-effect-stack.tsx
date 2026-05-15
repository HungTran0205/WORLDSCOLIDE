/**
 * WebGL atmospheric effect chain — children of EffectComposer.
 *
 * Order is intentional and MUST NOT be reshuffled without re-profiling:
 *   N8AO (AO into color buffer, gated by shadows setting)
 *     → DepthOfField (per-room focus zone, dynamic target ref)
 *     → TiltShift (HD-2D diorama band)
 *     → Bloom (with leva-multiplier preserved for dev sweeps)
 *     → GodRays (per-room hero light, registered via god-rays registry)
 *     → HueSaturation + BrightnessContrast (color grade — LUT3DEffect
 *        unavailable in @react-three/postprocessing 3.0.4)
 *     → Vignette
 *     → Noise (film grain)
 *     → ChromaticAberration (opt-in per preset)
 *     → ToneMapping ACES_FILMIC (MUST be last — compresses HDR to LDR)
 *
 * DOF target tracks `cameraTarget` via a shared Vector3 ref updated each
 * frame; this gives smooth focus transitions on room change for free (the
 * cameraTarget itself already lerps).
 *
 * Phase 4 prereq (KNOWN): @react-three/postprocessing 3.0.4 wraps each
 * effect with `useMemo([JSON.stringify(props)])` (see node_modules
 * `wrapEffect`). Numeric prop changes during a preset lerp will re-create
 * the underlying Effect instance every frame, churning GPU resources. Phase
 * 4 introduces diverging per-room values, so before Phase 4 ships we need
 * to either (a) drive uniforms imperatively via refs + useFrame, or (b)
 * snap discrete preset values at lerp end and ramp via dedicated
 * intensity uniforms only. Phase 2 baseline (constant values) is unaffected.
 */

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  N8AO,
  DepthOfField,
  TiltShift,
  HueSaturation,
  BrightnessContrast,
  Vignette,
  Noise,
  ChromaticAberration,
  ToneMapping,
  GodRays,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useGameStore } from '@/game/state/store';
import type { AtmospherePreset } from './atmosphere-types';
import { getGodRaysSource } from './use-god-rays-source-registry';
import type { AtmosphericLevaOverrides } from './atmospheric-leva-controls';

export interface AtmosphericEffectStackProps {
  preset: AtmospherePreset;
  shadowsEnabled: boolean;
  overrides: AtmosphericLevaOverrides;
}

export function AtmosphericEffectStack({ preset, shadowsEnabled, overrides }: AtmosphericEffectStackProps) {
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const dofTargetVec = useMemo(() => new THREE.Vector3(), []);

  // DOF dynamic target — sync each frame. cameraTarget already lerps in the
  // camera controller, so the DOF focus point inherits the smooth transition
  // for free, no preset-level focusDistance lerp needed.
  useFrame(() => {
    if (!preset.dof.enabled) return;
    const off = preset.dof.targetOffset ?? [0, 0, 0];
    dofTargetVec.set(
      cameraTarget[0] + off[0],
      cameraTarget[1] + off[1],
      cameraTarget[2] + off[2],
    );
  });

  // GodRays needs a Mesh|Points; registry is populated in Phase 05. For Phase
  // 02 this will be null (skipped silently) for every room.
  const godRaysSource =
    preset.godRays?.enabled
      ? (getGodRaysSource(preset.godRays.sourceId) as THREE.Mesh | THREE.Points | null)
      : null;

  // `EffectComposer.children` is strictly typed `JSX.Element | JSX.Element[]`
  // (no false/null/undefined allowed). Conditional children use ternary +
  // empty Fragment so every slot resolves to a real Element.
  return (
    <EffectComposer multisampling={0}>
      {shadowsEnabled ? (
        <N8AO halfRes aoRadius={0.5} intensity={1.5} aoSamples={6} denoiseSamples={4} />
      ) : <></>}
      {preset.dof.enabled ? (
        <DepthOfField
          target={dofTargetVec}
          focalLength={preset.dof.focalLength}
          bokehScale={preset.dof.bokehScale}
        />
      ) : <></>}
      {preset.tiltShift.enabled ? (
        // `focusArea` (size of in-focus band) inverts our "strength" semantic:
        // higher strength = narrower band = stronger tilt-shift feel.
        <TiltShift focusArea={1 - preset.tiltShift.strength} feather={0.3} />
      ) : <></>}
      <Bloom
        intensity={preset.bloom.intensity * overrides.bloomStrength}
        luminanceThreshold={preset.bloom.threshold}
        luminanceSmoothing={0.1}
        radius={preset.bloom.radius * overrides.bloomRadius}
        mipmapBlur
      />
      {godRaysSource && preset.godRays ? (
        <GodRays
          sun={godRaysSource}
          exposure={preset.godRays.exposure}
          samples={preset.godRays.samples}
        />
      ) : <></>}
      <HueSaturation hue={preset.colorGrade.hue} saturation={preset.colorGrade.saturation} />
      <BrightnessContrast
        brightness={preset.colorGrade.brightness}
        contrast={preset.colorGrade.contrast}
      />
      <Vignette offset={preset.vignette.offset} darkness={preset.vignette.darkness} />
      <Noise opacity={preset.noise.opacity} premultiply />
      {preset.chromaticAberration?.enabled ? (
        <ChromaticAberration offset={preset.chromaticAberration.offset} />
      ) : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
