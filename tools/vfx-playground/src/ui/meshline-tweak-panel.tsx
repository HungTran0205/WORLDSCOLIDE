import type { MeshlinePreset, MeshlineShapeParams } from '../presets/preset-types'
import { PanelSection } from './controls/panel-section'
import { SubGroup } from './controls/sub-group'
import { Slider } from './controls/slider'
import { Vec3Input } from './controls/vec3-input'
import { ColorPicker } from './controls/color-picker'
import { Toggle } from './controls/toggle'

interface Props {
  preset: MeshlinePreset
  onChange: (next: MeshlinePreset) => void
}

export function MeshlineTweakPanel({ preset, onChange }: Props) {
  const update = <K extends keyof MeshlinePreset>(key: K, value: MeshlinePreset[K]) =>
    onChange({ ...preset, [key]: value })

  const updateParam = <K extends keyof MeshlineShapeParams>(
    key: K,
    value: MeshlineShapeParams[K],
  ) => onChange({ ...preset, shapeParams: { ...preset.shapeParams, [key]: value } })

  const rotation = preset.rotation ?? [0, 0, 0]

  return (
    <PanelSection title="Meshline Tweak" icon="🎛️">
      <SubGroup title="Material">
        <ColorPicker
          label="Color"
          value={preset.color}
          onChange={v => update('color', v)}
        />
        <ColorPicker
          label="Gradient"
          value={preset.gradientColor ?? '#ffffff'}
          onChange={v => update('gradientColor', v)}
          clearable
          onClear={() => update('gradientColor', undefined)}
        />
        <Slider
          label="Opacity"
          value={preset.opacity}
          onChange={v => update('opacity', v)}
          min={0} max={1} step={0.05}
        />
        <Toggle
          label="Additive blending (glow)"
          checked={preset.additive}
          onChange={v => update('additive', v)}
        />
      </SubGroup>

      <SubGroup title="Geometry">
        <Slider
          label="Line width"
          value={preset.lineWidth}
          onChange={v => update('lineWidth', Math.round(v))}
          min={1} max={60} step={1} precision={0}
        />
        <Slider
          label="Segments"
          value={preset.shapeParams.segments ?? 32}
          onChange={v => updateParam('segments', Math.round(v))}
          min={4} max={256} step={2} precision={0}
        />
        <Vec3Input
          label="Rotation (rad)"
          value={rotation}
          onChange={v => update('rotation', v)}
          step={0.05}
        />
      </SubGroup>

      <SubGroup title="Shape Params">
        {(preset.shape === 'arc' || preset.shape === 'circle' || preset.shape === 'spiral') && (
          <Slider
            label="Radius"
            value={preset.shapeParams.radius ?? 1}
            onChange={v => updateParam('radius', v)}
            min={0.1} max={5} step={0.05}
          />
        )}
        {preset.shape === 'arc' && (
          <Slider
            label="Arc angle"
            unit="rad"
            value={preset.shapeParams.arcAngle ?? Math.PI}
            onChange={v => updateParam('arcAngle', v)}
            min={0.1} max={Math.PI * 2} step={0.05}
          />
        )}
        {preset.shape === 'sine' && (
          <>
            <Slider
              label="Wavelengths"
              value={preset.shapeParams.wavelengths ?? 4}
              onChange={v => updateParam('wavelengths', Math.round(v))}
              min={1} max={20} step={1} precision={0}
            />
            <Slider
              label="Amplitude"
              value={preset.shapeParams.amplitude ?? 0.3}
              onChange={v => updateParam('amplitude', v)}
              min={0} max={2} step={0.05}
            />
            <Slider
              label="Length"
              value={preset.shapeParams.length ?? 4}
              onChange={v => updateParam('length', v)}
              min={0.5} max={10} step={0.1}
            />
          </>
        )}
        {preset.shape === 'spiral' && (
          <>
            <Slider
              label="Spiral turns"
              value={preset.shapeParams.spiralTurns ?? 4}
              onChange={v => updateParam('spiralTurns', Math.round(v))}
              min={1} max={12} step={1} precision={0}
            />
            <Slider
              label="Spiral height"
              value={preset.shapeParams.spiralHeight ?? 2}
              onChange={v => updateParam('spiralHeight', v)}
              min={0.2} max={6} step={0.1}
            />
          </>
        )}
        {preset.shape === 'line' && (
          <>
            <Vec3Input
              label="Start"
              value={preset.shapeParams.start ?? [-1, 0, 0]}
              onChange={v => updateParam('start', v)}
              step={0.1}
            />
            <Vec3Input
              label="End"
              value={preset.shapeParams.end ?? [1, 0, 0]}
              onChange={v => updateParam('end', v)}
              step={0.1}
            />
          </>
        )}
      </SubGroup>
    </PanelSection>
  )
}
