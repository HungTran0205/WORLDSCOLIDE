import { useRef } from 'react'

interface Props {
  label?: string
  value: string
  onChange: (v: string) => void
  clearable?: boolean
  onClear?: () => void
}

/** Styled swatch button + hex text input. Click swatch opens native color popup. */
export function ColorPicker({ label, value, onChange, clearable, onClear }: Props) {
  const colorRef = useRef<HTMLInputElement>(null)
  const safe = value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff'

  return (
    <div className="color-picker">
      {label && <span className="color-picker-label">{label}</span>}
      <button
        type="button"
        className="color-swatch"
        style={{ background: safe }}
        onClick={() => colorRef.current?.click()}
        aria-label={`${label ?? 'Color'} picker`}
      />
      <input
        ref={colorRef}
        type="color"
        value={safe}
        onChange={e => onChange(e.target.value)}
        className="color-native-hidden"
      />
      <input
        type="text"
        className="color-hex"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder="#ffffff"
        spellCheck={false}
      />
      {clearable && (
        <button
          type="button"
          className="color-clear"
          onClick={onClear}
          title="Clear"
        >
          ✕
        </button>
      )}
    </div>
  )
}
