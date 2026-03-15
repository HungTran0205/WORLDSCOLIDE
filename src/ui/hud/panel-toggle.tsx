import '@/ui/styles/hud.css';

export type PanelId = 'quests' | 'roster' | 'build' | 'combat' | 'settings' | null;

const PANELS = [
  { id: 'quests' as const, label: 'Quests' },
  { id: 'roster' as const, label: 'Roster' },
  { id: 'build' as const, label: 'Build' },
  { id: 'settings' as const, label: 'Settings' },
];

interface PanelToggleProps {
  activePanel: PanelId;
  setActivePanel: (id: PanelId) => void;
}

export function PanelToggle({ activePanel, setActivePanel }: PanelToggleProps) {
  return (
    <div className="panel-toggle-bar">
      {PANELS.map((p) => (
        <button
          key={p.id}
          className={activePanel === p.id ? 'active' : ''}
          onClick={() => setActivePanel(activePanel === p.id ? null : p.id)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
