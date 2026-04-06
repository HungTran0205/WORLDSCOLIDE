/**
 * HD-2D post-processing — Vignette only.
 * DoF removed: incompatible with orthographic camera and WebGPU renderer.
 * EffectComposer skipped entirely when WebGPU renderer is active.
 */

import { useThree } from '@react-three/fiber';
import { EffectComposer, Vignette } from '@react-three/postprocessing';

interface Props {
  vignetteStrength?: number;
}

export function CombatPostProcessing({ vignetteStrength = 0.5 }: Props) {
  const gl = useThree(s => s.gl);

  // Skip for WebGPU renderer — GLSL-based EffectComposer not compatible
  if ('isWebGPURenderer' in gl) return null;

  return (
    <EffectComposer>
      <Vignette darkness={vignetteStrength} />
    </EffectComposer>
  );
}
