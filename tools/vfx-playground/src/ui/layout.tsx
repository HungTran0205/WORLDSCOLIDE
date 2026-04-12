import { Canvas } from '@react-three/fiber'
import { WebGPURenderer } from 'three/webgpu'
import type { VfxPreset, MeshlinePreset } from '../presets/preset-types'
import type { CharacterConfig } from '../sprites/animated-character'
import { AnimatedCharacter } from '../sprites/animated-character'
import { EffectTarget, type EffectTargetState } from '../scene/effect-target'
import { PostProcessingBloom } from '../scene/post-processing-bloom'
import { Sidebar } from './sidebar'
import { CharacterPanel } from './character-panel'
import { EffectTargetPanel } from './effect-target-panel'
import { BloomPanel, type BloomState } from './bloom-panel'
import { MeshlineTweakPanel } from './meshline-tweak-panel'
import { CodePanel } from './code-panel'
import { SceneSetup } from '../scene-setup'
import { EffectRenderer } from '../effect-renderer'

interface Props {
  activePreset: VfxPreset | null
  onPresetChange: (preset: VfxPreset) => void
  onPresetUpdate: (preset: VfxPreset) => void
  characterConfig: CharacterConfig | null
  onCharacterChange: (cfg: CharacterConfig | null) => void
  target: EffectTargetState
  onTargetChange: (next: EffectTargetState) => void
  bloom: BloomState
  onBloomChange: (next: BloomState) => void
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

export function Layout({
  activePreset,
  onPresetChange,
  onPresetUpdate,
  characterConfig,
  onCharacterChange,
  target,
  onTargetChange,
  bloom,
  onBloomChange,
}: Props) {
  const isMeshline = activePreset?.kind === 'meshline'

  return (
    <div className="layout">
      <div className="left-col">
        <Sidebar activePreset={activePreset} onSelect={onPresetChange} />
        <CharacterPanel config={characterConfig} onChange={onCharacterChange} />
        <EffectTargetPanel target={target} onChange={onTargetChange} />
        {isMeshline && (
          <MeshlineTweakPanel
            preset={activePreset as MeshlinePreset}
            onChange={onPresetUpdate}
          />
        )}
        <BloomPanel bloom={bloom} onChange={onBloomChange} />
      </div>

      <div className="canvas-area">
        <Canvas
          gl={({ canvas }) => createWebGPURenderer(canvas as HTMLCanvasElement)}
          frameloop="always"
        >
          <SceneSetup />
          {characterConfig && <AnimatedCharacter config={characterConfig} />}
          <EffectTarget target={target} character={characterConfig}>
            {activePreset && <EffectRenderer preset={activePreset} />}
          </EffectTarget>
          {bloom.enabled && (
            <PostProcessingBloom
              strength={bloom.strength}
              radius={bloom.radius}
              threshold={bloom.threshold}
            />
          )}
        </Canvas>

        {!activePreset && !characterConfig && (
          <div className="empty-state" style={{ position: 'absolute', inset: 0 }}>
            <div className="icon">🎮</div>
            <p>Select an effect preset or character sprite</p>
            <p style={{ fontSize: 12, opacity: 0.5 }}>
              Particle presets show debug panel in viewport — meshline uses sidebar tweak panel
            </p>
          </div>
        )}
      </div>

      <CodePanel preset={activePreset} />
    </div>
  )
}
