import { useGameStore } from '@/game/state/store';
import '@/ui/styles/hud.css';

export type PanelId = 'quests' | 'roster' | 'build' | 'combat' | 'settings' | 'tavern' | null;

const PANELS = [
  { id: 'quests' as const, label: 'Quests' },
  { id: 'roster' as const, label: 'Roster' },
  { id: 'tavern' as const, label: 'Tavern', requiresRoom: 'tavern' as const },
  { id: 'build' as const, label: 'Build' },
  { id: 'settings' as const, label: 'Settings' },
];

interface PanelToggleProps {
  activePanel: PanelId;
  setActivePanel: (id: PanelId) => void;
}

export function PanelToggle({ activePanel, setActivePanel }: PanelToggleProps) {
  const rooms = useGameStore((s) => s.guildHall.rooms);
  const builtRoomTypes = new Set(rooms.map((r) => r.type));

  return (
    <div className="panel-toggle-bar">
      {PANELS
        .filter((p) => !p.requiresRoom || builtRoomTypes.has(p.requiresRoom))
        .map((p) => (
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
