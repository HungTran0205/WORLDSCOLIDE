export type AppMode = 'effect' | 'sequencer'

interface Props {
  mode: AppMode
  onChange: (m: AppMode) => void
}

export function ModeTabs({ mode, onChange }: Props) {
  return (
    <div className="mode-tabs">
      <button
        className={`mode-tab ${mode === 'effect' ? 'active' : ''}`}
        onClick={() => onChange('effect')}
      >
        🎨 Effect Designer
      </button>
      <button
        className={`mode-tab ${mode === 'sequencer' ? 'active' : ''}`}
        onClick={() => onChange('sequencer')}
      >
        🎬 Skill Sequencer
      </button>
    </div>
  )
}
