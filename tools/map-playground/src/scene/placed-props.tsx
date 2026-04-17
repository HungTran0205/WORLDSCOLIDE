import { useSceneStore } from '../store/scene-store'

/**
 * Renders placed props from the scene store.
 * Phase 3: each PlacedProp → useGLTF primitive + ghost preview on pending asset.
 */
export function PlacedProps() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _props = useSceneStore(s => s.placedProps)
  return null
}
