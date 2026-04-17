import { useSceneStore } from '../store/scene-store'

/**
 * Renders background parallax layers from the scene store.
 * Phase 5: full sprite-plane implementation with z/y offsets and opacity.
 */
export function ParallaxBg() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _layers = useSceneStore(s => s.bgLayers)
  return null
}
