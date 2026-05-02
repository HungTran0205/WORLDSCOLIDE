import '@/ui/styles/hud.css';

export type PanelId = 'quests' | 'roster' | 'combat' | 'settings' | 'facilities' | null;

const PANELS = [
  { id: 'quests' as const, label: 'Quests' },
  { id: 'roster' as const, label: 'Roster' },
  { id: 'facilities' as const, label: 'Facilities' },
  { id: 'settings' as const, label: 'Settings' },
];

interface PanelToggleProps {
  activePanel: PanelId;
  setActivePanel: (id: PanelId) => void;
  /** Panel ID to highlight (tutorial guidance). Pulses with a gold border. */
  highlightPanel?: string | null;
}

export function PanelToggle({ activePanel, setActivePanel, highlightPanel }: PanelToggleProps) {
  return (
    <div className="panel-toggle-bar">
      {PANELS
        .map((p) => (
          <button
            key={p.id}
            className={[
              activePanel === p.id ? 'active' : '',
              highlightPanel === p.id ? 'tutorial-highlight' : '',
            ].join(' ').trim()}
            onClick={() => setActivePanel(activePanel === p.id ? null : p.id)}
          >
            {p.label}
          </button>
        ))}
    </div>
  );
}
