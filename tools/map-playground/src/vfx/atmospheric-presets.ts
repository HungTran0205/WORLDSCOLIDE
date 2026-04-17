import { EmitterShape, Blending } from 'r3f-vfx'
import type { VFXParticlesProps } from 'r3f-vfx'

export interface AtmosphericPreset {
  id: string
  name: string
  description: string
  props: Partial<VFXParticlesProps>
}

export const atmosphericPresets: AtmosphericPreset[] = [
  {
    id: 'cave-ember',
    name: 'Cave Ember',
    description: 'Slow-rising hot embers from torches',
    props: {
      maxParticles: 200,
      size: [0.03, 0.08],
      colorStart: ['#ff6600', '#ff8c3a'],
      colorEnd: ['#ff000000'],
      fadeOpacity: [1, 0],
      lifetime: [1.5, 3.0],
      speed: [0.05, 0.15],
      gravity: [0, 0.3, 0],
      emitterShape: EmitterShape.SPHERE,
      emitterRadius: [0, 0.5],
      blending: Blending.ADDITIVE,
      intensity: 4,
    },
  },
  {
    id: 'fog-mist',
    name: 'Ground Fog',
    description: 'Dense low-lying fog rolling across floor',
    props: {
      maxParticles: 80,
      size: [1.5, 3.0],
      colorStart: ['#1a1a2e', '#0a0a14'],
      colorEnd: ['#1a1a2e00'],
      fadeOpacity: [0.4, 0],
      lifetime: [4.0, 8.0],
      speed: [0.02, 0.08],
      gravity: [0, 0, 0],
      emitterShape: EmitterShape.BOX,
      emitterRadius: 3,
      blending: Blending.NORMAL,
      intensity: 1,
    },
  },
  {
    id: 'forest-spore',
    name: 'Forest Spores',
    description: 'Gentle floating spores in forest light',
    props: {
      maxParticles: 150,
      size: [0.02, 0.06],
      colorStart: ['#c8e6c8', '#90ee90'],
      colorEnd: ['#c8e6c800'],
      fadeOpacity: [1, 0],
      lifetime: [3.0, 6.0],
      speed: [0.01, 0.05],
      gravity: [0, 0.05, 0],
      emitterShape: EmitterShape.SPHERE,
      emitterRadius: [0, 2],
      blending: Blending.ADDITIVE,
      intensity: 2,
    },
  },
  {
    id: 'dust-motes',
    name: 'Dust Motes',
    description: 'Tiny dust particles drifting in light shafts',
    props: {
      maxParticles: 300,
      size: [0.01, 0.03],
      colorStart: ['#d4c49a', '#c8b882'],
      colorEnd: ['#d4c49a00'],
      fadeOpacity: [1, 0],
      lifetime: [5.0, 10.0],
      speed: [0.005, 0.02],
      gravity: [0, 0.01, 0],
      emitterShape: EmitterShape.BOX,
      emitterRadius: 5,
      blending: Blending.ADDITIVE,
      intensity: 1.5,
    },
  },
]

export const presetById: Record<string, AtmosphericPreset> = Object.fromEntries(
  atmosphericPresets.map((p) => [p.id, p]),
)
