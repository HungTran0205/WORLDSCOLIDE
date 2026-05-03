import { NumberInput } from './number-input'

interface Props {
  label: string
  value: [number, number, number]
  onChange: (v: [number, number, number]) => void
  step?: number
  precision?: number
  dragScrub?: boolean
}

const AXES = ['x', 'y', 'z'] as const

/** Three side-by-side numeric inputs with x/y/z prefix labels. */
export function Vec3Input({ label, value, onChange, step = 0.1, precision = 2, dragScrub = true }: Props) {
  const update = (i: 0 | 1 | 2, v: number) => {
    const next = [...value] as [number, number, number]
    next[i] = v
    onChange(next)
  }
  return (
    <div className="vec3-input">
      <span className="vec3-label">{label}</span>
      <div className="vec3-row">
        {AXES.map((axis, i) => (
          <NumberInput
            key={axis}
            value={value[i]}
            onChange={v => update(i as 0 | 1 | 2, v)}
            step={step}
            precision={precision}
            prefix={axis}
            dragScrub={dragScrub}
          />
        ))}
      </div>
    </div>
  )
}
