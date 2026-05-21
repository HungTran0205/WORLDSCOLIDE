import { useTranslation } from 'react-i18next';
import '@/ui/styles/hud.css';

export type PanelId = 'quests' | 'roster' | 'combat' | 'settings' | 'facilities' | null;

const PANEL_IDS = ['quests', 'roster', 'facilities', 'settings'] as const;
type KnownPanelId = typeof PANEL_IDS[number];

interface PanelToggleProps {
  activePanel: PanelId;
  setActivePanel: (id: PanelId) => void;
  /** Panel ID to highlight (tutorial guidance). Pulses with a gold border. */
  highlightPanel?: string | null;
}

export function PanelToggle({ activePanel, setActivePanel, highlightPanel }: PanelToggleProps) {
  const { t } = useTranslation();

  return (
    <div className="panel-toggle-bar">
      {PANEL_IDS.map((id: KnownPanelId) => (
        <button
          key={id}
          className={[
            activePanel === id ? 'active' : '',
            highlightPanel === id ? 'tutorial-highlight' : '',
          ].join(' ').trim()}
          onClick={() => setActivePanel(activePanel === id ? null : id)}
        >
          {t(`panelToggle.${id}`)}
        </button>
      ))}
    </div>
  );
}
