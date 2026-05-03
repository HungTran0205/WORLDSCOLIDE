import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { WebGPURenderer } from 'three/webgpu'
import { SceneSetup } from '../scene-setup'
import { EffectTarget, DEFAULT_TARGET } from '../scene/effect-target'
import { PostProcessingBloom } from '../scene/post-processing-bloom'
import { AnimatedCharacter, type CharacterConfig } from '../sprites/animated-character'
import { CharacterPanel } from '../ui/character-panel'
import { SkillEngineCtx, NoopEngineAdapter } from './engine-adapters'
import { SequenceMeshlineRenderer } from './sequence-meshline-renderer'
import { AllPresetParticles } from '../scene/all-preset-particles'
import { CameraEffectController } from './camera-effect-controller'
import { useSequenceRuntime } from './use-sequence-runtime'
import { useSkillLibrary } from './skill-library'
import { TimelineDaw } from './views/timeline-daw'
import { ClipInspector } from './clip-inspector'
import { SkillPicker } from './skill-picker'
import { ExportDialog } from './export-dialog'

async function createWebGPURenderer(canvas: HTMLCanvasElement) {
  const renderer = new WebGPURenderer({ canvas, antialias: true, alpha: true })
  await renderer.init()
  return renderer
}

export function SequencerLayout() {
  const {
    library, activeSkill, setActiveId,
    createSkill, duplicateSkill, deleteSkill, updateSkill,
    exportLibrary, importLibrary,
  } = useSkillLibrary()

  const { state, play, pause, stop, scrub } = useSequenceRuntime(activeSkill)
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [characterConfig, setCharacterConfig] = useState<CharacterConfig | null>(null)
  const [targetConfig, setTargetConfig] = useState<CharacterConfig | null>(null)
  const [zoom, setZoom] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem('vfx-seq:zoom') ?? '1')
    return Number.isFinite(v) && v > 0 ? v : 1
  })
  const [snapMs, setSnapMs] = useState<number | null>(() => {
    const raw = localStorage.getItem('vfx-seq:snap')
    if (raw === 'null') return null
    const v = parseInt(raw ?? '100', 10)
    return Number.isFinite(v) ? v : 100
  })

  // Reset clip selection when switching skills
  useEffect(() => { setSelectedClipId(null) }, [activeSkill?.id])

  // Persist zoom + snap
  useEffect(() => { localStorage.setItem('vfx-seq:zoom', String(zoom)) }, [zoom])
  useEffect(() => {
    localStorage.setItem('vfx-seq:snap', snapMs === null ? 'null' : String(snapMs))
  }, [snapMs])

  // Transport keyboard shortcuts (Space, Home, End, ←/→).
  // Latest state via refs so the listener doesn't re-bind every tick.
  const stateRef = useRef(state)
  stateRef.current = state
  const skillRef = useRef(activeSkill)
  skillRef.current = activeSkill
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ae = document.activeElement
      const tag = ae?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'select' || tag === 'textarea' || (ae as HTMLElement | null)?.isContentEditable) return
      const skill = skillRef.current
      const s = stateRef.current
      if (e.key === ' ') {
        e.preventDefault()
        if (s.isPlaying) pause(); else play()
      } else if (e.key === 'Home') {
        e.preventDefault()
        scrub(0)
      } else if (e.key === 'End' && skill) {
        e.preventDefault()
        scrub(skill.duration)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        scrub(Math.max(0, s.time - (e.shiftKey ? 1000 : 100)))
      } else if (e.key === 'ArrowRight' && skill) {
        e.preventDefault()
        scrub(Math.min(skill.duration, s.time + (e.shiftKey ? 1000 : 100)))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [play, pause, scrub])

  const selectedClip = activeSkill?.clips.find(c => c.id === selectedClipId) ?? null

  return (
    <SkillEngineCtx.Provider value={NoopEngineAdapter}>
      <div className="sequencer-layout">
        {/* Top bar */}
        <div className="seq-topbar">
          <SkillPicker
            library={library}
            activeId={activeSkill?.id ?? null}
            onSelect={setActiveId}
            onCreate={createSkill}
            onDuplicate={duplicateSkill}
            onDelete={deleteSkill}
            onExport={exportLibrary}
            onImport={importLibrary}
          />
          <div className="picker-divider" />
          <button className="seq-export-btn" onClick={() => setShowExport(true)}>
            📤 Export .tsx
          </button>
        </div>

        {/* Main: canvas left, timeline+inspector right */}
        <div className="seq-main">
          <div className="seq-canvas-area">
            <Canvas
              gl={({ canvas }) => createWebGPURenderer(canvas as HTMLCanvasElement)}
              frameloop="always"
            >
              <SceneSetup />
              <AllPresetParticles />
              {characterConfig && <AnimatedCharacter config={characterConfig} />}
              {targetConfig && <AnimatedCharacter config={targetConfig} />}
              <EffectTarget target={DEFAULT_TARGET} character={characterConfig}>
                {activeSkill && <SequenceMeshlineRenderer runtime={state} />}
              </EffectTarget>
              <PostProcessingBloom strength={1.2} radius={0.6} threshold={0.3} />
              <CameraEffectController liveClips={state.liveClips} />
            </Canvas>
          </div>

          <div className="seq-right-col">
            {/* Playback controls */}
            <div className="seq-controls">
              <button
                onClick={state.isPlaying ? pause : play}
                title={state.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {state.isPlaying ? '⏸' : '▶'}
              </button>
              <button onClick={stop} title="Stop">⏹</button>
              <span className="seq-time">{(state.time / 1000).toFixed(2)}s</span>
              <input
                type="range"
                min={0}
                max={activeSkill?.duration ?? 2000}
                value={state.time}
                onChange={e => scrub(+e.target.value)}
                className="seq-scrub"
              />
              <div className="picker-divider" />
              <div className="zoom-controls" title="Timeline zoom">
                <button onClick={() => setZoom(z => Math.max(0.5, z / 1.5))}>−</button>
                <span className="zoom-readout">{zoom.toFixed(1)}×</span>
                <button onClick={() => setZoom(z => Math.min(8, z * 1.5))}>+</button>
                <button onClick={() => setZoom(1)} title="Reset zoom">Fit</button>
              </div>
              <select
                className="select-native snap-selector"
                value={snapMs === null ? 'null' : String(snapMs)}
                onChange={e => setSnapMs(e.target.value === 'null' ? null : parseInt(e.target.value, 10))}
                title="Grid snap (Alt to bypass during drag)"
              >
                <option value="null">No snap</option>
                <option value="50">Snap 50ms</option>
                <option value="100">Snap 100ms</option>
                <option value="250">Snap 250ms</option>
                <option value="500">Snap 500ms</option>
              </select>
              <span className="kbd-hint" title="Space play, Home/End seek, ← → step">⌨ Space ← →</span>
            </div>

            {activeSkill && (
              <TimelineDaw
                sequence={activeSkill}
                onChange={updateSkill}
                selectedClipId={selectedClipId}
                onSelectClip={setSelectedClipId}
                currentTime={state.time}
                zoom={zoom}
                snapMs={snapMs}
              />
            )}

            <div className="seq-right-scroll scrollable">
              {selectedClip && activeSkill && (
                <ClipInspector
                  clip={selectedClip}
                  sequence={activeSkill}
                  onChange={updateSkill}
                />
              )}

              {/* Character sprite panel */}
              <CharacterPanel config={characterConfig} onChange={setCharacterConfig} />
              {/* Target (enemy) sprite panel */}
              <CharacterPanel
                config={targetConfig}
                onChange={setTargetConfig}
                source="enemies"
                label="Target Sprite"
                defaultPosition={[3, 1, 0]}
              />
            </div>
          </div>
        </div>

        {showExport && activeSkill && (
          <ExportDialog sequence={activeSkill} onClose={() => setShowExport(false)} />
        )}
      </div>
    </SkillEngineCtx.Provider>
  )
}
