import { useSceneStore } from '../store/scene-store'
import { presetById } from '../vfx/atmospheric-presets'

// ── shared primitives ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel-section">
      <div className="panel-section-title">{title}</div>
      {children}
    </div>
  )
}

function SliderRow({ label, value, min, max, step, onLive, onCommit }: {
  label: string; value: number; min: number; max: number; step: number
  onLive: (v: number) => void
  onCommit: (v: number) => void
}) {
  return (
    <div className="slider-row">
      <span className="slider-label">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onLive(parseFloat(e.target.value))}
        onPointerUp={(e) => onCommit(parseFloat((e.target as HTMLInputElement).value))}
      />
      <span className="slider-value">{value.toFixed(2)}</span>
    </div>
  )
}

function ColorRow({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="slider-row">
      <span className="slider-label">{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <span className="slider-value">{value}</span>
    </div>
  )
}

// ── prop panel ─────────────────────────────────────────────────────────────

function PropPanel() {
  const selectedId = useSceneStore((s) => s.selectedId)
  const prop = useSceneStore((s) => s.placedProps.find((p) => p.id === selectedId))
  const updatePropLive = useSceneStore((s) => s.updatePropLive)
  const commitPropUpdate = useSceneStore((s) => s.commitPropUpdate)
  const deleteSelected = useSceneStore((s) => s.deleteSelected)

  if (!prop) return null
  const label = prop.src.split('/').pop() ?? prop.src
  const pos = prop.position
  const rot = prop.rotation

  return (
    <div className="properties-panel">
      <div className="panel-title">{label}</div>
      <Section title="Position">
        <SliderRow label="X" value={pos[0]} min={-20} max={20} step={0.1}
          onLive={(v) => updatePropLive(prop.id, { position: [v, pos[1], pos[2]] })}
          onCommit={(v) => commitPropUpdate(prop.id, { position: [v, pos[1], pos[2]] })} />
        <SliderRow label="Y" value={pos[1]} min={-5} max={10} step={0.1}
          onLive={(v) => updatePropLive(prop.id, { position: [pos[0], v, pos[2]] })}
          onCommit={(v) => commitPropUpdate(prop.id, { position: [pos[0], v, pos[2]] })} />
        <SliderRow label="Z" value={pos[2]} min={-15} max={10} step={0.1}
          onLive={(v) => updatePropLive(prop.id, { position: [pos[0], pos[1], v] })}
          onCommit={(v) => commitPropUpdate(prop.id, { position: [pos[0], pos[1], v] })} />
      </Section>
      <Section title="Transform">
        <SliderRow label="Scale" value={prop.scale as number} min={0.01} max={2} step={0.01}
          onLive={(v) => updatePropLive(prop.id, { scale: v })}
          onCommit={(v) => commitPropUpdate(prop.id, { scale: v })} />
        <SliderRow label="Rot Y" value={rot[1]} min={-Math.PI} max={Math.PI} step={0.05}
          onLive={(v) => updatePropLive(prop.id, { rotation: [rot[0], v, rot[2]] })}
          onCommit={(v) => commitPropUpdate(prop.id, { rotation: [rot[0], v, rot[2]] })} />
      </Section>
      <button className="btn-danger" onClick={deleteSelected}>Delete</button>
    </div>
  )
}

// ── bg layer panel ─────────────────────────────────────────────────────────

function BgPanel() {
  const selectedBgId = useSceneStore((s) => s.selectedBgId)
  const layer = useSceneStore((s) => s.bgLayers.find((l) => l.id === selectedBgId))
  const updateBgLayer = useSceneStore((s) => s.updateBgLayer)
  const removeBgLayer = useSceneStore((s) => s.removeBgLayer)

  if (!layer) return null
  const label = layer.src.split('/').pop() ?? layer.src

  return (
    <div className="properties-panel">
      <div className="panel-title">{label}</div>
      <Section title="Position">
        <SliderRow label="Z depth" value={layer.z} min={-20} max={0} step={0.1}
          onLive={(v) => updateBgLayer(layer.id, { z: v })}
          onCommit={(v) => updateBgLayer(layer.id, { z: v })} />
        <SliderRow label="Y offset" value={layer.y} min={-5} max={15} step={0.1}
          onLive={(v) => updateBgLayer(layer.id, { y: v })}
          onCommit={(v) => updateBgLayer(layer.id, { y: v })} />
      </Section>
      <Section title="Appearance">
        <SliderRow label="Scale" value={layer.scale} min={0.1} max={5} step={0.05}
          onLive={(v) => updateBgLayer(layer.id, { scale: v })}
          onCommit={(v) => updateBgLayer(layer.id, { scale: v })} />
        <SliderRow label="Opacity" value={layer.opacity} min={0} max={1} step={0.01}
          onLive={(v) => updateBgLayer(layer.id, { opacity: v })}
          onCommit={(v) => updateBgLayer(layer.id, { opacity: v })} />
      </Section>
      <button className="btn-danger" onClick={() => removeBgLayer(layer.id)}>Remove Layer</button>
    </div>
  )
}

// ── vfx panel ──────────────────────────────────────────────────────────────

function VFXPanel() {
  const selectedVFXId = useSceneStore((s) => s.selectedVFXId)
  const placement = useSceneStore((s) => s.vfxPlacements.find((v) => v.id === selectedVFXId))
  const updateVFX = useSceneStore((s) => s.updateVFX)
  const removeVFX = useSceneStore((s) => s.removeVFX)

  if (!placement) return null
  const preset = presetById[placement.effectId]
  const pos = placement.position

  return (
    <div className="properties-panel">
      <div className="panel-title">✨ {preset?.name ?? placement.effectId}</div>
      <Section title="Position">
        <SliderRow label="X" value={pos[0]} min={-20} max={20} step={0.1}
          onLive={(v) => updateVFX(placement.id, { position: [v, pos[1], pos[2]] })}
          onCommit={(v) => updateVFX(placement.id, { position: [v, pos[1], pos[2]] })} />
        <SliderRow label="Y" value={pos[1]} min={-5} max={10} step={0.1}
          onLive={(v) => updateVFX(placement.id, { position: [pos[0], v, pos[2]] })}
          onCommit={(v) => updateVFX(placement.id, { position: [pos[0], v, pos[2]] })} />
        <SliderRow label="Z" value={pos[2]} min={-15} max={10} step={0.1}
          onLive={(v) => updateVFX(placement.id, { position: [pos[0], pos[1], v] })}
          onCommit={(v) => updateVFX(placement.id, { position: [pos[0], pos[1], v] })} />
      </Section>
      <Section title="Scale">
        <SliderRow label="Scale" value={placement.scale} min={0.1} max={5} step={0.1}
          onLive={(v) => updateVFX(placement.id, { scale: v })}
          onCommit={(v) => updateVFX(placement.id, { scale: v })} />
      </Section>
      <button className="btn-danger" onClick={() => removeVFX(placement.id)}>Remove</button>
    </div>
  )
}

// ── root component — priority: vfx > bg > prop > empty ────────────────────

export function PropertiesPanel() {
  const selectedVFXId = useSceneStore((s) => s.selectedVFXId)
  const selectedBgId = useSceneStore((s) => s.selectedBgId)
  const selectedId = useSceneStore((s) => s.selectedId)

  if (selectedVFXId) return <VFXPanel />
  if (selectedBgId) return <BgPanel />
  if (selectedId) return <PropPanel />

  return (
    <div className="properties-panel empty">
      <p>Select a prop to edit</p>
    </div>
  )
}
