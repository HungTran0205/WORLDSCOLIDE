interface Props {
  label?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

/** Visual switch styled checkbox with larger hit area than native. */
export function Toggle({ label, checked, onChange, disabled }: Props) {
  return (
    <label className={`toggle ${disabled ? 'disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  )
}
