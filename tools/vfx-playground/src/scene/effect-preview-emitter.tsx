import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { useVFXEmitter } from 'r3f-vfx'
import type { ParticlesPreset } from '../presets/preset-types'
import { splitPresetProps } from '../presets/preset-prop-classification'

interface Props {
  preset: ParticlesPreset
}

const _worldPos = new THREE.Vector3()

/**
 * Drives a continuous emit() loop targeting the persistent <VFXParticles>
 * registered as `preset.id`. Sits inside <EffectTarget> so its parent transform
 * supplies the world-space spawn position; we read it via worldRef + useFrame
 * and pass to emit() (option (b) per phase-03 plan).
 *
 * Bake-only props are ignored at runtime — they were applied at <AllPresetParticles>
 * mount. Override-able tweaks flow via overridesRef so live edits update the next
 * emit without recreating the interval.
 */
export function EffectPreviewEmitter({ preset }: Props) {
  const overridesRef = useRef<Record<string, unknown>>({})
  const worldRef = useRef<THREE.Group>(null!)
  const worldPosRef = useRef<[number, number, number]>([0, 0, 0])
  const { emit } = useVFXEmitter(preset.id)

  useEffect(() => {
    overridesRef.current = splitPresetProps(preset.props).overrides
  }, [preset])

  useFrame(() => {
    if (!worldRef.current) return
    worldRef.current.getWorldPosition(_worldPos)
    worldPosRef.current[0] = _worldPos.x
    worldPosRef.current[1] = _worldPos.y
    worldPosRef.current[2] = _worldPos.z
  })

  useEffect(() => {
    const intervalMs = Math.max(16, (preset.props.delay ?? 0.05) * 1000)
    const count = (preset.props.emitCount as number | undefined) ?? 8
    const id = window.setInterval(() => {
      emit(worldPosRef.current, count, overridesRef.current as never)
    }, intervalMs)
    return () => window.clearInterval(id)
    // re-create only when target system identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset.id, emit])

  return <group ref={worldRef} />
}
