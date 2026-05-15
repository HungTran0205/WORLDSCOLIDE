import { useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { WebGPURenderer } from 'three/webgpu'
import type { VfxPreset, MeshlinePreset } from '../presets/preset-types'
import type { CharacterConfig } from '../sprites/animated-character'
import { AnimatedCharacter } from '../sprites/animated-character'
import { EffectTarget, type EffectTargetState } from '../scene/effect-target'
import { PostProcessingBloom } from '../scene/post-processing-bloom'
import { Sidebar, type SidebarHandle } from './sidebar'
import { PresetSearch } from './preset-search'
import { allPresets } from '../presets/preset-registry'
import { CharacterPanel } from './character-panel'
import { EffectTargetPanel } from './effect-target-panel'
import { BloomPanel, type BloomState } from './bloom-panel'
import { MeshlineTweakPanel } from './meshline-tweak-panel'
import { EffectConfigPanel } from './effect-config-panel'
import type { ParticlesPreset } from '../presets/preset-types'
import { CodePanel } from './code-panel'
import { SceneSetup } from '../scene-setup'
import { MeshlineEffect } from '../scene/meshline-effect'
import { AllPresetParticles } from '../scene/all-preset-particles'
import { EffectPreviewEmitter } from '../scene/effect-preview-emitter'
import { ModeTabs, type AppMode } from './mode-tabs'
import { SequencerLayout } from '../sequencer/sequencer-layout'

interface Props {
  mode: AppMode
  onModeChange: (m: AppMode) => void
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
  mode,
  onModeChange,
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
  const [query, setQuery] = useState('')
  const sidebarRef = useRef<SidebarHandle>(null)

  const matchCount = useMemo(() => {
    if (!query) return allPresets.length
    const q = query.toLowerCase()
    return allPresets.filter(p =>
      `${p.id} ${p.name} ${p.description}`.toLowerCase().includes(q),
    ).length
  }, [query])

  return (
    <div className="app-wrapper">
      <ModeTabs mode={mode} onChange={onModeChange} />

      {mode === 'sequencer' ? (
        <SequencerLayout />
      ) : (
        <div className="effect-mode-shell">
          <div className="layout">
            <div className="left-col">
            <div className="left-col-header">
              <span className="brand-icon">✨</span>
              <span className="brand-mini">VFX</span>
              <div className="left-col-filter-slot">
                <PresetSearch
                  query={query}
                  onQueryChange={setQuery}
                  matchCount={matchCount}
                  total={allPresets.length}
                  onArrowDown={() => sidebarRef.current?.focusFirstResult()}
                  onSubmitFirst={() => sidebarRef.current?.selectFirstMatch()}
                />
              </div>
            </div>
            <div className="left-col-scroll scrollable">
              <Sidebar
                ref={sidebarRef}
                activePreset={activePreset}
                onSelect={onPresetChange}
                query={query}
              />
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
          </div>

          <div className="canvas-area">
            <Canvas
              gl={({ canvas }) => createWebGPURenderer(canvas as HTMLCanvasElement)}
              frameloop="always"
            >
              <SceneSetup />
              <AllPresetParticles />
              {characterConfig && <AnimatedCharacter config={characterConfig} />}
              <EffectTarget target={target} character={characterConfig}>
                {activePreset?.kind === 'meshline' ? (
                  <MeshlineEffect preset={activePreset} />
                ) : activePreset ? (
                  <EffectPreviewEmitter preset={activePreset} />
                ) : null}
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

          {activePreset && activePreset.kind !== 'meshline' && (
            <EffectConfigPanel
              preset={activePreset as ParticlesPreset}
              onChange={onPresetUpdate}
            />
          )}
        </div>
      )}
    </div>
  )
}
