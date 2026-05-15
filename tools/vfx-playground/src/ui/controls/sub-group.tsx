import { useState, type ReactNode } from 'react'

interface Props {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

/** Lighter-weight collapsible inside a <PanelSection>. */
export function SubGroup({ title, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="sub-group">
      <button
        type="button"
        className={`sub-group-header ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="arrow">▶</span>
        <span>{title}</span>
      </button>
      {open && <div className="sub-group-body">{children}</div>}
    </div>
  )
}
