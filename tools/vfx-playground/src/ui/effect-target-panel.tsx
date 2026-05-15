import type {
  EffectTargetState,
  EffectTargetMode,
  MotionPathKind,
  CharacterAnchor,
} from '../scene/effect-target'
import { PanelSection } from './controls/panel-section'
import { SubGroup } from './controls/sub-group'
import { Slider } from './controls/slider'
import { Vec3Input } from './controls/vec3-input'
import { Select } from './controls/select'
import { Toggle } from './controls/toggle'

interface Props {
  target: EffectTargetState
  onChange: (next: EffectTargetState) => void
}

const MODE_OPTIONS = [
  { value: 'world', label: '📍 World (fixed)' },
  { value: 'motion', label: '➡️ Motion Path' },
  { value: 'character', label: '🧍 Character Anchor' },
] as { value: EffectTargetMode; label: string }[]

const MOTION_KIND_OPTIONS: { value: MotionPathKind; label: string }[] =
  ['linear', 'arc', 'sine', 'orbit', 'pingpong'].map(k => ({ value: k as MotionPathKind, label: k }))

const ANCHOR_OPTIONS: { value: CharacterAnchor; label: string }[] =
  ['center', 'head', 'hand', 'feet'].map(a => ({ value: a as CharacterAnchor, label: a }))

export function EffectTargetPanel({ target, onChange }: Props) {
  const setMotion = <K extends keyof typeof target.motion>(
    key: K,
    value: (typeof target.motion)[K],
  ) => onChange({ ...target, motion: { ...target.motion, [key]: value } })

  return (
    <PanelSection title="Effect Target" icon="🎯">
      <div className="field-row">
        <span className="field-label">Mode</span>
        <Select
          value={target.mode}
          onChange={v => onChange({ ...target, mode: v as EffectTargetMode })}
          options={MODE_OPTIONS}
        />
      </div>

      {target.mode === 'world' && (
        <SubGroup title="World">
          <Vec3Input
            label="Position"
            value={target.worldPosition}
            onChange={v => onChange({ ...target, worldPosition: v })}
            step={0.1}
          />
        </SubGroup>
      )}

      {target.mode === 'character' && (
        <SubGroup title="Anchor">
          <div className="field-row">
            <span className="field-label">Anchor</span>
            <Select
              value={target.characterAnchor}
              onChange={v => onChange({ ...target, characterAnchor: v as CharacterAnchor })}
              options={ANCHOR_OPTIONS}
            />
          </div>
        </SubGroup>
      )}

      {target.mode === 'motion' && (
        <SubGroup title="Motion">
          <div className="field-row">
            <span className="field-label">Path kind</span>
            <Select
              value={target.motion.kind}
              onChange={v => setMotion('kind', v as MotionPathKind)}
              options={MOTION_KIND_OPTIONS}
            />
          </div>
          <Vec3Input
            label="Start"
            value={target.motion.start}
            onChange={v => setMotion('start', v)}
            step={0.1}
          />
          <Vec3Input
            label="End"
            value={target.motion.end}
            onChange={v => setMotion('end', v)}
            step={0.1}
          />
          <Slider
            label="Duration"
            unit="s"
            value={target.motion.duration}
            onChange={v => setMotion('duration', v)}
            min={0.2} max={6} step={0.1}
          />
          {target.motion.kind === 'arc' && (
            <Slider
              label="Arc height"
              value={target.motion.height}
              onChange={v => setMotion('height', v)}
              min={0} max={5} step={0.1}
            />
          )}
          {target.motion.kind === 'sine' && (
            <Slider
              label="Sine amplitude"
              value={target.motion.amplitude}
              onChange={v => setMotion('amplitude', v)}
              min={0} max={3} step={0.05}
            />
          )}
          <Toggle
            label="Loop motion"
            checked={target.motion.loop}
            onChange={v => setMotion('loop', v)}
          />
        </SubGroup>
      )}
    </PanelSection>
  )
}
