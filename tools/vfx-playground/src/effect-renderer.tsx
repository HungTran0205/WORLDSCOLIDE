import { VFXParticles } from 'r3f-vfx'
import type { VfxPreset } from './presets/preset-types'

interface Props {
  preset: VfxPreset
}

export function EffectRenderer({ preset }: Props) {
  return (
    <VFXParticles
      key={preset.id}
      {...preset.props}
      debug
    />
  )
}
