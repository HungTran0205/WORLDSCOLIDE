import type { VFXParticlesProps } from 'r3f-vfx'

// Bake vs override classification for VFX preset props.
// `core-vfx` exports STRUCTURAL_KEYS (index.d.ts:626) — those props are baked
// at <VFXParticles> mount and cannot change without remount. We extend that
// list with constructor-time-only props (geometry / curveTexturePath / depthTest
// / renderOrder) that also configure mesh/material at instance creation.
//
// Anything NOT in BAKE_KEYS is override-able per-emit via useVFXEmitter().emit().
export const BAKE_KEYS = [
  // STRUCTURAL_KEYS from core-vfx
  'maxParticles',
  'lighting',
  'appearance',
  'shadow',
  'orientToDirection',
  'lightingParams',
  'geometryNode',
  // Constructor-time props (not in STRUCTURAL_KEYS but bake at material/mesh build)
  'geometry',
  'curveTexturePath',
  'depthTest',
  'renderOrder',
  // Identity / debug — bake-only by nature
  'name',
  'debug',
] as const

export type BakeKey = (typeof BAKE_KEYS)[number]

const BAKE_KEY_SET = new Set<string>(BAKE_KEYS as readonly string[])

/**
 * Split a preset's `props` into the subset baked at <VFXParticles> mount
 * (`baked`) and the subset passed per-emit as overrides (`overrides`).
 *
 * Used by:
 *   - <AllPresetParticles>: spreads `baked` into <VFXParticles {...baked}>
 *   - Effect Designer + Sequencer: passes `overrides` to emit() at runtime
 */
export function splitPresetProps(
  props: Partial<VFXParticlesProps>,
): { baked: Partial<VFXParticlesProps>; overrides: Record<string, unknown> } {
  const baked: Partial<VFXParticlesProps> = {}
  const overrides: Record<string, unknown> = {}
  for (const key of Object.keys(props) as Array<keyof VFXParticlesProps>) {
    const value = (props as Record<string, unknown>)[key as string]
    if (value === undefined) continue
    if (BAKE_KEY_SET.has(key as string)) {
      ;(baked as Record<string, unknown>)[key as string] = value
    } else {
      overrides[key as string] = value
    }
  }
  return { baked, overrides }
}

/** Compile-time check: any BaseParticleProps key not in BAKE_KEYS is override-able. */
export function isBakeKey(key: string): key is BakeKey {
  return BAKE_KEY_SET.has(key)
}
