import { useState } from 'react'

export interface BloomState {
  enabled: boolean
  strength: number
  radius: number
  threshold: number
}

export const DEFAULT_BLOOM: BloomState = {
  enabled: true,
  strength: 1.2,
  radius: 0.6,
  threshold: 0.3,
}

interface Props {
  bloom: BloomState
  onChange: (next: BloomState) => void
}

export function BloomPanel({ bloom, onChange }: Props) {
  const [open, setOpen] = useState(true)

  const update = <K extends keyof BloomState>(key: K, value: BloomState[K]) =>
    onChange({ ...bloom, [key]: value })

  return (
    <div className="character-panel">
      <div
        className={`panel-header ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>🌟</span>
        <span>Bloom (WebGPU)</span>
        <span className="arrow">▶</span>
      </div>
      {open && (
        <div className="panel-body">
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={bloom.enabled}
              onChange={e => update('enabled', e.target.checked)}
            />
            <span>Enable bloom postprocessing</span>
          </label>

          <label className="field">
            <span>Strength: {bloom.strength.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.05}
              value={bloom.strength}
              onChange={e => update('strength', parseFloat(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Radius: {bloom.radius.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={bloom.radius}
              onChange={e => update('radius', parseFloat(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Threshold: {bloom.threshold.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={bloom.threshold}
              onChange={e => update('threshold', parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  )
}
