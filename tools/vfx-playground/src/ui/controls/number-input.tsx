import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
  step?: number
  precision?: number
  min?: number
  max?: number
  disabled?: boolean
  /** Drag-scrub on label (Blender style). Default false on bare component; set true via labelDrag wrapper. */
  dragScrub?: boolean
  /** Optional textual label rendered before the input (used for vec3 x/y/z). */
  prefix?: string
  className?: string
  width?: number | string
}

const fmt = (v: number, precision: number) =>
  Number.isFinite(v) ? (precision >= 0 ? v.toFixed(precision) : String(v)) : ''

/** Minimal numeric input with optional drag-scrub on prefix label. */
export function NumberInput({
  value, onChange, step = 0.1, precision = 2,
  min, max, disabled, dragScrub, prefix, className, width,
}: Props) {
  const [text, setText] = useState(() => fmt(value, precision))
  const lastValueRef = useRef(value)

  useEffect(() => {
    if (value !== lastValueRef.current) {
      lastValueRef.current = value
      setText(fmt(value, precision))
    }
  }, [value, precision])

  const commit = (raw: string) => {
    const v = parseFloat(raw)
    if (!Number.isFinite(v)) {
      setText(fmt(value, precision))
      return
    }
    let next = v
    if (typeof min === 'number') next = Math.max(min, next)
    if (typeof max === 'number') next = Math.min(max, next)
    onChange(next)
    setText(fmt(next, precision))
  }

  const startDrag = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (!dragScrub || disabled) return
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startVal = value
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const next = startVal + dx * step
      let clamped = next
      if (typeof min === 'number') clamped = Math.max(min, clamped)
      if (typeof max === 'number') clamped = Math.min(max, clamped)
      onChange(clamped)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <span className={`number-input ${className ?? ''}`} style={width ? { width } : undefined}>
      {prefix && (
        <span
          className={`number-input-prefix ${dragScrub ? 'drag' : ''}`}
          onPointerDown={startDrag}
          title={dragScrub ? 'Drag to scrub' : undefined}
        >
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={text}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        onChange={e => setText(e.target.value)}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit((e.target as HTMLInputElement).value)
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />
    </span>
  )
}
