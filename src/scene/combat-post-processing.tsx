/** HD-2D post-processing stack — Vignette only (single-pass, negligible cost).
 *  Bloom removed: mipmapBlur requires N render passes per frame → too expensive
 *  for a 30fps pixel-art scene. Re-add only if GPU budget allows. */

import { EffectComposer, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

interface Props {
  vignetteStrength?: number;
}

export function CombatPostProcessing({ vignetteStrength = 0.72 }: Props) {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Vignette
        offset={0.15}
        darkness={vignetteStrength}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
