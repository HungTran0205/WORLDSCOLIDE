/**
 * Game screen — renders 3D world, HUD, panels, and runs the game tick loop.
 * Extracted from App to allow hook usage (useGameTickLoop) only when game is active.
 */

import { useState, useEffect } from 'react';
import { World } from '@/scene/world';
import { CombatArenaCanvas } from '@/scene/combat-arena';
import { HUD } from '@/ui/hud/hud';
import { QuestBoard } from '@/ui/panels/quest-board';
import { GuildRoster } from '@/ui/panels/guild-roster';
import { FacilitiesPanel } from '@/ui/panels/facilities-panel';
import { OfflineFacilityPopup } from '@/ui/components/offline-facility-popup';
import { BuildMenu } from '@/ui/panels/build-menu';
import { CombatView } from '@/ui/panels/combat-view';
import { SettingsPanel } from '@/ui/panels/settings-panel';
import { GameOverOverlay } from '@/ui/panels/game-over-overlay';
import { BuildModeHint } from '@/ui/components/build-mode-hint';
import { MissionNotification } from '@/ui/components/mission-notification';
import { ActiveMissionsList } from '@/ui/panels/active-missions-list';
import { CombatPrepPanel } from '@/ui/panels/combat-prep-panel';
import { CombatSkillHotbar } from '@/ui/panels/combat-skill-hotbar';
import { CombatResultOverlay } from '@/ui/panels/combat-result-overlay';
import { useGameTickLoop } from '@/ui/hooks/use-game-tick-loop';
import { useGameStore } from '@/game/state/store';
import { playBGM } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
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
  const gameScene = useGameStore((s) => s.gameScene);
  const arenaPhase = useGameStore((s) => s.arenaPhase);
  const offlineFacilityReport = useGameStore((s) => s.offlineFacilityReport);
  const offlineElapsedHours = useGameStore((s) => s.offlineElapsedHours);
  const clearOfflineFacilityReport = useGameStore((s) => s.clearOfflineFacilityReport);

  // Auto-open combat panel when manual combat replay is set
  useEffect(() => {
    if (currentCombatReplay) {
      setActivePanel('combat');
    }
  }, [currentCombatReplay]);

  // Switch BGM when scene changes
  useEffect(() => {
    playBGM(gameScene === 'combat-arena' ? AUDIO.BGM_COMBAT : AUDIO.BGM_GUILD);
  }, [gameScene]);

  // Detect game over: all guild members are injured
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const allMembers = founder ? [founder, ...roster] : roster;
  const isGameOver = allMembers.length > 0 && allMembers.every((m) => m.status === 'injured');

  // Start game tick loop (missions, injuries, clock, tavern refresh)
  useGameTickLoop();

  return (
    <>
      {/* Scene switching: guild-hall vs combat-arena */}
      {gameScene === 'guild-hall' && <World />}
      {gameScene === 'combat-arena' && <CombatArenaCanvas />}

      {/* HUD + panels (only in guild-hall) */}
      {gameScene === 'guild-hall' && (
        <>
          <HUD activePanel={activePanel} setActivePanel={setActivePanel} />
          {activePanel === 'quests' && <QuestBoard onClose={() => setActivePanel(null)} />}
          {activePanel === 'roster' && <GuildRoster onClose={() => setActivePanel(null)} />}
          {activePanel === 'facilities' && <FacilitiesPanel onClose={() => setActivePanel(null)} />}
          {offlineFacilityReport && (
            <OfflineFacilityPopup
              results={offlineFacilityReport}
              elapsedHours={offlineElapsedHours}
              onDismiss={clearOfflineFacilityReport}
            />
          )}
          {activePanel === 'build' && <BuildMenu onClose={() => setActivePanel(null)} />}
          {activePanel === 'combat' && <CombatView onClose={() => setActivePanel(null)} />}
          {activePanel === 'settings' && (
            <SettingsPanel
              onClose={() => setActivePanel(null)}
              onReturnToTitle={onReturnToTitle}
            />
          )}
          <BuildModeHint />
          <BuildModeToggle />
        </>
      )}

      {/* Always visible regardless of scene */}
      <ActiveMissionsList />
      <MissionNotification />

      {/* Combat arena UI overlays */}
      {gameScene === 'combat-arena' && arenaPhase === 'prep' && <CombatPrepPanel />}
      {gameScene === 'combat-arena' && arenaPhase === 'fighting' && <CombatSkillHotbar />}
      {gameScene === 'combat-arena' && arenaPhase === 'result' && <CombatResultOverlay />}

      {isGameOver && gameScene === 'guild-hall' && <GameOverOverlay onReturnToTitle={onReturnToTitle} />}
    </>
  );
}
