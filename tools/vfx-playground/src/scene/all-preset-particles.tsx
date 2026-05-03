import { useMemo } from 'react'
import { VFXParticles } from 'r3f-vfx'
import { allPresets } from '../presets/preset-registry'
import type { ParticlesPreset } from '../presets/preset-types'
import { loadAllOverrides } from '../presets/preset-overrides-store'

/**
 * Persistent root that mounts every particle preset once with `name={preset.id}`
 * and `autoStart={false}`. Lib registers each in `coreStore.particles[name]`,
 * unblocking `useVFXEmitter(name).emit(...)` from anywhere in the tree.
 *
 * Lifecycle: mounted ONCE per Canvas, never unmounted on preset switch.
 *
 * IMPORTANT: we spread the FULL merged props (not just bake-only). This is
 * required for lib's `resolveFeatures` to correctly detect feature flags at
 * mount time:
 *   - needsPerParticleColor (colorStart.length > 1 || colorEnd != null)
 *     → creates `particleColorStarts` storage; without this, runtime color
 *     overrides via emit() silently fall back to the white default.
 *   - turbulence / attractors / collision / rotation / trail — same logic.
 *
 * Boot-time persistence: saved overrides from localStorage are merged into
 * the registry preset before mount. This is the only place structural changes
 * (maxParticles, geometry) take effect, since the system mounts once.
 *
 * The JSX is memoised so this component re-rendering (because parent Layout
 * re-renders on slider tweaks) does NOT thrash the 18 particle systems.
 *
 * Meshline presets are NOT included — they don't use VFXParticles / compute.
 */
export function AllPresetParticles() {
  // Snapshot saved overrides ONCE at mount. Subsequent changes only take
  // effect on next page reload (per the persistent pattern's design).
  const savedOverrides = useMemo(() => loadAllOverrides(), [])

  const children = useMemo(() => (
    allPresets
      .filter((p): p is ParticlesPreset => p.kind !== 'meshline')
      .map(p => {
        const merged = { ...p.props, ...savedOverrides[p.id] }
        return (
          <VFXParticles
            key={p.id}
            name={p.id}
            autoStart={false}
            {...merged}
          />
        )
      })
  ), [savedOverrides])

  return <>{children}</>
}
