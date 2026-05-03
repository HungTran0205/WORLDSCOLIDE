import { PanelSection } from './controls/panel-section'
import { Slider } from './controls/slider'
import { Toggle } from './controls/toggle'

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
  const update = <K extends keyof BloomState>(key: K, value: BloomState[K]) =>
    onChange({ ...bloom, [key]: value })

  return (
    <PanelSection title="Bloom (WebGPU)" icon="🌟">
      <Toggle
        label="Enable bloom postprocessing"
        checked={bloom.enabled}
        onChange={v => update('enabled', v)}
      />
      <Slider
        label="Strength"
        value={bloom.strength}
        onChange={v => update('strength', v)}
        min={0} max={5} step={0.05}
        disabled={!bloom.enabled}
      />
      <Slider
        label="Radius"
        value={bloom.radius}
        onChange={v => update('radius', v)}
        min={0} max={1.5} step={0.05}
        disabled={!bloom.enabled}
      />
      <Slider
        label="Threshold"
        value={bloom.threshold}
        onChange={v => update('threshold', v)}
        min={0} max={2} step={0.05}
        disabled={!bloom.enabled}
      />
    </PanelSection>
  )
}
