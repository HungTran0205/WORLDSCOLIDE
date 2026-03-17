import { useGameStore } from '@/game/state/store';
import { selectAllMembers } from '@/game/state/selectors';
import { GoldDisplay } from '@/ui/components/gold-display';
import { ResourceBar } from '@/ui/components/resource-bar';
import { SaveStatusBadge } from './save-status-badge';
import { PanelToggle, type PanelId } from './panel-toggle';
import { formatGameTime } from '@/game/utils/format-game-time';
import { calcTotalUpkeep } from '@/game/systems/upkeep-system';
import '@/ui/styles/hud.css';

interface HUDProps {
  activePanel: PanelId;
  setActivePanel: (id: PanelId) => void;
}

export function HUD({ activePanel, setActivePanel }: HUDProps) {
  const gold = useGameStore((s) => s.gold);
  const gameTime = useGameStore((s) => s.gameTime);
  const allMembers = useGameStore(selectAllMembers);
  const missionCount = useGameStore((s) => s.activeMissions.length);
  const dailyUpkeep = calcTotalUpkeep(allMembers);

  return (
    <div className="hud-overlay">
      <div className="hud-top-bar">
        <span className="hud-clock">{formatGameTime(gameTime)}</span>
        <GoldDisplay amount={gold} />
        <span className="hud-upkeep">Upkeep: {dailyUpkeep}g/day</span>
        <ResourceBar />
        <span>Members: {allMembers.length}</span>
        <span>Missions: {missionCount}</span>
        <SaveStatusBadge />
      </div>
      <PanelToggle activePanel={activePanel} setActivePanel={setActivePanel} />
    </div>
  );
}
