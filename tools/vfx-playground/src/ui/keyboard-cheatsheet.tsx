import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

interface Shortcut { keys: string[]; desc: string }

const GROUPS: { title: string; rows: Shortcut[] }[] = [
  {
    title: 'Global',
    rows: [
      { keys: ['1'], desc: 'Switch to Effect Designer' },
      { keys: ['2'], desc: 'Switch to Sequencer' },
      { keys: ['?'], desc: 'Toggle this cheatsheet' },
      { keys: ['Esc'], desc: 'Close dialog / clear search' },
    ],
  },
  {
    title: 'Effect Designer',
    rows: [
      { keys: ['/'], desc: 'Focus preset search' },
      { keys: ['↓'], desc: 'Move from search into preset list' },
      { keys: ['Enter'], desc: 'Select first matching preset' },
    ],
  },
  {
    title: 'Sequencer transport',
    rows: [
      { keys: ['Space'], desc: 'Play / Pause' },
      { keys: ['Home'], desc: 'Seek to 0' },
      { keys: ['End'], desc: 'Seek to end' },
      { keys: ['←', '→'], desc: 'Step ±100ms' },
      { keys: ['Shift', '←/→'], desc: 'Step ±1s' },
      { keys: ['Del'], desc: 'Delete selected clip' },
      { keys: ['Alt'], desc: '(hold) bypass snap during drag' },
    ],
  },
]

export function KeyboardCheatsheet({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="dialog-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cheatsheet-box" onClick={e => e.stopPropagation()}>
        <div className="cheatsheet-header">
          <span>⌨ Keyboard shortcuts</span>
          <button onClick={onClose} aria-label="Close cheatsheet">✕</button>
        </div>
        <div className="cheatsheet-body">
          {GROUPS.map(g => (
            <section key={g.title}>
              <h3>{g.title}</h3>
              <table>
                <tbody>
                  {g.rows.map((row, i) => (
                    <tr key={i}>
                      <td className="kbd-cell">
                        {row.keys.map((k, j) => (
                          <span key={j}>
                            {j > 0 && <span className="kbd-plus"> + </span>}
                            <kbd>{k}</kbd>
                          </span>
                        ))}
                      </td>
                      <td>{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
