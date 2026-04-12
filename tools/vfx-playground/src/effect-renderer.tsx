import { VFXParticles } from 'r3f-vfx'
import type { VfxPreset } from './presets/preset-types'
import { MeshlineEffect } from './scene/meshline-effect'

interface Props {
  preset: VfxPreset
}

export function EffectRenderer({ preset }: Props) {
  if (preset.kind === 'meshline') {
    return <MeshlineEffect preset={preset} />
  }
  return <VFXParticles key={preset.id} {...preset.props} debug />
}
