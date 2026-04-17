import { useControls } from 'leva'
import { useEffect } from 'react'
import { useSceneStore } from '../store/scene-store'

/**
 * Leva-powered lighting controls — syncs with the scene store so arena-viewport
 * reads reactive lighting values. Returns null; Leva renders its own floating panel.
 */
export function LightingPanel() {
  const lighting = useSceneStore((s) => s.lighting)
  const updateLighting = useSceneStore((s) => s.updateLighting)

  const vals = useControls('Lighting', {
    ambientIntensity: { value: lighting.ambient.intensity, min: 0, max: 10, step: 0.1 },
    ambientColor:     { value: lighting.ambient.color },
    dirIntensity:     { value: lighting.directional.intensity, min: 0, max: 10, step: 0.1 },
    dirColor:         { value: lighting.directional.color },
    dirX:             { value: lighting.directional.position[0], min: -20, max: 20, step: 0.5 },
    dirY:             { value: lighting.directional.position[1], min: 0,   max: 20, step: 0.5 },
    dirZ:             { value: lighting.directional.position[2], min: -10, max: 20, step: 0.5 },
    fogColor:         { value: lighting.fogColor },
    vignetteStr: {
      value: lighting.vignette.strength, min: 0, max: 1, step: 0.01, label: 'Vignette',
    },
  })

  useEffect(() => {
    updateLighting({
      ambient: { intensity: vals.ambientIntensity, color: vals.ambientColor },
      directional: {
        intensity: vals.dirIntensity,
        color: vals.dirColor,
        position: [vals.dirX, vals.dirY, vals.dirZ],
      },
      fogColor: vals.fogColor,
      vignette: { strength: vals.vignetteStr },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    vals.ambientIntensity, vals.ambientColor,
    vals.dirIntensity, vals.dirColor, vals.dirX, vals.dirY, vals.dirZ,
    vals.fogColor, vals.vignetteStr,
  ])

  return null
}
