import type { VFXParticlesProps } from 'r3f-vfx'

interface BasePreset {
  id: string
  name: string
  categoryLabel: string
  emoji: string
  description: string
}

/** Particle system preset (r3f-vfx) — kind defaults to 'particles' for backwards compat */
export interface ParticlesPreset extends BasePreset {
  kind?: 'particles'
  category: 'linh-son' | 'de-quoc' | 'thien-lu' | 'generic'
  props: Partial<VFXParticlesProps>
}

/** Unified preset type — alias kept for the preset kits that type as `VfxPreset[]` */
export type VfxPreset = ParticlesPreset

export type PresetCategory =
  | 'linh-son'
  | 'de-quoc'
  | 'thien-lu'
  | 'generic'
