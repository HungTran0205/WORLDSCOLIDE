import { useState } from 'react'
import type { MeshlinePreset, MeshlineShapeParams } from '../presets/preset-types'

interface Props {
  preset: MeshlinePreset
  onChange: (next: MeshlinePreset) => void
}

export function MeshlineTweakPanel({ preset, onChange }: Props) {
  const [open, setOpen] = useState(true)

  const update = <K extends keyof MeshlinePreset>(key: K, value: MeshlinePreset[K]) =>
    onChange({ ...preset, [key]: value })

  const updateParam = <K extends keyof MeshlineShapeParams>(
    key: K,
    value: MeshlineShapeParams[K],
  ) => {
    onChange({ ...preset, shapeParams: { ...preset.shapeParams, [key]: value } })
  }

  const updateRotation = (i: 0 | 1 | 2, v: number) => {
    const r = (preset.rotation ?? [0, 0, 0]).slice() as [number, number, number]
    r[i] = v
    onChange({ ...preset, rotation: r })
  }

  const updateXYZ = (
    field: 'start' | 'end',
    i: 0 | 1 | 2,
    v: number,
  ) => {
    const cur = (preset.shapeParams[field] ?? [0, 0, 0]).slice() as [number, number, number]
    cur[i] = v
    updateParam(field, cur)
  }

  const rot = preset.rotation ?? [0, 0, 0]

  return (
    <div className="character-panel">
      <div
        className={`panel-header ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>🎛️</span>
        <span>Meshline Tweak</span>
        <span className="arrow">▶</span>
      </div>
      {open && (
        <div className="panel-body">
          <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}>Color</span>
            <input
              type="color"
              value={preset.color}
              onChange={e => update('color', e.target.value)}
              style={{ width: 40, height: 24, border: 'none', background: 'transparent' }}
            />
          </div>

          <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}>Gradient</span>
            <input
              type="color"
              value={preset.gradientColor ?? '#ffffff'}
              onChange={e => update('gradientColor', e.target.value)}
              style={{ width: 40, height: 24, border: 'none', background: 'transparent' }}
            />
            <button
              type="button"
              onClick={() => update('gradientColor', undefined)}
              style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: 3, padding: '2px 6px', fontSize: 10, cursor: 'pointer' }}
            >
              clear
            </button>
          </div>

          <label className="field">
            <span>Line Width: {preset.lineWidth}</span>
            <input
              type="range"
              min={1}
              max={60}
              step={1}
              value={preset.lineWidth}
              onChange={e => update('lineWidth', parseInt(e.target.value))}
            />
          </label>

          <label className="field">
            <span>Opacity: {preset.opacity.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={preset.opacity}
              onChange={e => update('opacity', parseFloat(e.target.value))}
            />
          </label>

          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={preset.additive}
              onChange={e => update('additive', e.target.checked)}
            />
            <span>Additive blending (glow)</span>
          </label>

          <div className="field vec3">
            <span>Rotation (rad x, y, z)</span>
            <div className="vec3-inputs">
              {([0, 1, 2] as const).map(i => (
                <input
                  key={i}
                  type="number"
                  step={0.05}
                  value={rot[i]}
                  onChange={e => updateRotation(i, parseFloat(e.target.value) || 0)}
                />
              ))}
            </div>
          </div>

          {/* Shape-specific params */}
          {(preset.shape === 'arc' || preset.shape === 'circle' || preset.shape === 'spiral') && (
            <label className="field">
              <span>Radius: {(preset.shapeParams.radius ?? 1).toFixed(2)}</span>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.05}
                value={preset.shapeParams.radius ?? 1}
                onChange={e => updateParam('radius', parseFloat(e.target.value))}
              />
            </label>
          )}

          {preset.shape === 'arc' && (
            <label className="field">
              <span>Arc Angle: {((preset.shapeParams.arcAngle ?? Math.PI) / Math.PI).toFixed(2)}π</span>
              <input
                type="range"
                min={0.1}
                max={Math.PI * 2}
                step={0.05}
                value={preset.shapeParams.arcAngle ?? Math.PI}
                onChange={e => updateParam('arcAngle', parseFloat(e.target.value))}
              />
            </label>
          )}

          {preset.shape === 'sine' && (
            <>
              <label className="field">
                <span>Wavelengths: {preset.shapeParams.wavelengths ?? 4}</span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={preset.shapeParams.wavelengths ?? 4}
                  onChange={e => updateParam('wavelengths', parseInt(e.target.value))}
                />
              </label>
              <label className="field">
                <span>Amplitude: {(preset.shapeParams.amplitude ?? 0.3).toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={preset.shapeParams.amplitude ?? 0.3}
                  onChange={e => updateParam('amplitude', parseFloat(e.target.value))}
                />
              </label>
              <label className="field">
                <span>Length: {(preset.shapeParams.length ?? 4).toFixed(2)}</span>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.1}
                  value={preset.shapeParams.length ?? 4}
                  onChange={e => updateParam('length', parseFloat(e.target.value))}
                />
              </label>
            </>
          )}

          {preset.shape === 'spiral' && (
            <>
              <label className="field">
                <span>Spiral Turns: {preset.shapeParams.spiralTurns ?? 4}</span>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={preset.shapeParams.spiralTurns ?? 4}
                  onChange={e => updateParam('spiralTurns', parseInt(e.target.value))}
                />
              </label>
              <label className="field">
                <span>Spiral Height: {(preset.shapeParams.spiralHeight ?? 2).toFixed(2)}</span>
                <input
                  type="range"
                  min={0.2}
                  max={6}
                  step={0.1}
                  value={preset.shapeParams.spiralHeight ?? 2}
                  onChange={e => updateParam('spiralHeight', parseFloat(e.target.value))}
                />
              </label>
            </>
          )}

          {preset.shape === 'line' && (
            <>
              <div className="field vec3">
                <span>Start (x, y, z)</span>
                <div className="vec3-inputs">
                  {([0, 1, 2] as const).map(i => (
                    <input
                      key={i}
                      type="number"
                      step={0.1}
                      value={(preset.shapeParams.start ?? [0, 0, 0])[i]}
                      onChange={e => updateXYZ('start', i, parseFloat(e.target.value) || 0)}
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
                      value={(preset.shapeParams.end ?? [1, 0, 0])[i]}
                      onChange={e => updateXYZ('end', i, parseFloat(e.target.value) || 0)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <label className="field">
            <span>Segments: {preset.shapeParams.segments ?? 32}</span>
            <input
              type="range"
              min={4}
              max={256}
              step={2}
              value={preset.shapeParams.segments ?? 32}
              onChange={e => updateParam('segments', parseInt(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  )
}
