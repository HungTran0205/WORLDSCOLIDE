import { useSceneStore } from '../store/scene-store'

function ObjectChip({ label, icon, active, onClick }: {
  label: string; icon: string; active: boolean; onClick: () => void
}) {
  return (
    <button className={`object-chip ${active ? 'active' : ''}`} onClick={onClick}>
      {icon} {label}
    </button>
  )
}

/**
 * Horizontal strip at the bottom of the canvas — lists all placed scene objects.
 * Click any chip to select that object (shows in PropertiesPanel).
 */
export function SceneObjectsList() {
  const placedProps = useSceneStore((s) => s.placedProps)
  const bgLayers = useSceneStore((s) => s.bgLayers)
  const vfxPlacements = useSceneStore((s) => s.vfxPlacements)
  const selectedId = useSceneStore((s) => s.selectedId)
  const selectedBgId = useSceneStore((s) => s.selectedBgId)
  const selectedVFXId = useSceneStore((s) => s.selectedVFXId)
  const selectProp = useSceneStore((s) => s.selectProp)
  const selectBgLayer = useSceneStore((s) => s.selectBgLayer)
  const selectVFX = useSceneStore((s) => s.selectVFX)

  const total = placedProps.length + bgLayers.length + vfxPlacements.length
  if (total === 0) return null

  return (
    <div className="scene-objects-list">
      <span className="scene-objects-label">Scene:</span>
      {bgLayers.map((l) => (
        <ObjectChip
          key={l.id}
          label={l.src.split('/').pop()!}
          icon="🖼️"
          active={selectedBgId === l.id}
          onClick={() => selectBgLayer(l.id)}
        />
      ))}
      {placedProps.map((p) => (
        <ObjectChip
          key={p.id}
          label={p.src.split('/').pop()!.replace('.glb', '')}
          icon="📦"
          active={selectedId === p.id}
          onClick={() => selectProp(p.id)}
        />
      ))}
      {vfxPlacements.map((v) => (
        <ObjectChip
          key={v.id}
          label={v.effectId}
          icon="✨"
          active={selectedVFXId === v.id}
          onClick={() => selectVFX(v.id)}
        />
      ))}
    </div>
  )
}
