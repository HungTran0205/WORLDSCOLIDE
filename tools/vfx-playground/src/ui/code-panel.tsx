import { useState, useCallback } from 'react'
import { EmitterShape, Blending } from 'r3f-vfx'
import type { VfxPreset } from '../presets/preset-types'

interface Props {
  preset: VfxPreset | null
}

const EMITTER_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(EmitterShape).map(([k, v]) => [v, `EmitterShape.${k}`])
)
const BLENDING_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(Blending).map(([k, v]) => [v, `Blending.${k}`])
)

function formatValue(key: string, value: unknown): string {
  if (key === 'emitterShape' && typeof value === 'number') {
    return EMITTER_NAMES[value] ?? String(value)
  }
  if (key === 'blending' && typeof value === 'number') {
    return BLENDING_NAMES[value] ?? String(value)
  }
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return String(value)
  return JSON.stringify(value)
}

function generateCode(preset: VfxPreset): string {
  const lines: string[] = ['<VFXParticles']
  const entries = Object.entries(preset.props)

  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue
    if (typeof value === 'boolean' && value === true) {
      lines.push(`  ${key}`)
    } else {
      lines.push(`  ${key}={${formatValue(key, value)}}`)
    }
  }

  lines.push('/>')
  return lines.join('\n')
}

export function CodePanel({ preset }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  const code = preset ? generateCode(preset) : ''

  const handleCopy = useCallback(async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea')
      textarea.value = code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [code])

  if (collapsed) {
    return (
      <div className="code-panel collapsed">
        <button
          className="code-panel-toggle"
          onClick={() => setCollapsed(false)}
          title="Show code"
        >
          {'<'}
        </button>
      </div>
    )
  }

  return (
    <div className="code-panel">
      <div className="code-panel-header">
        <span>📋 Generated Code</span>
        <button
          className="code-panel-toggle"
          onClick={() => setCollapsed(true)}
          title="Hide panel"
        >
          {'>'}
        </button>
      </div>

      {preset ? (
        <>
          <div className="code-block-wrapper">
            <pre className="code-block">{code}</pre>
          </div>
          <button
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copied!' : '📋 Copy Code'}
          </button>
        </>
      ) : (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>Select a preset to see code</p>
        </div>
      )}
    </div>
  )
}
