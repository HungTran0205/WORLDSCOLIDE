interface Option<V extends string | number = string> {
  value: V
  label: string
}

interface Props<V extends string | number = string> {
  value: V
  onChange: (v: V) => void
  options: Option<V>[]
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

/**
 * Styled-native select (Phase 5 KISS fallback per plan unresolved Q2).
 * Custom popover deferred — native covers keyboard nav + a11y for free.
 */
export function Select<V extends string | number = string>({
  value, onChange, options, disabled, className, ...rest
}: Props<V>) {
  return (
    <select
      className={`select-native ${className ?? ''}`}
      value={value as unknown as string}
      disabled={disabled}
      onChange={e => {
        const raw = e.target.value
        const found = options.find(o => String(o.value) === raw)
        if (found) onChange(found.value)
      }}
      aria-label={rest['aria-label']}
    >
      {options.map(o => (
        <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
      ))}
    </select>
  )
}
