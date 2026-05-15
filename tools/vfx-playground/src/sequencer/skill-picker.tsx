import type { SkillLibrary } from './sequence-types'
import { Select } from '../ui/controls/select'

interface Props {
  library: SkillLibrary
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onExport: () => void
  onImport: (file: File) => void
}

export function SkillPicker({ library, activeId, onSelect, onCreate, onDuplicate, onDelete, onExport, onImport }: Props) {
  const options = library.skills.map(s => ({ value: s.id, label: s.name }))
  return (
    <div className="skill-picker">
      <Select
        value={activeId ?? ''}
        onChange={v => onSelect(String(v))}
        options={options.length > 0 ? options : [{ value: '', label: '— no skills —' }]}
        aria-label="Skill picker"
      />
      <button onClick={onCreate} title="New skill">＋</button>
      <button onClick={() => activeId && onDuplicate(activeId)} title="Duplicate">⎘</button>
      <button onClick={() => activeId && onDelete(activeId)} title="Delete skill">🗑</button>
      <div className="picker-divider" />
      <button onClick={onExport} title="Export library JSON">↓ JSON</button>
      <label className="import-btn" title="Import library JSON">
        ↑ JSON
        <input
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && onImport(e.target.files[0])}
        />
      </label>
    </div>
  )
}
