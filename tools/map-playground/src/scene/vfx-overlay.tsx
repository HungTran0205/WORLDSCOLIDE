import { VFXParticles } from 'r3f-vfx'
import { useSceneStore } from '../store/scene-store'
import { presetById } from '../vfx/atmospheric-presets'
import type { VFXPlacement } from '../store/scene-types'

/** Renders a single VFX emitter placement. Shows wireframe sphere when selected. */
function VFXPlacementMesh({ placement }: { placement: VFXPlacement }) {
  const preset = presetById[placement.effectId]
  const selected = useSceneStore((s) => s.selectedVFXId === placement.id)
  const selectVFX = useSceneStore((s) => s.selectVFX)

  if (!preset) return null

  return (
    <group
      position={placement.position}
      scale={placement.scale}
      onClick={(e) => {
        e.stopPropagation()
        selectVFX(placement.id)
      }}
    >
      <VFXParticles {...preset.props} />
      {/* Selection indicator — wireframe sphere */}
      {selected && (
        <mesh>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial wireframe color="#ff6600" />
        </mesh>
      )}
    </group>
  )
}

/** Renders all VFX emitter placements from the scene store. */
export function VFXOverlay() {
  const vfxPlacements = useSceneStore((s) => s.vfxPlacements)
  return (
    <>
      {vfxPlacements.map((p) => (
        <VFXPlacementMesh key={p.id} placement={p} />
      ))}
    </>
  )
}
