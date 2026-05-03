import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { VfxPreset } from '../presets/preset-types'
import { presetsByCategory, categoryOrder } from '../presets/preset-registry'

const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  'weapon-fx': { emoji: '⚔️', label: 'Weapon FX — Slash/Beam/Trail' },
  'linh-son': { emoji: '🔥', label: 'Linh Sơn — Earth/Fire' },
  'de-quoc': { emoji: '⚡', label: 'Đế Quốc — Electric/Tech' },
  'thien-lu': { emoji: '✨', label: 'Thiên Lữ — Celestial/Wind' },
  'generic': { emoji: '💥', label: 'Generic — Combat' },
}

interface Props {
  activePreset: VfxPreset | null
  onSelect: (preset: VfxPreset) => void
  query?: string
}

export interface SidebarHandle {
  focusFirstResult: () => void
  selectFirstMatch: () => void
}

function matches(p: VfxPreset, q: string): boolean {
  if (!q) return true
  const hay = `${p.id} ${p.name} ${p.description}`.toLowerCase()
  return hay.includes(q.toLowerCase())
}

export const Sidebar = forwardRef<SidebarHandle, Props>(function Sidebar(
  { activePreset, onSelect, query = '' },
  ref,
) {
  const [manualOpen, setManualOpen] = useState<Set<string>>(
    new Set(categoryOrder),
  )
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredByCat = useMemo(() => {
    const out: Record<string, VfxPreset[]> = {}
    for (const cat of categoryOrder) {
      out[cat] = presetsByCategory[cat].filter(p => matches(p, query))
    }
    return out
  }, [query])

  // Effective open state: manual ∪ categories with matches when filtering.
  const effectiveOpen = useMemo(() => {
    if (!query) return manualOpen
    const next = new Set(manualOpen)
    for (const cat of categoryOrder) {
      if (filteredByCat[cat].length > 0) next.add(cat)
    }
    return next
  }, [manualOpen, query, filteredByCat])

  const toggle = (cat: string) => {
    setManualOpen(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  useImperativeHandle(ref, () => ({
    focusFirstResult: () => {
      const btn = containerRef.current?.querySelector<HTMLButtonElement>('.preset-btn')
      btn?.focus()
    },
    selectFirstMatch: () => {
      for (const cat of categoryOrder) {
        const first = filteredByCat[cat][0]
        if (first) { onSelect(first); return }
      }
    },
  }))

  return (
    <div className="sidebar" ref={containerRef}>
      {categoryOrder.map(cat => {
        const meta = CATEGORY_META[cat]
        const presets = filteredByCat[cat]
        const isOpen = effectiveOpen.has(cat)
        const total = presetsByCategory[cat].length
        const isFiltered = !!query
        const greyed = isFiltered && presets.length === 0

        return (
          <div
            key={cat}
            className={`category ${greyed ? 'greyed' : ''}`}
            data-cat={cat}
          >
            <button
              type="button"
              className={`category-header ${isOpen ? 'open' : ''}`}
              onClick={() => toggle(cat)}
              aria-expanded={isOpen}
            >
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
              {isFiltered && (
                <span className="cat-count">{presets.length}/{total}</span>
              )}
              <span className="arrow">▶</span>
            </button>
            {isOpen && (
              <div className="category-items">
                {presets.length === 0 ? (
                  <div className="no-matches">
                    {isFiltered ? 'No matches — Esc to clear' : 'Empty'}
                  </div>
                ) : (
                  presets.map(p => (
                    <button
                      key={p.id}
                      className={`preset-btn ${activePreset?.id === p.id ? 'active' : ''}`}
                      onClick={() => onSelect(p)}
                    >
                      <span className="preset-emoji">{p.emoji}</span>
                      <span className="preset-name">
                        {p.name}
                        <span className="preset-desc">{p.description}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})
