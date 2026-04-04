/** HD-2D post-processing — Vignette temporarily disabled pending WebGPU/TSL rebuild. */

interface Props {
  vignetteStrength?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CombatPostProcessing({ vignetteStrength: _ }: Props) {
  return null;
}
