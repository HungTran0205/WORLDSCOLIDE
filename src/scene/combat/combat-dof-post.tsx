/**
 * Combat depth-of-field postprocessing — completes the HD-2D depth illusion
 * by blurring far/near layers while keeping the battlefield (z≈0) sharp.
 *
 * Mounts an EffectComposer with a DepthOfField pass when:
 *   - Combat panel is open (caller responsibility — this component just runs
 *     wherever it's mounted).
 *   - Stored graphics quality is 'high' (skipped on 'low' for perf).
 *
 * On WebGPU the @react-three/postprocessing EffectComposer falls back to
 * non-WebGPU paths — gracefully returns null so we don't crash the device.
 *
 * NOTE: Only ONE EffectComposer per Canvas may run at a time — `world-bloom-
 * post.tsx` early-returns while combat is open so this composer can take over
 * during the combat session.
 *
 * WebGPU: superseded by `combat-webgpu-post.tsx`, which runs a TSL post chain
 * (bloom/tilt-shift/color-grade/vignette/ACES) — the tilt-shift focus band
 * provides the HD-2D depth cue that this WebGL DOF can't on WebGPU. This file
 * stays the WebGL combat path; the two never coexist (each null on the other's
 * renderer).
 */

import { useThree } from '@react-three/fiber';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
import { getStoredGraphicsQuality } from '@/game/state/guild-slice';

export function CombatDofPost() {
  const gl = useThree(s => s.gl);

  if (getStoredGraphicsQuality() === 'low') return null;
  // @react-three/postprocessing relies on WebGL render targets; with a
  // WebGPU renderer the composer can't drive the WebGPU pipeline.
  if ('isWebGPURenderer' in gl) return null;

  return (
    <EffectComposer multisampling={0}>
      {/*
        Focus distance ~ camera-to-battlefield distance (12u).
        focalLength controls aperture / blur strength;
        bokehScale 4 keeps blur subtle so background still readable.
        Focus range covers sprite z extent (z=-3..+3 → ±0.04 NDC at zoom 38).
      */}
      <DepthOfField
        focusDistance={0.5}
        focalLength={0.04}
        bokehScale={4}
      />
    </EffectComposer>
  );
}
