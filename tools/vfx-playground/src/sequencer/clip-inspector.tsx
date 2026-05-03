import type { SequenceClip, SkillSequence } from './sequence-types'
import { TRACK_META, TRACK_KINDS } from './track-registry'
import { PanelSection } from '../ui/controls/panel-section'
import { Slider } from '../ui/controls/slider'
import { NumberInput } from '../ui/controls/number-input'
import { Select } from '../ui/controls/select'
import { ColorPicker } from '../ui/controls/color-picker'

interface Props {
  clip: SequenceClip
  sequence: SkillSequence
  onChange: (next: SkillSequence) => void
}

export function ClipInspector({ clip, sequence, onChange }: Props) {
  const update = (patch: Partial<SequenceClip>) => {
    onChange({
      ...sequence,
      clips: sequence.clips.map(c => c.id === clip.id ? { ...c, ...patch } : c),
    })
  }
  const updatePayload = (key: string, value: unknown) => {
    update({ payload: { ...clip.payload, [key]: value } })
  }

  const intensity = (clip.payload?.intensity as number) ?? 0.3
  const freq = (clip.payload?.freq as number) ?? 30
  const factor = (clip.payload?.factor as number) ?? (clip.track === 'time' ? 0 : 1.2)
  const flashColor = (clip.payload?.color as string) ?? '#ffffff'
  const flashAlpha = (clip.payload?.alpha as number) ?? 0.5

  const kindOptions = TRACK_KINDS[clip.track].map(k => ({ value: k.id, label: k.label }))

  return (
    <PanelSection
      title={`${clip.label}`}
      icon={TRACK_META[clip.track].icon}
      headerColor="var(--accent-timeline)"
    >
      <div className="field-row">
        <span className="field-label">Start (ms)</span>
        <NumberInput
          value={clip.start}
          onChange={v => update({ start: v })}
          step={10}
          precision={0}
          min={0}
          max={sequence.duration}
          width={90}
        />
      </div>
      <div className="field-row">
        <span className="field-label">Duration (ms)</span>
        <NumberInput
          value={clip.duration}
          onChange={v => update({ duration: v })}
          step={10}
          precision={0}
          min={50}
          width={90}
        />
      </div>
      <div className="field-row">
        <span className="field-label">Label</span>
        <input
          type="text"
          className="text-input"
          value={clip.label}
          onChange={e => update({ label: e.target.value })}
        />
      </div>
      <div className="field-row">
        <span className="field-label">Kind</span>
        <Select value={clip.kind} onChange={v => update({ kind: String(v) })} options={kindOptions} />
      </div>

      {clip.track === 'camera' && clip.kind === 'shake' && (
        <>
          <Slider
            label="Intensity"
            value={intensity}
            onChange={v => updatePayload('intensity', v)}
            min={0} max={1} step={0.05}
          />
          <Slider
            label="Freq"
            unit="Hz"
            value={freq}
            onChange={v => updatePayload('freq', Math.round(v))}
            min={5} max={60} step={5} precision={0}
          />
        </>
      )}

      {clip.track === 'camera' && (clip.kind === 'zoom-in' || clip.kind === 'zoom-out') && (
        <Slider
          label="Factor"
          value={factor}
          onChange={v => updatePayload('factor', v)}
          min={0.5} max={2} step={0.05}
        />
      )}

      {clip.track === 'flash' && (
        <>
          <ColorPicker
            label="Color"
            value={flashColor}
            onChange={v => updatePayload('color', v)}
          />
          <Slider
            label="Alpha"
            value={flashAlpha}
            onChange={v => updatePayload('alpha', v)}
            min={0} max={1} step={0.05}
          />
        </>
      )}

      {clip.track === 'time' && (
        <Slider
          label={`Scale factor${factor === 0 ? ' (freeze)' : ''}`}
          value={factor}
          onChange={v => updatePayload('factor', v)}
          min={0} max={1} step={0.05}
        />
      )}
    </PanelSection>
  )
}
