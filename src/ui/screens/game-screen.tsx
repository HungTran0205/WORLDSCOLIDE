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
import { GUILD_HALL_CAMERA_TARGET } from '@/game/state/camera-slice';
import { playBGM } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
import type { PanelId } from '@/ui/hud/panel-toggle';

/** Home button — returns camera to guild hall; visible only when camera is in a facility room */
function HomeButton() {
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const resetCameraToGuildHall = useGameStore((s) => s.resetCameraToGuildHall);

  const isAtGuildHall =
    cameraTarget[0] === GUILD_HALL_CAMERA_TARGET[0] &&
    cameraTarget[2] === GUILD_HALL_CAMERA_TARGET[2];

  // ESC returns to guild hall when inside a facility room
  useEffect(() => {
    if (isAtGuildHall) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resetCameraToGuildHall();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAtGuildHall, resetCameraToGuildHall]);

  if (isAtGuildHall) return null;

  return (
    <button
      onClick={resetCameraToGuildHall}
      title="Return to Guild Hall"
      style={{
        position: 'fixed',
        bottom: 60,
        left: 16,
        width: 44,
        height: 44,
        background: 'rgba(30,20,10,0.85)',
        color: '#ffd700',
        border: '1px solid rgba(255,215,0,0.4)',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: '1.3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      🏠
    </button>
  );
}

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
  const pendingFacilityPanel = useGameStore((s) => s.pendingFacilityPanel);
  const clearPendingFacilityPanel = useGameStore((s) => s.clearPendingFacilityPanel);

  // Auto-open combat panel when manual combat replay is set
  useEffect(() => {
    if (currentCombatReplay) {
      setActivePanel('combat');
    }
  }, [currentCombatReplay]);

  // Bridge: R3F zone click → React panel state (Canvas cannot call setActivePanel directly)
  useEffect(() => {
    if (pendingFacilityPanel) {
      setActivePanel('facilities');
      clearPendingFacilityPanel();
    }
  }, [pendingFacilityPanel, clearPendingFacilityPanel]);

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
          <HomeButton />
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
