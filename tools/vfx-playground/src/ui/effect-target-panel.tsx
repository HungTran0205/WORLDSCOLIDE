import { useState } from 'react'
import type {
  EffectTargetState,
  EffectTargetMode,
  MotionPathKind,
  CharacterAnchor,
} from '../scene/effect-target'

interface Props {
  target: EffectTargetState
  onChange: (next: EffectTargetState) => void
}

const MODES: { value: EffectTargetMode; label: string; emoji: string }[] = [
  { value: 'world', label: 'World (fixed)', emoji: '📍' },
  { value: 'motion', label: 'Motion Path', emoji: '➡️' },
  { value: 'character', label: 'Character Anchor', emoji: '🧍' },
]

const MOTION_KINDS: MotionPathKind[] = ['linear', 'arc', 'sine', 'orbit', 'pingpong']
const ANCHORS: CharacterAnchor[] = ['center', 'head', 'hand', 'feet']

export function EffectTargetPanel({ target, onChange }: Props) {
  const [open, setOpen] = useState(true)

  const setMode = (mode: EffectTargetMode) => onChange({ ...target, mode })

  const setWorldAxis = (i: 0 | 1 | 2, v: number) => {
    const next = [...target.worldPosition] as [number, number, number]
    next[i] = v
    onChange({ ...target, worldPosition: next })
  }

  const setMotionAxis = (
    field: 'start' | 'end',
    i: 0 | 1 | 2,
    v: number,
  ) => {
    const arr = [...target.motion[field]] as [number, number, number]
    arr[i] = v
    onChange({ ...target, motion: { ...target.motion, [field]: arr } })
  }

  const setMotion = <K extends keyof typeof target.motion>(
    key: K,
    value: (typeof target.motion)[K],
  ) => {
    onChange({ ...target, motion: { ...target.motion, [key]: value } })
  }

  return (
    <div className="character-panel">
      <div
        className={`panel-header ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>🎯</span>
        <span>Effect Target</span>
        <span className="arrow">▶</span>
      </div>
      {open && (
        <div className="panel-body">
          <label className="field">
            <span>Mode</span>
            <select
              value={target.mode}
              onChange={e => setMode(e.target.value as EffectTargetMode)}
            >
              {MODES.map(m => (
                <option key={m.value} value={m.value}>
                  {m.emoji} {m.label}
                </option>
              ))}
            </select>
          </label>

          {target.mode === 'world' && (
            <div className="field vec3">
              <span>World position (x, y, z)</span>
              <div className="vec3-inputs">
                {([0, 1, 2] as const).map(i => (
                  <input
                    key={i}
                    type="number"
                    step={0.1}
                    value={target.worldPosition[i]}
                    onChange={e =>
                      setWorldAxis(i, parseFloat(e.target.value) || 0)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {target.mode === 'character' && (
            <label className="field">
              <span>Character Anchor</span>
              <select
                value={target.characterAnchor}
                onChange={e =>
                  onChange({
                    ...target,
                    characterAnchor: e.target.value as CharacterAnchor,
                  })
                }
              >
                {ANCHORS.map(a => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          )}

          {target.mode === 'motion' && (
            <>
              <label className="field">
                <span>Path kind</span>
                <select
                  value={target.motion.kind}
                  onChange={e => setMotion('kind', e.target.value as MotionPathKind)}
                >
                  {MOTION_KINDS.map(k => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field vec3">
                <span>Start (x, y, z)</span>
                <div className="vec3-inputs">
                  {([0, 1, 2] as const).map(i => (
                    <input
                      key={i}
                      type="number"
                      step={0.1}
                      value={target.motion.start[i]}
                      onChange={e =>
                        setMotionAxis('start', i, parseFloat(e.target.value) || 0)
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="field vec3">
                <span>End (x, y, z)</span>
                <div className="vec3-inputs">
                  {([0, 1, 2] as const).map(i => (
                    <input
                      key={i}
                      type="number"
                      step={0.1}
                      value={target.motion.end[i]}
                      onChange={e =>
                        setMotionAxis('end', i, parseFloat(e.target.value) || 0)
                      }
                    />
                  ))}
                </div>
              </div>

              <label className="field">
                <span>Duration (s): {target.motion.duration.toFixed(2)}</span>
                <input
                  type="range"
                  min={0.2}
                  max={6}
                  step={0.1}
                  value={target.motion.duration}
                  onChange={e => setMotion('duration', parseFloat(e.target.value))}
                />
              </label>

              {(target.motion.kind === 'arc') && (
                <label className="field">
                  <span>Arc Height: {target.motion.height.toFixed(2)}</span>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.1}
                    value={target.motion.height}
                    onChange={e => setMotion('height', parseFloat(e.target.value))}
                  />
                </label>
              )}

              {target.motion.kind === 'sine' && (
                <label className="field">
                  <span>Sine Amplitude: {target.motion.amplitude.toFixed(2)}</span>
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={0.05}
                    value={target.motion.amplitude}
                    onChange={e => setMotion('amplitude', parseFloat(e.target.value))}
                  />
                </label>
              )}

              <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={target.motion.loop}
                  onChange={e => setMotion('loop', e.target.checked)}
                />
                <span>Loop motion</span>
              </label>
            </>
          )}
        </div>
      )}
    </div>
  )
}
