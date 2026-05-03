import { useState, useCallback } from 'react'
import type { SkillSequence } from './sequence-types'
import { generateSkillComponent } from './codegen'

interface Props {
  sequence: SkillSequence
  onClose: () => void
}

const DEFAULT_IMPORT_PATH = '@/vfx/presets/preset-registry'

export function ExportDialog({ sequence, onClose }: Props) {
  const [importPath, setImportPath] = useState(DEFAULT_IMPORT_PATH)
  const [componentName, setComponentName] = useState('')
  const [copied, setCopied] = useState(false)

  const { filename, code } = generateSkillComponent(sequence, {
    presetImportPath: importPath,
    componentName: componentName || undefined,
  })

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }, [code, filename])

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-box" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <span>📤 Export Skill Component</span>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="dialog-body">
          <label className="field">
            <span>Component name (auto if blank)</span>
            <input type="text" value={componentName} placeholder={sequence.name}
              onChange={e => setComponentName(e.target.value)} />
          </label>
          <label className="field">
            <span>Preset import path</span>
            <input type="text" value={importPath} onChange={e => setImportPath(e.target.value)} />
          </label>
          <div className="field">
            <span>Output: <code>{filename}</code></span>
          </div>
          <pre className="code-block export-preview">{code}</pre>
        </div>

        <div className="dialog-footer">
          <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button className="copy-btn" onClick={handleDownload}>↓ Download .tsx</button>
        </div>
      </div>
    </div>
  )
}
