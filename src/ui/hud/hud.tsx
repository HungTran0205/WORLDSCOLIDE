import { useGameStore } from '@/game/state/store';
import { GoldDisplay } from '@/ui/components/gold-display';
import { ResourceBar } from '@/ui/components/resource-bar';
import { SaveStatusBadge } from './save-status-badge';
import { PanelToggle, type PanelId } from './panel-toggle';
import '@/ui/styles/hud.css';

interface HUDProps {
  activePanel: PanelId;
  setActivePanel: (id: PanelId) => void;
}

export function HUD({ activePanel, setActivePanel }: HUDProps) {
  const gold = useGameStore((s) => s.gold);
  const rosterCount = useGameStore((s) => s.roster.length);
  const missionCount = useGameStore((s) => s.activeMissions.length);

  return (
    <div className="hud-overlay">
      <div className="hud-top-bar">
        <GoldDisplay amount={gold} />
        <ResourceBar />
        <span>Members: {rosterCount + 1}</span>
        <span>Missions: {missionCount}</span>
        <SaveStatusBadge />
      </div>
      <PanelToggle activePanel={activePanel} setActivePanel={setActivePanel} />
    </div>
  );
}
