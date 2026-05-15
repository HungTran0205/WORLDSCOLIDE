import { useState, type ReactNode } from 'react'

interface Props {
  title: string
  icon?: ReactNode
  defaultOpen?: boolean
  headerColor?: string
  error?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

/**
 * Reusable collapsible panel section.
 * Replaces the duplicated `.character-panel`/`.panel-header`/`.panel-body` pattern
 * across bloom/character/target/meshline/particle panels.
 */
export function PanelSection({
  title, icon, defaultOpen = true, headerColor, error, actions, children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="panel-section" role="region">
      <div className="panel-section-header-row">
        <button
          type="button"
          className={`panel-section-header ${open ? 'open' : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          style={headerColor ? { color: headerColor } : undefined}
        >
          {icon && <span className="panel-section-icon">{icon}</span>}
          <span className="panel-section-title">{title}</span>
          <span className="arrow">▶</span>
        </button>
        {actions && <div className="panel-section-actions">{actions}</div>}
      </div>
      {open && (
        <div className="panel-section-body">
          {error && <div className="panel-section-error">{error}</div>}
          {children}
        </div>
      )}
    </section>
  )
}
