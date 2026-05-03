import type { RuntimeState } from './use-sequence-runtime'
import { presetById } from '../presets/preset-registry'
import { MeshlineEffect } from '../scene/meshline-effect'
import type { MeshlinePreset } from '../presets/preset-types'

interface Props {
  runtime: RuntimeState
}

/**
 * Renders meshline VFX clips that are currently in their live window.
 * Particle clips are NOT rendered here — they fire via `useVFXStore.emit()`
 * inside `useSequenceRuntime` against the persistent <AllPresetParticles>.
 *
 * Meshline path is mount/unmount-safe (no compute pipelines), so the original
 * dedupe-by-kind + remountGen pattern is preserved.
 */
export function SequenceMeshlineRenderer({ runtime }: Props) {
  const meshlineClips = runtime.liveClips.filter(c => {
    if (c.track !== 'vfx') return false
    const preset = presetById[c.kind]
    return preset?.kind === 'meshline'
  })

  const uniqueClips = Array.from(new Map(meshlineClips.map(c => [c.kind, c])).values())

  return (
    <>
      {uniqueClips.map(clip => {
        const preset = presetById[clip.kind] as MeshlinePreset
        return (
          <MeshlineEffect
            key={`${clip.kind}-${runtime.remountGen}`}
            preset={preset}
          />
        )
      })}
    </>
  )
}
