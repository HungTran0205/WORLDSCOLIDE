/**
 * Combat VFX persistent root — mounted inside `<CombatScene>` (D8 single
 * canvas). Loads ONLY LinhSon civ presets and forces unlit shading so
 * each particle pipeline stays under the adapter's per-stage sampler
 * ceiling (16 on common iGPUs).
 *
 * Why LinhSon-only + unlit:
 *  - VFXParticles defaults to `lighting: 'standard'` → MeshStandardNodeMaterial
 *    which binds 18+ samplers per pipeline (envMap, normalMap, roughness,
 *    ...). Most adapters cap maxSamplersPerShaderStage at 16, so STANDARD
 *    lighting fails to compile.
 *  - Combat VFX (sparks, bursts, heals, smoke) are stylised pixel art; no
 *    PBR needed. `lighting: 'basic'` → MeshBasicNodeMaterial (~1 sampler).
 *  - Loading only one civilisation's preset kit keeps mounted compute
 *    pipelines minimal (~6) without forcing per-event filtering. Bridge
 *    maps every combat event (hit/crit/heal/death) to a LinhSon preset.
 */

import { useMemo } from 'react';
import { VFXParticles, Blending } from 'r3f-vfx';
import { Lighting } from 'core-vfx';
import { allPresets } from '@/scene/effects/preset-registry';

export function CombatVfxRoot() {
  const children = useMemo(
    () =>
      allPresets
        .filter((p) => p.category === 'linh-son' || p.category === 'generic')
        .map((p) => (
          <VFXParticles
            key={p.id}
            name={p.id}
            autoStart={false}
            {...p.props}
            // MULTIPLY blending looks brown/earthy on dark backgrounds (enemy side).
            // Force ADDITIVE so hit/burst effects read consistently across the arena.
            blending={Blending.ADDITIVE}
            lighting={Lighting.BASIC}
            // depthTest off so combat feedback particles (hit spark, crit burst,
            // heal, death) always read on top of the depth-writing entity sprites
            // instead of being half-occluded when they spawn behind a sprite plane.
            depthTest={false}
            renderOrder={11}
          />
        )),
    [],
  );
  return <>{children}</>;
}
