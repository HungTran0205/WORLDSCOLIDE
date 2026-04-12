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

/** Meshline-based preset (slash, beam, projectile-trail) using makio-meshline */
export type MeshlineShape = 'line' | 'arc' | 'circle' | 'sine' | 'spiral'

export interface MeshlineShapeParams {
  segments?: number
  radius?: number
  wavelengths?: number
  amplitude?: number
  length?: number
  start?: [number, number, number]
  end?: [number, number, number]
  arcAngle?: number
  spiralTurns?: number
  spiralHeight?: number
}

export interface MeshlinePreset extends BasePreset {
  kind: 'meshline'
  category: 'weapon-fx'
  shape: MeshlineShape
  shapeParams: MeshlineShapeParams
  color: string
  gradientColor?: string
  lineWidth: number
  opacity: number
  additive: boolean
  /** Optional rotation in radians applied to the line group [x, y, z] */
  rotation?: [number, number, number]
}

/** Unified preset type — discriminated by `kind` */
export type VfxPreset = ParticlesPreset | MeshlinePreset

export type PresetCategory =
  | 'linh-son'
  | 'de-quoc'
  | 'thien-lu'
  | 'generic'
  | 'weapon-fx'
