import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { SequenceClip } from './sequence-types'

interface Props {
  liveClips: SequenceClip[]
}

/**
 * Applies camera zoom-in/out via camera.zoom lerp.
 * Applies camera shake via CSS transform on the canvas container element.
 * baseZoomRef: null = idle (no zoom clip active), non-null = actively zooming/restoring.
 */
export function CameraEffectController({ liveClips }: Props) {
  const { camera, gl } = useThree()
  const baseZoomRef = useRef<number | null>(null)

  useFrame((state) => {
    const zoomClip = liveClips.find(
      c => c.track === 'camera' && (c.kind === 'zoom-in' || c.kind === 'zoom-out')
    )
    const shakeClip = liveClips.find(c => c.track === 'camera' && c.kind === 'shake')

    // --- Zoom ---
    if (zoomClip) {
      if (baseZoomRef.current === null) {
        baseZoomRef.current = camera.zoom
      }
      const rawFactor = (zoomClip.payload?.factor as number) ?? 1.2
      const factor = zoomClip.kind === 'zoom-in' ? rawFactor : 1 / rawFactor
      const target = baseZoomRef.current * factor
      camera.zoom += (target - camera.zoom) * 0.1
      camera.updateProjectionMatrix()
    } else if (baseZoomRef.current !== null) {
      // Restore to base zoom
      camera.zoom += (baseZoomRef.current - camera.zoom) * 0.1
      if (Math.abs(camera.zoom - baseZoomRef.current) < 0.2) {
        camera.zoom = baseZoomRef.current
        baseZoomRef.current = null
      }
      camera.updateProjectionMatrix()
    }

    // --- Shake via CSS on canvas container ---
    const container = gl.domElement.parentElement
    if (!container) return
    const now = state.clock.elapsedTime
    if (shakeClip) {
      const intensity = (shakeClip.payload?.intensity as number) ?? 0.3
      const freq = (shakeClip.payload?.freq as number) ?? 30
      const sx = Math.sin(now * freq * Math.PI * 2) * intensity * 4
      const sy = Math.cos(now * freq * Math.PI * 2 * 1.3) * intensity * 2
      container.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`
    } else if (container.style.transform) {
      container.style.transform = ''
    }
  })

  return null
}
