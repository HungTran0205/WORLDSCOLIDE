import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/game/state/ui-store';
import { assetUrl } from '@/lib/asset-url';
import '@/ui/styles/hud.css';

// Re-export PanelId from its canonical location so existing imports of
// `type PanelId from '@/ui/hud/panel-toggle'` keep working during migration.
export type { PanelId } from '@/game/state/panel-slice';

const PANEL_IDS = ['quests', 'roster', 'facilities', 'settings'] as const;
type KnownPanelId = typeof PANEL_IDS[number];

/** Pixel icon path for each toggle panel (served through assetUrl for itch subpath). */
const PANEL_ICONS: Record<KnownPanelId, string> = {
  quests:     '/ui/icons/ui/quests.png',
  roster:     '/ui/icons/ui/roster.png',
  facilities: '/ui/icons/ui/facilities.png',
  settings:   '/ui/icons/ui/settings.png',
};

interface PanelToggleProps {
  /** Panel ID to highlight (tutorial guidance). Pulses with a gold border. */
  highlightPanel?: string | null;
}

export function PanelToggle({ highlightPanel }: PanelToggleProps) {
  const { t } = useTranslation();
  const mainPanel = useUiStore((s) => s.mainPanel);
  const openPanel = useUiStore((s) => s.openPanel);
  const closePanel = useUiStore((s) => s.closePanel);

  return (
    <div className="panel-toggle-bar">
      {PANEL_IDS.map((id: KnownPanelId) => (
        <button
          key={id}
          type="button"
          className={[
            'panel-toggle-btn',
            mainPanel === id ? 'active' : '',
            highlightPanel === id ? 'tutorial-highlight' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => mainPanel === id ? closePanel() : openPanel(id)}
          aria-label={t(`panelToggle.${id}`)}
          title={t(`panelToggle.${id}`)}
          aria-pressed={mainPanel === id}
        >
          <img
            src={assetUrl(PANEL_ICONS[id])}
            alt=""
            aria-hidden="true"
            className="panel-toggle-icon ink-pixelated"
            width={28}
            height={28}
          />
        </button>
      ))}
    </div>
  );
}
