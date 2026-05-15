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
import { VFXParticles } from 'r3f-vfx';
import { Lighting } from 'core-vfx';
import { allPresets } from '@/scene/effects/preset-registry';
import type { ParticlesPreset } from '@/scene/effects/preset-types';

export function CombatVfxRoot() {
  const children = useMemo(
    () =>
      allPresets
        .filter((p): p is ParticlesPreset => p.kind !== 'meshline')
        .filter((p) => p.category === 'linh-son')
        .map((p) => (
          <VFXParticles
            key={p.id}
            name={p.id}
            autoStart={false}
            {...p.props}
            lighting={Lighting.BASIC}
          />
        )),
    [],
  );
  return <>{children}</>;
}
