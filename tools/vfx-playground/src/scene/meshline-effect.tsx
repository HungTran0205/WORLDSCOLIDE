import { useEffect, useMemo } from 'react'
import { MeshLine } from 'makio-meshline'
import { AdditiveBlending, Color } from 'three/webgpu'
import type { MeshlinePreset, MeshlineShape, MeshlineShapeParams } from '../presets/preset-types'

interface Props {
  preset: MeshlinePreset
}

/**
 * Generate point list for a given meshline shape.
 * Returns Float32Array of [x, y, z, x, y, z, ...]
 */
function generatePoints(shape: MeshlineShape, p: MeshlineShapeParams): Float32Array {
  switch (shape) {
    case 'arc': {
      const segments = p.segments ?? 48
      const radius = p.radius ?? 1.5
      const angle = p.arcAngle ?? Math.PI
      const arr = new Float32Array(segments * 3)
      for (let i = 0; i < segments; i++) {
        const t = i / (segments - 1)
        const a = -angle / 2 + t * angle
        arr[i * 3 + 0] = Math.cos(a) * radius
        arr[i * 3 + 1] = Math.sin(a) * radius
        arr[i * 3 + 2] = 0
      }
      return arr
    }
    case 'circle': {
      const segments = p.segments ?? 64
      const radius = p.radius ?? 1.5
      const arr = new Float32Array(segments * 3)
      for (let i = 0; i < segments; i++) {
        const a = (i / (segments - 1)) * Math.PI * 2
        arr[i * 3 + 0] = Math.cos(a) * radius
        arr[i * 3 + 1] = Math.sin(a) * radius
        arr[i * 3 + 2] = 0
      }
      return arr
    }
    case 'sine': {
      const segments = p.segments ?? 96
      const length = p.length ?? 4
      const wavelengths = p.wavelengths ?? 4
      const amplitude = p.amplitude ?? 0.3
      const arr = new Float32Array(segments * 3)
      for (let i = 0; i < segments; i++) {
        const t = i / (segments - 1)
        arr[i * 3 + 0] = -length / 2 + t * length
        arr[i * 3 + 1] = Math.sin(t * Math.PI * 2 * wavelengths) * amplitude
        arr[i * 3 + 2] = 0
      }
      return arr
    }
    case 'spiral': {
      const segments = p.segments ?? 128
      const radius = p.radius ?? 1.0
      const turns = p.spiralTurns ?? 4
      const height = p.spiralHeight ?? 2
      const arr = new Float32Array(segments * 3)
      for (let i = 0; i < segments; i++) {
        const t = i / (segments - 1)
        const a = t * Math.PI * 2 * turns
        arr[i * 3 + 0] = Math.cos(a) * radius
        arr[i * 3 + 1] = -height / 2 + t * height
        arr[i * 3 + 2] = Math.sin(a) * radius
      }
      return arr
    }
    case 'line':
    default: {
      const segments = p.segments ?? 32
      const start = p.start ?? [-1, 0, 0]
      const end = p.end ?? [1, 0, 0]
      const arr = new Float32Array(segments * 3)
      for (let i = 0; i < segments; i++) {
        const t = i / (segments - 1)
        arr[i * 3 + 0] = start[0] + (end[0] - start[0]) * t
        arr[i * 3 + 1] = start[1] + (end[1] - start[1]) * t
        arr[i * 3 + 2] = start[2] + (end[2] - start[2]) * t
      }
      return arr
    }
  }
}

export function MeshlineEffect({ preset }: Props) {
  const meshLine = useMemo(() => {
    const ml = new MeshLine()
    const points = generatePoints(preset.shape, preset.shapeParams)
    ml.configure({
      lines: points,
      color: new Color(preset.color),
      lineWidth: preset.lineWidth,
      opacity: preset.opacity,
      transparent: true,
      sizeAttenuation: false,
      gradientColor: preset.gradientColor ? new Color(preset.gradientColor) : null,
    })
    if (preset.additive) {
      const mat = ml.material as unknown as { blending: number; transparent: boolean; depthWrite: boolean }
      mat.blending = AdditiveBlending
      mat.transparent = true
      mat.depthWrite = false
    }
    if (preset.rotation) {
      ml.rotation.set(preset.rotation[0], preset.rotation[1], preset.rotation[2])
    }
    return ml
  }, [preset])

  useEffect(() => {
    return () => {
      meshLine.geometry?.dispose()
      const mat = meshLine.material as unknown as { dispose?: () => void }
      mat?.dispose?.()
    }
  }, [meshLine])

  return <primitive object={meshLine} />
}
