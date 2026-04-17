import { useState, useEffect } from 'react'
import { useSceneStore } from '../store/scene-store'
import { atmosphericPresets } from '../vfx/atmospheric-presets'
import { BIOME_TEMPLATES } from '../templates/biome-templates'
import type { PendingAsset } from '../store/scene-types'

interface AssetManifest {
  props3D: { cave: string[]; forest: string[] }
  tiles: string[]
  bgLayers: { cave: string[]; forest: string[] }
  dioramas: string[]
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="asset-section">
      <button className="asset-section-header" onClick={() => setOpen((v) => !v)}>
        {open ? '▼' : '▶'} {title}
      </button>
      {open && <div className="asset-section-body">{children}</div>}
    </div>
  )
}

function AssetItem({ label, active, onClick }: {
  label: string; active: boolean; onClick: () => void
}) {
  return (
    <button className={`asset-item ${active ? 'active' : ''}`} onClick={onClick} title={label}>
      🗃️ {label}
    </button>
  )
}

/** Left-column panel — lists all game assets grouped by type. Click to select for placement. */
export function AssetBrowser() {
  const [manifest, setManifest] = useState<AssetManifest | null>(null)
  const pendingAsset = useSceneStore((s) => s.pendingAsset)
  const setPendingAsset = useSceneStore((s) => s.setPendingAsset)
  const addBgLayer = useSceneStore((s) => s.addBgLayer)
  const setDiorama = useSceneStore((s) => s.setDiorama)
  const biome = useSceneStore((s) => s.biome)
  const setBiome = useSceneStore((s) => s.setBiome)
  const diorama = useSceneStore((s) => s.diorama)
  const loadScene = useSceneStore((s) => s.loadScene)

  useEffect(() => {
    fetch('/api/asset-manifest')
      .then((r) => r.json())
      .then(setManifest)
  }, [])

  function handleProp(src: string) {
    setPendingAsset({ type: 'prop3D', src })
  }

  function handleBg(src: string) {
    addBgLayer(src)  // BG layers add immediately — no click-to-place needed
  }

  function handleDiorama(src: string) {
    setDiorama({ src, scale: 12, y: -1 })
  }

  function handleVFX(id: string) {
    setPendingAsset({ type: 'vfx', src: id })
  }

  function isActive(asset: PendingAsset) {
    return pendingAsset?.src === asset.src && pendingAsset?.type === asset.type
  }

  const filename = (src: string) => src.split('/').pop() ?? src

  return (
    <div className="asset-browser">
      {/* Load template */}
      <Section title="Load Template">
        {BIOME_TEMPLATES.map((t) => (
          <button
            key={t.biome}
            className="asset-item load-template-btn"
            onClick={() => loadScene(t)}
            title={`Load ${t.label} — replaces current scene (undoable)`}
          >
            {t.label}
          </button>
        ))}
      </Section>

      {/* Biome selector */}
      <div className="biome-selector">
        <button
          className={`biome-btn ${biome === 'cave' ? 'active' : ''}`}
          onClick={() => setBiome('cave')}
        >Cave</button>
        <button
          className={`biome-btn ${biome === 'forest' ? 'active' : ''}`}
          onClick={() => setBiome('forest')}
        >Forest</button>
      </div>

      <Section title="Dioramas">
        {manifest?.dioramas.map((src) => (
          <button
            key={src}
            className={`asset-item ${diorama?.src === src ? 'active' : ''}`}
            onClick={() => handleDiorama(src)}
            title={src}
          >
            🏔️ {filename(src)}
          </button>
        ))}
      </Section>

      <Section title="BG Layers (Cave)">
        {manifest?.bgLayers.cave.map((src) => (
          <AssetItem key={src} label={filename(src)} active={false} onClick={() => handleBg(src)} />
        ))}
      </Section>

      <Section title="BG Layers (Forest)">
        {manifest?.bgLayers.forest.map((src) => (
          <AssetItem key={src} label={filename(src)} active={false} onClick={() => handleBg(src)} />
        ))}
      </Section>

      <Section title="3D Props (Cave)">
        {manifest?.props3D.cave.map((src) => (
          <AssetItem
            key={src} label={filename(src)}
            active={isActive({ type: 'prop3D', src })}
            onClick={() => handleProp(src)}
          />
        ))}
      </Section>

      <Section title="3D Props (Forest)">
        {manifest?.props3D.forest.map((src) => (
          <AssetItem
            key={src} label={filename(src)}
            active={isActive({ type: 'prop3D', src })}
            onClick={() => handleProp(src)}
          />
        ))}
      </Section>

      <Section title="Tiles">
        {manifest?.tiles.map((src) => (
          <AssetItem
            key={src} label={filename(src)}
            active={isActive({ type: 'tile', src })}
            onClick={() => setPendingAsset({ type: 'tile', src })}
          />
        ))}
      </Section>

      <Section title="VFX Presets">
        {atmosphericPresets.map((preset) => (
          <button
            key={preset.id}
            className={`asset-item ${isActive({ type: 'vfx', src: preset.id }) ? 'active' : ''}`}
            onClick={() => handleVFX(preset.id)}
            title={preset.description}
          >
            ✨ {preset.name}
          </button>
        ))}
      </Section>
    </div>
  )
}
