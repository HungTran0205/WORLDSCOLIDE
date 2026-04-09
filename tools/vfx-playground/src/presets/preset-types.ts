import type { VFXParticlesProps } from 'r3f-vfx'

export interface VfxPreset {
  id: string
  name: string
  category: 'linh-son' | 'de-quoc' | 'thien-lu' | 'generic'
  categoryLabel: string
  emoji: string
  description: string
  /** Props passed directly to <VFXParticles /> */
  props: Partial<VFXParticlesProps>
}
