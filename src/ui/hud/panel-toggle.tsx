import { useGameStore } from '@/game/state/store';
import type { FurnitureType } from '@/game/state/game-state';
import '@/ui/styles/hud.css';

export type PanelId = 'quests' | 'roster' | 'build' | 'combat' | 'settings' | 'tavern' | null;

const PANELS = [
  { id: 'quests' as const, label: 'Quests' },
  { id: 'roster' as const, label: 'Roster' },
  { id: 'tavern' as const, label: 'Tavern', requiresFurniture: 'bar-counter' as FurnitureType },
  { id: 'build' as const, label: 'Build' },
  { id: 'settings' as const, label: 'Settings' },
];

interface PanelToggleProps {
  activePanel: PanelId;
  setActivePanel: (id: PanelId) => void;
}

export function PanelToggle({ activePanel, setActivePanel }: PanelToggleProps) {
  const furniture = useGameStore((s) => s.guildHall.furniture);
  const placedTypes = new Set(furniture.map((f) => f.type));

  return (
    <div className="panel-toggle-bar">
      {PANELS
        .filter((p) => !p.requiresFurniture || placedTypes.has(p.requiresFurniture))
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
