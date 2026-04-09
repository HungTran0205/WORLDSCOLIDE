import { Canvas } from '@react-three/fiber'
import { WebGPURenderer } from 'three/webgpu'
import type { VfxPreset } from '../presets/preset-types'
import { Sidebar } from './sidebar'
import { CodePanel } from './code-panel'
import { SceneSetup } from '../scene-setup'
import { EffectRenderer } from '../effect-renderer'

interface Props {
  activePreset: VfxPreset | null
  onPresetChange: (preset: VfxPreset) => void
}

async function createWebGPURenderer(canvas: HTMLCanvasElement) {
  const renderer = new WebGPURenderer({
    canvas,
    antialias: true,
    alpha: true,
  })
  await renderer.init()
  return renderer
}

export function Layout({ activePreset, onPresetChange }: Props) {
  return (
    <div className="layout">
      <Sidebar activePreset={activePreset} onSelect={onPresetChange} />

      <div className="canvas-area">
        <Canvas
          gl={({ canvas }) => createWebGPURenderer(canvas as HTMLCanvasElement)}
          frameloop="always"
        >
          <SceneSetup />
          {activePreset && <EffectRenderer preset={activePreset} />}
        </Canvas>

        {!activePreset && (
          <div className="empty-state" style={{ position: 'absolute', inset: 0 }}>
            <div className="icon">🎮</div>
            <p>Select an effect preset from the sidebar</p>
            <p style={{ fontSize: 12, opacity: 0.5 }}>
              Use the debug panel to tweak, then copy the code
            </p>
          </div>
        )}
      </div>

      <CodePanel preset={activePreset} />
    </div>
  )
}
