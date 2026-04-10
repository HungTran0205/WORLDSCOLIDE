import { useGameStore } from '@/game/state/store';
import { GoldDisplay } from '@/ui/components/gold-display';
import { ResourceBar } from '@/ui/components/resource-bar';
import { SaveStatusBadge } from './save-status-badge';
import { PanelToggle, type PanelId } from './panel-toggle';
import { RoomNavBar } from './room-nav-bar';
import { formatGameTime } from '@/game/utils/format-game-time';
import { calcTotalUpkeep } from '@/game/systems/upkeep-system';
import '@/ui/styles/hud.css';

/** Compute upkeep inside selector to return primitive (avoids new array ref → infinite re-render) */
const selectDailyUpkeep = (s: { founder: import('@/game/state/game-state').Member | null; roster: import('@/game/state/game-state').Member[] }): number => {
  const all = s.founder ? [s.founder, ...s.roster] : s.roster;
  return calcTotalUpkeep(all);
};

interface HUDProps {
  activePanel: PanelId;
  setActivePanel: (id: PanelId) => void;
}

export function HUD({ activePanel, setActivePanel }: HUDProps) {
  const gold = useGameStore((s) => s.gold);
  const gameTime = useGameStore((s) => s.gameTime);
  const rosterCount = useGameStore((s) => s.roster.length);
  const hasFounder = useGameStore((s) => s.founder !== null);
  const missionCount = useGameStore((s) => s.activeMissions.length);
  const dailyUpkeep = useGameStore(selectDailyUpkeep);
  const memberCount = rosterCount + (hasFounder ? 1 : 0);

  return (
    <div className="hud-overlay">
      <div className="hud-top-bar">
        <span className="hud-clock">{formatGameTime(gameTime)}</span>
        <GoldDisplay amount={gold} />
        <span className="hud-upkeep">Upkeep: {dailyUpkeep}g/day</span>
        <ResourceBar />
        <span>Members: {memberCount}</span>
        <span>Missions: {missionCount}</span>
        <SaveStatusBadge />
      </div>
      <RoomNavBar />
      <PanelToggle activePanel={activePanel} setActivePanel={setActivePanel} />
    </div>
  );
}
