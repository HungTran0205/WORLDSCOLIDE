import { useEffect, useRef } from 'react'

interface Props {
  query: string
  onQueryChange: (q: string) => void
  matchCount: number
  total: number
  onArrowDown?: () => void
  onSubmitFirst?: () => void
}

/**
 * Searchable filter input for the preset sidebar.
 *
 * Keyboard:
 * - `/` (anywhere outside another input) → focus this input
 * - `Esc` (when focused) → clear + blur
 * - `↓` (when focused) → call `onArrowDown` (caller moves focus into list)
 * - `Enter` (when focused with non-empty query) → call `onSubmitFirst`
 */
export function PresetSearch({
  query, onQueryChange, matchCount, total,
  onArrowDown, onSubmitFirst,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/') return
      const ae = document.activeElement
      const tag = ae?.tagName?.toLowerCase()
      const isEditable = (ae as HTMLElement | null)?.isContentEditable
      if (tag === 'input' || tag === 'select' || tag === 'textarea' || isEditable) return
      e.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="preset-search">
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="Search presets… (/)"
        onChange={e => onQueryChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            onQueryChange('')
            inputRef.current?.blur()
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            onArrowDown?.()
          } else if (e.key === 'Enter' && query.trim() && matchCount > 0) {
            e.preventDefault()
            onSubmitFirst?.()
          }
        }}
        spellCheck={false}
      />
      {query && (
        <button
          type="button"
          className="preset-search-clear"
          onClick={() => { onQueryChange(''); inputRef.current?.focus() }}
          title="Clear (Esc)"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
      <span className="match-count" title={`${matchCount} of ${total} presets match`}>
        {query ? `${matchCount}/${total}` : `${total}`}
      </span>
    </div>
  )
}
