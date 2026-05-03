import { useEffect } from 'react'
import type { AppMode } from './mode-tabs'

interface Args {
  mode: AppMode
  setMode: (m: AppMode) => void
  toggleCheatsheet: () => void
}

/**
 * Global keyboard shortcuts at the App level.
 * - `1` → effect mode
 * - `2` → sequencer mode
 * - `?` (Shift+/) → toggle cheatsheet
 * - `Esc` → close cheatsheet (handled by component)
 *
 * Mode-specific shortcuts (Space/Home/End/←/→ in sequencer, `/` for preset
 * search) are owned by their respective components — this file only houses
 * truly global ones.
 */
export function useKeyboardShortcuts({ mode, setMode, toggleCheatsheet }: Args) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ae = document.activeElement
      const tag = ae?.tagName?.toLowerCase()
      const isEditable =
        tag === 'input' || tag === 'select' || tag === 'textarea' ||
        (ae as HTMLElement | null)?.isContentEditable
      if (isEditable) return

      // ?  → cheatsheet
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        toggleCheatsheet()
        return
      }
      // 1 / 2 → mode switch
      if (e.key === '1' && mode !== 'effect') { e.preventDefault(); setMode('effect') }
      if (e.key === '2' && mode !== 'sequencer') { e.preventDefault(); setMode('sequencer') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, setMode, toggleCheatsheet])
}
