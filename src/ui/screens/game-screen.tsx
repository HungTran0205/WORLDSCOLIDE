/**
 * Game screen — renders 3D world, HUD, panels, and runs the game tick loop.
 * Extracted from App to allow hook usage (useGameTickLoop) only when game is active.
 */

import { useState, useEffect } from 'react';
import { World } from '@/scene/world';
import { HUD } from '@/ui/hud/hud';
import { QuestBoard } from '@/ui/panels/quest-board';
import { GuildRoster } from '@/ui/panels/guild-roster';
import { TavernPanel } from '@/ui/panels/tavern-panel';
import { BuildMenu } from '@/ui/panels/build-menu';
import { CombatView } from '@/ui/panels/combat-view';
import { SettingsPanel } from '@/ui/panels/settings-panel';
import { GameOverOverlay } from '@/ui/panels/game-over-overlay';
import { BuildModeHint } from '@/ui/components/build-mode-hint';
import { MissionNotification } from '@/ui/components/mission-notification';
import { useGameTickLoop } from '@/ui/hooks/use-game-tick-loop';
import { useGameStore } from '@/game/state/store';
import type { PanelId } from '@/ui/hud/panel-toggle';

/** Floating toggle button to enter/exit build mode */
function BuildModeToggle() {
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  const toggleBuildMode = useGameStore((s) => s.toggleBuildMode);

  return (
    <button
      onClick={() => toggleBuildMode(!isBuildMode)}
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        padding: '10px 20px',
        background: isBuildMode ? '#ff4444' : '#4488ff',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        zIndex: 100,
      }}
    >
      {isBuildMode ? 'Exit Build' : 'Build Mode'}
    </button>
  );
}

interface GameScreenProps {
  onReturnToTitle: () => void;
}

export function GameScreen({ onReturnToTitle }: GameScreenProps) {
  const [activePanel, setActivePanel] = useState<PanelId>(null);
  const currentCombatReplay = useGameStore((s) => s.currentCombatReplay);

  // Auto-open combat panel when manual combat replay is set
  useEffect(() => {
    if (currentCombatReplay) {
      setActivePanel('combat');
    }
  }, [currentCombatReplay]);

  // Detect game over: all guild members are injured
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const allMembers = founder ? [founder, ...roster] : roster;
  const isGameOver = allMembers.length > 0 && allMembers.every((m) => m.status === 'injured');

  // Start game tick loop (missions, injuries, clock, tavern refresh)
  useGameTickLoop();

  return (
    <>
      <World />
      <HUD activePanel={activePanel} setActivePanel={setActivePanel} />
      {activePanel === 'quests' && <QuestBoard onClose={() => setActivePanel(null)} />}
      {activePanel === 'roster' && <GuildRoster onClose={() => setActivePanel(null)} />}
      {activePanel === 'tavern' && <TavernPanel onClose={() => setActivePanel(null)} />}
      {activePanel === 'build' && <BuildMenu onClose={() => setActivePanel(null)} />}
      {activePanel === 'combat' && <CombatView onClose={() => setActivePanel(null)} />}
      {activePanel === 'settings' && (
        <SettingsPanel
          onClose={() => setActivePanel(null)}
          onReturnToTitle={onReturnToTitle}
        />
      )}
      <MissionNotification />
      <BuildModeHint />
      <BuildModeToggle />
      {isGameOver && <GameOverOverlay onReturnToTitle={onReturnToTitle} />}
    </>
  );
}
