import { useEffect, useState } from 'react'
import { ArenaViewport } from './scene/arena-viewport'
import { AssetBrowser } from './panels/asset-browser'
import { PropertiesPanel } from './panels/properties-panel'
import { LightingPanel } from './panels/lighting-panel'
import { CodePreview } from './ui/code-preview'
import { SceneObjectsList } from './ui/scene-objects-list'
import { useSceneStore } from './store/scene-store'

/** Global keyboard shortcuts — Escape, Delete, Ctrl+Z/Y/D */
function KeyboardShortcuts() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Don't intercept while typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const { setPendingAsset, deleteSelected, duplicateSelected, undo, redo } =
        useSceneStore.getState()

      if (e.key === 'Escape') {
        setPendingAsset(null)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey)
      ) {
        e.preventDefault()
        redo()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        duplicateSelected()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return null
}

export function App() {
  const pendingAsset = useSceneStore((s) => s.pendingAsset)
  const canUndo = useSceneStore((s) => s.history.length > 0)
  const canRedo = useSceneStore((s) => s.future.length > 0)
  const undo = useSceneStore((s) => s.undo)
  const redo = useSceneStore((s) => s.redo)
  const [cameraMode, setCameraMode] = useState(false)

  return (
    <div className="layout">
      <KeyboardShortcuts />
      {/* Leva lighting panel — renders as floating overlay, returns null from component */}
      <LightingPanel />

      {/* Left column — asset browser */}
      <div className="left-col">
        <AssetBrowser />
      </div>

      {/* Centre — 3D viewport */}
      <div className={`canvas-area ${!cameraMode && pendingAsset ? 'placing' : ''}`}>
        <ArenaViewport cameraMode={cameraMode} />

        {/* Top-left toolbar: undo / redo */}
        <div className="viewport-toolbar">
          <button className="toolbar-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">↩ Undo</button>
          <button className="toolbar-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">↪ Redo</button>
        </div>

        {/* Top-right: camera orbit toggle */}
        <button
          className={`cam-toggle-btn ${cameraMode ? 'active' : ''}`}
          onClick={() => setCameraMode((v) => !v)}
          title={cameraMode ? 'Camera mode ON — click to switch back to placement' : 'Switch to camera orbit mode'}
        >
          {cameraMode ? '🎥 Orbit ON' : '🎥 Orbit'}
        </button>
        <SceneObjectsList />
        <CodePreview />
      </div>

      {/* Right column — properties panel */}
      <div className="right-col">
        <PropertiesPanel />
      </div>
    </div>
  )
}
