import { useState } from 'react'
import type { VfxPreset } from '../presets/preset-types'
import { presetsByCategory, categoryOrder } from '../presets/preset-registry'

const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  'linh-son': { emoji: '🔥', label: 'Linh Sơn — Earth/Fire' },
  'de-quoc': { emoji: '⚡', label: 'Đế Quốc — Electric/Tech' },
  'thien-lu': { emoji: '✨', label: 'Thiên Lữ — Celestial/Wind' },
  'generic': { emoji: '💥', label: 'Generic — Combat' },
}

interface Props {
  activePreset: VfxPreset | null
  onSelect: (preset: VfxPreset) => void
}

export function Sidebar({ activePreset, onSelect }: Props) {
  const [openCats, setOpenCats] = useState<Set<string>>(
    new Set(categoryOrder)
  )

  const toggle = (cat: string) => {
    setOpenCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span>✨</span> VFX Playground
      </div>
      {categoryOrder.map(cat => {
        const meta = CATEGORY_META[cat]
        const presets = presetsByCategory[cat]
        const isOpen = openCats.has(cat)

        return (
          <div key={cat} className="category" data-cat={cat}>
            <div
              className={`category-header ${isOpen ? 'open' : ''}`}
              onClick={() => toggle(cat)}
            >
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
              <span className="arrow">▶</span>
            </div>
            {isOpen && (
              <div className="category-items">
                {presets.map(p => (
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
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
