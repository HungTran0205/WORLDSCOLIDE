import { NumberInput } from './number-input'

interface Props {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  precision?: number
  unit?: string
  disabled?: boolean
}

/** Range slider + paired numeric input. Both stay synced. */
export function Slider({
  label, value, onChange, min, max, step = 0.01, precision = 2, unit, disabled,
}: Props) {
  return (
    <div className={`slider-control ${disabled ? 'disabled' : ''}`}>
      <div className="slider-label-row">
        <span className="slider-label">{label}{unit ? <span className="slider-unit"> ({unit})</span> : null}</span>
        <NumberInput
          value={value}
          onChange={onChange}
          step={step}
          precision={precision}
          min={min}
          max={max}
          disabled={disabled}
          width={64}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}
