import { useState, useEffect, useRef } from 'react'
import { EmitterShape, Appearance, Blending } from 'r3f-vfx'
import type { ParticlesPreset } from '../presets/preset-types'
import { presetById } from '../presets/preset-registry'
import { saveOverrides, clearOverrides, diffFromDefaults } from '../presets/preset-overrides-store'
import { Slider } from './controls/slider'
import { NumberInput } from './controls/number-input'
import { Vec3Input } from './controls/vec3-input'
import { ColorPicker } from './controls/color-picker'
import { Select } from './controls/select'
import { Toggle } from './controls/toggle'

interface Props {
  preset: ParticlesPreset
  onChange: (next: ParticlesPreset) => void
}

type DirectionRange = [[number, number], [number, number], [number, number]]

const DEFAULT_DIRECTION: DirectionRange = [[-0.3, 0.3], [0, 1], [-0.3, 0.3]]

const SHAPE_OPTIONS = [
  { value: EmitterShape.POINT, label: 'POINT' },
  { value: EmitterShape.BOX, label: 'BOX' },
  { value: EmitterShape.SPHERE, label: 'SPHERE' },
  { value: EmitterShape.CONE, label: 'CONE' },
  { value: EmitterShape.DISK, label: 'DISK' },
  { value: EmitterShape.EDGE, label: 'EDGE' },
] as { value: number; label: string }[]

const APPEARANCE_OPTIONS = [
  { value: Appearance.DEFAULT, label: 'DEFAULT (square sprite)' },
  { value: Appearance.CIRCULAR, label: 'CIRCULAR (sphere look)' },
  { value: Appearance.GRADIENT, label: 'GRADIENT' },
] as { value: string; label: string }[]

const BLENDING_OPTIONS = [
  { value: Blending.NORMAL, label: 'NORMAL' },
  { value: Blending.ADDITIVE, label: 'ADDITIVE (glow)' },
  { value: Blending.MULTIPLY, label: 'MULTIPLY' },
  { value: Blending.SUBTRACTIVE, label: 'SUBTRACTIVE' },
] as { value: number; label: string }[]

const RANGE = (v: unknown, fallback: [number, number]): [number, number] => {
  if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number') {
    return v as [number, number]
  }
  return fallback
}
const VEC3 = (v: unknown, fallback: [number, number, number]): [number, number, number] => {
  if (Array.isArray(v) && v.length === 3 && v.every(x => typeof x === 'number')) {
    return v as [number, number, number]
  }
  return fallback
}
const DIRECTION = (v: unknown): DirectionRange => {
  if (
    Array.isArray(v) && v.length === 3 &&
    v.every(r => Array.isArray(r) && r.length === 2 && typeof r[0] === 'number' && typeof r[1] === 'number')
  ) {
    return v as DirectionRange
  }
  return DEFAULT_DIRECTION
}

/**
 * Bottom-dock config panel for the active particle preset.
 *
 * Layout: 2 zones with visual separator
 *   • Runtime zone (left)   — applies to next emit() immediately, no reload needed.
 *                             Lib's `applySpawnOverrides` supports these.
 *   • Structural zone (right) — saved to localStorage; takes effect after page reload.
 *                               Lib doesn't support these as runtime overrides.
 *
 * Persistence: every change → debounced save to localStorage keyed by preset.id.
 * Runtime tweaks: visible immediately. Structural tweaks: refresh page (button provided).
 * Reset → clear that preset's saved entry + reload registry default into activePreset.
 */
export function EffectConfigPanel({ preset, onChange }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const lastSavedIdRef = useRef<string | null>(null)
  const props = preset.props as Record<string, unknown>

  useEffect(() => {
    const defaults = (presetById[preset.id] as ParticlesPreset | undefined)?.props ?? {}
    const diff = diffFromDefaults(preset.props, defaults)
    saveOverrides(preset.id, diff)
    lastSavedIdRef.current = preset.id
  }, [preset])

  const updateProps = (patch: Record<string, unknown>) => {
    onChange({ ...preset, props: { ...preset.props, ...patch } })
  }

  const reset = () => {
    clearOverrides(preset.id)
    const original = presetById[preset.id]
    if (original && original.kind !== 'meshline') {
      onChange(structuredClone(original) as ParticlesPreset)
    }
  }

  const refresh = () => window.location.reload()

  // ── Read current values ─────────────────────────────────────────
  const colorStart = (props.colorStart as string[] | undefined) ?? ['#ffffff']
  const colorEnd = (props.colorEnd as string[] | undefined) ?? colorStart
  const gravity = VEC3(props.gravity, [0, 0, 0])
  const fadeOpacity = RANGE(props.fadeOpacity, [1, 0])
  const fadeSize = RANGE(props.fadeSize, [1, 1])
  const direction = DIRECTION(props.direction)
  const shape = (props.emitterShape as number | undefined) ?? EmitterShape.POINT
  const emitterRadius = RANGE(props.emitterRadius, [0, 0.3])
  const emitterAngle = (props.emitterAngle as number | undefined) ?? Math.PI / 8
  const turbulence = props.turbulence as { intensity: number; frequency?: number; speed?: number } | null | undefined
  const maxParticles = (props.maxParticles as number | undefined) ?? 500
  const intensity = (props.intensity as number | undefined) ?? 1
  const lifetime = RANGE(props.lifetime, [1, 2])
  const speed = RANGE(props.speed, [0.1, 0.3])
  const size = RANGE(props.size, [0.05, 0.15])
  const appearance = (props.appearance as string | undefined) ?? Appearance.DEFAULT
  const blending = (props.blending as number | undefined) ?? Blending.NORMAL

  // Color override only works runtime if preset was mounted with per-particle color
  // setup (multi-color OR colorEnd present). Show hint when not.
  const hasPerParticleColor =
    (Array.isArray(presetById[preset.id]?.kind === 'meshline' ? null : (presetById[preset.id] as ParticlesPreset | undefined)?.props?.colorStart)
      && ((presetById[preset.id] as ParticlesPreset).props.colorStart!.length > 1))
    || ((presetById[preset.id] as ParticlesPreset | undefined)?.props?.colorEnd != null)

  if (collapsed) {
    return (
      <div
        className="effect-config-dock collapsed"
        role="button"
        tabIndex={0}
        title="Show effect config"
        onClick={() => setCollapsed(false)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollapsed(false) } }}
      >
        <span className="effect-config-collapsed-icon">⌃</span>
        <span className="effect-config-collapsed-label">
          Effect Config — {preset.name}
        </span>
      </div>
    )
  }

  return (
    <div className="effect-config-dock">
      <div className="effect-config-dock-header">
        <span className="effect-config-title">
          🎛 Config — <strong>{preset.name}</strong>
        </span>
        <div className="effect-config-actions">
          <button
            type="button"
            className="effect-config-refresh"
            onClick={refresh}
            title="Reload page to apply structural tweaks (maxParticles, gravity, fade, turbulence)"
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            className="effect-config-reset"
            onClick={reset}
            title="Reset to registry defaults (clears saved overrides)"
          >
            ↺ Reset
          </button>
          <button
            type="button"
            className="effect-config-collapse"
            onClick={() => setCollapsed(true)}
            title="Collapse"
            aria-label="Collapse config dock"
          >
            ⌄
          </button>
        </div>
      </div>

      <div className="effect-config-dock-body scrollable">
        {/* ═══ Runtime zone — applies immediately ═══ */}
        <div className="config-zone-label runtime">Runtime — applies on next emit</div>

        {/* Colors */}
        <div className="config-card runtime">
          <div className="config-card-title">
            Colors
            {!hasPerParticleColor && (
              <span className="structural-hint" title="Preset has single-color setup; runtime color override needs page refresh after first change">
                ⟳ refresh on first change
              </span>
            )}
          </div>
          <ColorPicker
            label="Start"
            value={colorStart[0] ?? '#ffffff'}
            onChange={v => {
              const arr = [...colorStart]
              arr[0] = v
              updateProps({ colorStart: arr })
            }}
          />
          <ColorPicker
            label="End"
            value={colorEnd[0] ?? '#ffffff'}
            onChange={v => {
              const arr = [...(colorEnd ?? [])]
              arr[0] = v
              updateProps({ colorEnd: arr })
            }}
          />
        </div>

        {/* Lifetime / Speed / Size */}
        <div className="config-card runtime">
          <div className="config-card-title">Motion</div>
          <Slider
            label="Lifetime min"
            unit="s"
            value={lifetime[0]}
            onChange={v => updateProps({ lifetime: [v, lifetime[1]] })}
            min={0.05} max={6} step={0.05}
          />
          <Slider
            label="Lifetime max"
            unit="s"
            value={lifetime[1]}
            onChange={v => updateProps({ lifetime: [lifetime[0], v] })}
            min={0.05} max={6} step={0.05}
          />
          <Slider
            label="Speed min"
            value={speed[0]}
            onChange={v => updateProps({ speed: [v, speed[1]] })}
            min={0} max={2} step={0.005}
            precision={3}
          />
          <Slider
            label="Speed max"
            value={speed[1]}
            onChange={v => updateProps({ speed: [speed[0], v] })}
            min={0} max={2} step={0.005}
            precision={3}
          />
          <Slider
            label="Size min"
            value={size[0]}
            onChange={v => updateProps({ size: [v, size[1]] })}
            min={0.01} max={2} step={0.01}
          />
          <Slider
            label="Size max"
            value={size[1]}
            onChange={v => updateProps({ size: [size[0], v] })}
            min={0.01} max={2} step={0.01}
          />
        </div>

        {/* Direction */}
        <div className="config-card runtime">
          <div className="config-card-title">Direction (range per axis)</div>
          {(['x', 'y', 'z'] as const).map((axis, i) => (
            <div key={axis} className="direction-row">
              <span className="direction-axis">{axis}</span>
              <NumberInput
                value={direction[i][0]}
                onChange={v => {
                  const next = direction.map(r => [...r]) as DirectionRange
                  next[i][0] = v
                  updateProps({ direction: next })
                }}
                step={0.05} precision={2}
                prefix="min"
              />
              <NumberInput
                value={direction[i][1]}
                onChange={v => {
                  const next = direction.map(r => [...r]) as DirectionRange
                  next[i][1] = v
                  updateProps({ direction: next })
                }}
                step={0.05} precision={2}
                prefix="max"
              />
            </div>
          ))}
        </div>

        {/* Emitter (spawn shape — NOT particle visual geometry) */}
        <div className="config-card runtime">
          <div className="config-card-title">Emitter Shape (spawn area)</div>
          <div className="field-row">
            <span className="field-label">Shape</span>
            <Select
              value={shape}
              onChange={v => updateProps({ emitterShape: Number(v) })}
              options={SHAPE_OPTIONS}
            />
          </div>
          <Slider
            label="Radius inner"
            value={emitterRadius[0]}
            onChange={v => updateProps({ emitterRadius: [v, emitterRadius[1]] })}
            min={0} max={3} step={0.05}
          />
          <Slider
            label="Radius outer"
            value={emitterRadius[1]}
            onChange={v => updateProps({ emitterRadius: [emitterRadius[0], v] })}
            min={0} max={3} step={0.05}
          />
          {shape === EmitterShape.CONE && (
            <Slider
              label="Cone angle (rad)"
              value={emitterAngle}
              onChange={v => updateProps({ emitterAngle: v })}
              min={0} max={Math.PI} step={0.05}
            />
          )}
        </div>

        {/* ═══ Structural zone — needs reload ═══ */}
        <div className="config-zone-divider" />
        <div className="config-zone-label structural">
          Structural — saved; refresh page to apply
        </div>

        {/* Gravity */}
        <div className="config-card structural">
          <div className="config-card-title">
            Gravity
            <span className="structural-hint">⟳ refresh</span>
          </div>
          <Vec3Input
            label="Vector"
            value={gravity}
            onChange={v => updateProps({ gravity: v })}
            step={0.1}
          />
        </div>

        {/* Fade */}
        <div className="config-card structural">
          <div className="config-card-title">
            Fade
            <span className="structural-hint">⟳ refresh</span>
          </div>
          <Slider
            label="Opacity start"
            value={fadeOpacity[0]}
            onChange={v => updateProps({ fadeOpacity: [v, fadeOpacity[1]] })}
            min={0} max={2} step={0.05}
          />
          <Slider
            label="Opacity end"
            value={fadeOpacity[1]}
            onChange={v => updateProps({ fadeOpacity: [fadeOpacity[0], v] })}
            min={0} max={2} step={0.05}
          />
          <Slider
            label="Size start"
            value={fadeSize[0]}
            onChange={v => updateProps({ fadeSize: [v, fadeSize[1]] })}
            min={0} max={2} step={0.05}
          />
          <Slider
            label="Size end"
            value={fadeSize[1]}
            onChange={v => updateProps({ fadeSize: [fadeSize[0], v] })}
            min={0} max={2} step={0.05}
          />
        </div>

        {/* Turbulence */}
        <div className="config-card structural">
          <div className="config-card-title">
            Turbulence
            <span className="structural-hint">⟳ refresh</span>
          </div>
          <Toggle
            label="Enabled"
            checked={!!turbulence}
            onChange={v => updateProps({
              turbulence: v ? { intensity: 1, frequency: 1, speed: 0.3 } : null,
            })}
          />
          {turbulence && (
            <>
              <Slider
                label="Intensity"
                value={turbulence.intensity}
                onChange={v => updateProps({ turbulence: { ...turbulence, intensity: v } })}
                min={0} max={5} step={0.1}
              />
              <Slider
                label="Frequency"
                value={turbulence.frequency ?? 1}
                onChange={v => updateProps({ turbulence: { ...turbulence, frequency: v } })}
                min={0.1} max={5} step={0.1}
              />
              <Slider
                label="Speed"
                value={turbulence.speed ?? 0.3}
                onChange={v => updateProps({ turbulence: { ...turbulence, speed: v } })}
                min={0} max={3} step={0.05}
              />
            </>
          )}
        </div>

        {/* Particle visual shape (Appearance + Blending) */}
        <div className="config-card structural">
          <div className="config-card-title">
            Particle Visual
            <span className="structural-hint">⟳ refresh</span>
          </div>
          <div className="field-row">
            <span className="field-label">Appearance</span>
            <Select
              value={appearance}
              onChange={v => updateProps({ appearance: String(v) })}
              options={APPEARANCE_OPTIONS}
            />
          </div>
          <div className="field-row">
            <span className="field-label">Blending</span>
            <Select
              value={blending}
              onChange={v => updateProps({ blending: Number(v) })}
              options={BLENDING_OPTIONS}
            />
          </div>
          <div className="readonly-row">
            <span className="readonly-key">geometry</span>
            <span className="readonly-val">
              {props.geometry ? 'custom mesh' : 'sprite (2D)'}
            </span>
          </div>
          <div className="muted-note">
            For 3D mesh particles (BoxGeometry, SphereGeometry…) edit source preset file directly.
          </div>
        </div>

        {/* Capacity */}
        <div className="config-card structural">
          <div className="config-card-title">
            Capacity / Intensity
            <span className="structural-hint">⟳ refresh</span>
          </div>
          <div className="field-row">
            <span className="field-label">maxParticles</span>
            <NumberInput
              value={maxParticles}
              onChange={v => updateProps({ maxParticles: Math.max(1, Math.round(v)) })}
              step={100} precision={0} min={1}
              width={90}
            />
          </div>
          <Slider
            label="Intensity"
            value={intensity}
            onChange={v => updateProps({ intensity: v })}
            min={0} max={30} step={0.5}
          />
        </div>
      </div>
    </div>
  )
}
