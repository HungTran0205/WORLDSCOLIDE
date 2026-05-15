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
  if (preset.kind === 'meshline') {
    // Meshline export = constructor + configure block
    const lines: string[] = []
    lines.push('// makio-meshline')
    lines.push('const ml = new MeshLine()')
    lines.push('ml.configure({')
    lines.push(`  // shape: ${preset.shape}`)
    lines.push(`  color: new Color("${preset.color}"),`)
    if (preset.gradientColor) lines.push(`  gradientColor: new Color("${preset.gradientColor}"),`)
    lines.push(`  lineWidth: ${preset.lineWidth},`)
    lines.push(`  opacity: ${preset.opacity},`)
    lines.push('  transparent: true,')
    lines.push('})')
    if (preset.additive) {
      lines.push('ml.material.blending = AdditiveBlending')
      lines.push('ml.material.depthWrite = false')
    }
    if (preset.rotation) {
      lines.push(`ml.rotation.set(${preset.rotation.join(', ')})`)
    }
    lines.push('// shapeParams: ' + JSON.stringify(preset.shapeParams))
    return lines.join('\n')
  }

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
      <div
        className="code-panel collapsed"
        onClick={() => setCollapsed(false)}
        role="button"
        tabIndex={0}
        title="Show code panel"
        aria-label="Expand code panel"
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setCollapsed(false)
          }
        }}
      >
        <span className="code-panel-expand-icon">‹</span>
        <span className="code-panel-expand-label">Code</span>
      </div>
    )
  }

  return (
    <div className="code-panel">
      <div className="code-panel-header">
        <span>📋 Generated Code</span>
        <div className="code-panel-header-actions">
          {preset && (
            <button
              type="button"
              className={`copy-btn-header ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copy generated code to clipboard"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          )}
          <button
            className="code-panel-toggle"
            onClick={() => setCollapsed(true)}
            title="Hide panel"
            aria-label="Collapse code panel"
          >
            ›
          </button>
        </div>
      </div>

      {preset ? (
        <div className="code-block-wrapper">
          <pre className="code-block">{code}</pre>
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>Select a preset to see code</p>
        </div>
      )}
    </div>
  )
}
