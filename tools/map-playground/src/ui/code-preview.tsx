import { useState } from 'react'
import { useSceneStore } from '../store/scene-store'
import { generateBiomeConfig } from '../codegen/generate-biome-config'

/** Bottom-of-canvas panel — generates BiomeConfig TypeScript and copies to clipboard. */
export function CodePreview() {
  const [copied, setCopied] = useState(false)
  const [previewCode, setPreviewCode] = useState('')

  const placedProps = useSceneStore((s) => s.placedProps)
  const bgLayers = useSceneStore((s) => s.bgLayers)
  const lighting = useSceneStore((s) => s.lighting)
  const vfxPlacements = useSceneStore((s) => s.vfxPlacements)
  const biome = useSceneStore((s) => s.biome)
  const diorama = useSceneStore((s) => s.diorama)

  function handleGenerate() {
    const code = generateBiomeConfig({
      biome,
      configName: biome === 'cave' ? 'CAVE_CONFIG' : 'FOREST_CONFIG',
      diorama,
      placedProps,
      bgLayers,
      lighting,
      vfxPlacements,
    })
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
    setPreviewCode(code)
  }

  return (
    <div className="code-preview">
      <div className="code-preview-toolbar">
        <button className="btn-generate" onClick={handleGenerate}>
          {copied ? '✅ Copied!' : '📋 Generate TS'}
        </button>
        <span className="code-preview-hint">Paste into arena-biome-config.ts</span>
        {previewCode && (
          <button className="btn-clear" onClick={() => setPreviewCode('')}>✕</button>
        )}
      </div>
      {previewCode && (
        <pre className="code-preview-content">
          <code>{previewCode}</code>
        </pre>
      )}
    </div>
  )
}
