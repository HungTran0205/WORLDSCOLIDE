/**
 * Game screen — renders 3D world, HUD, panels, and runs the game tick loop.
 * Extracted from App to allow hook usage (useGameTickLoop) only when game is active.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { FACILITY_SLOTS } from '@/game/data/facility-slot-positions';
import { World } from '@/scene/world';
import { HUD } from '@/ui/hud/hud';
import { QuestBoard } from '@/ui/panels/quest-board';
import { GuildRoster } from '@/ui/panels/guild-roster';
import { FacilitiesPanel } from '@/ui/panels/facilities-panel';
import { OfflineFacilityPopup } from '@/ui/components/offline-facility-popup';
import { CombatView } from '@/ui/panels/combat-view';
import { SettingsPanel } from '@/ui/panels/settings-panel';
import { GameOverOverlay } from '@/ui/panels/game-over-overlay';
import { WorldBoardModal } from '@/ui/components/world-board-modal';
import { NpcAlarm } from '@/ui/components/npc-alarm';
import { KaelRescueDialogue, TutorialRewardSplash } from '@/ui/components/tutorial-dialogue-overlays';
import { TutorialFirstHaulSplash } from '@/ui/components/tutorial-first-haul-splash';
import { TutorialGraduationToast } from '@/ui/components/tutorial-graduation-toast';
import { MissionNotification } from '@/ui/components/mission-notification';
import { ActiveMissionsList } from '@/ui/panels/active-missions-list';
import { CombatPrepPanel } from '@/ui/panels/combat-prep-panel';
import { CombatPanel } from '@/ui/panels/combat-panel';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { AlchemyCraftPanel } from '@/ui/panels/alchemy-craft-panel';
import { WorkshopPanel } from '@/ui/panels/workshop-panel';
import { TavernPanel } from '@/ui/panels/tavern-panel';
import { CombatSkillHotbar } from '@/ui/panels/combat-skill-hotbar';
import { CombatTimelineBar } from '@/ui/panels/combat-timeline-bar';
import { CombatResultOverlay } from '@/ui/panels/combat-result-overlay';
import { useGameTickLoop } from '@/ui/hooks/use-game-tick-loop';
import { useGameStore } from '@/game/state/store';
import { useUiStore } from '@/game/state/ui-store';
import { GUILD_HALL_CAMERA_TARGET } from '@/game/state/camera-slice';
import { playBGM } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
import type { PanelId } from '@/ui/hud/panel-toggle';
import { KeyboardShortcuts } from '@/ui/hud/keyboard-shortcuts';
import { DrumTooltipArrow } from '@/ui/overlays/drum-tooltip-arrow';
import { FacilityHintCoachmark } from '@/ui/overlays/facility-hint-coachmark';
import { DEBUG_MODE } from '@/debug';
import { TutorialCoachmark } from '@/ui/coachmark/tutorial-coachmark';
import { getCurrentStep } from '@/game/systems/tutorial-manager';
import { FacilitySlotDebugPanel } from '@/scene/facility/facility-slot-debug-panel';

/** Home button — returns camera to guild hall; visible only when camera is in a facility room */
function HomeButton() {
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const resetCameraToGuildHall = useGameStore((s) => s.resetCameraToGuildHall);
  const setCameraTarget = useGameStore((s) => s.setCameraTarget);
  const facilities = useGameStore((s) => s.facilities);

  const isAtGuildHall =
    cameraTarget[0] === GUILD_HALL_CAMERA_TARGET[0] &&
    cameraTarget[2] === GUILD_HALL_CAMERA_TARGET[2];

  // WASD snaps to nearest room in that direction; ESC returns to guild hall
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isAtGuildHall) resetCameraToGuildHall();
        return;
      }

      const dirs: Record<string, 'w' | 's' | 'a' | 'd'> = {
        w: 'w', W: 'w', s: 's', S: 's', a: 'a', A: 'a', d: 'd', D: 'd',
      };
      const dir = dirs[e.key];
      if (!dir) return;

      // Build list of navigable rooms: guild hall + placed facilities
      const rooms: [number, number, number][] = [GUILD_HALL_CAMERA_TARGET];
      for (const f of facilities) {
        if (f.level > 0 && f.placedSlot !== null) rooms.push(FACILITY_SLOTS[f.placedSlot]);
      }

      const [cx, cy, cz] = cameraTarget;
      let best: [number, number, number] | null = null;
      let bestDist = Infinity;

      for (const room of rooms) {
        const [rx, , rz] = room;
        if (rx === cx && rz === cz) continue; // skip current room

        let dist = Infinity;
        if (dir === 'w' && rz < cz) dist = cz - rz;
        else if (dir === 's' && rz > cz) dist = rz - cz;
        else if (dir === 'a' && rx < cx) dist = cx - rx;
        else if (dir === 'd' && rx > cx) dist = rx - cx;

        if (dist < bestDist) { bestDist = dist; best = room; }
      }

      if (best) setCameraTarget([best[0], cy, best[2]]);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAtGuildHall, cameraTarget, setCameraTarget, resetCameraToGuildHall, facilities]);

  return null;
}


interface GameScreenProps {
  onReturnToTitle: () => void;
}

export function GameScreen({ onReturnToTitle }: GameScreenProps) {
  const [activePanel, setActivePanel] = useState<PanelId>(null);
  const [alchemyPanelOpen, setAlchemyPanelOpen] = useState(false);
  const [workshopPanelOpen, setWorkshopPanelOpen] = useState(false);
  const [tavernPanelOpen, setTavernPanelOpen] = useState(false);
  // Beat-2 sub-phase: the trimmed world-board lore page shows first, then the NPC
  // alarm. Reset by leaving the 'arrival-alarm' step (so a re-entry replays from lore).
  const [loreSeen, setLoreSeen] = useState(false);
  // Graduation toast fires only on the live transition INTO 'complete', never when a
  // finished save is reloaded (prevStepRef seeds to the loaded step on mount).
  const [showGraduation, setShowGraduation] = useState(false);

  // Detect when camera is settled inside an alchemy lab room
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const cameraSettled = useGameStore((s) => s.cameraSettled);
  const allFacilities = useGameStore((s) => s.facilities);

  const alchemyFacility = useMemo(() => allFacilities.find((f) => {
    if (f.type !== 'alchemy-lab' || f.level === 0 || f.placedSlot === null) return false;
    const [fx, , fz] = FACILITY_SLOTS[f.placedSlot];
    return Math.abs(cameraTarget[0] - fx) <= 3.5 && Math.abs(cameraTarget[2] - fz) <= 3.5;
  }), [allFacilities, cameraTarget]);

  const workshopFacility = useMemo(() => allFacilities.find((f) => {
    if (f.type !== 'workshop' || f.level === 0 || f.placedSlot === null) return false;
    const [fx, , fz] = FACILITY_SLOTS[f.placedSlot];
    return Math.abs(cameraTarget[0] - fx) <= 3.5 && Math.abs(cameraTarget[2] - fz) <= 3.5;
  }), [allFacilities, cameraTarget]);

  const tavernFacility = useMemo(() => allFacilities.find((f) => {
    if (f.type !== 'tavern' || f.level === 0 || f.placedSlot === null) return false;
    const [fx, , fz] = FACILITY_SLOTS[f.placedSlot];
    return Math.abs(cameraTarget[0] - fx) <= 3.5 && Math.abs(cameraTarget[2] - fz) <= 3.5;
  }), [allFacilities, cameraTarget]);

  const currentCombatReplay = useGameStore((s) => s.currentCombatReplay);
  const gameScene = useGameStore((s) => s.gameScene);
  const arenaPhase = useGameStore((s) => s.arenaPhase);
  const isCombatPanelOpen = useCombatPanelStore((s) => s.isOpen);
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

  // Bridge: drum mesh click → quest panel (sets cameraFocus='quest-board' via slice action)
  const pendingQuestPanel = useGameStore((s) => s.pendingQuestPanel);
  const clearPendingQuestPanel = useGameStore((s) => s.clearPendingQuestPanel);
  const setCameraFocus = useGameStore((s) => s.setCameraFocus);
  useEffect(() => {
    if (pendingQuestPanel) {
      setActivePanel('quests');
      clearPendingQuestPanel();
    }
  }, [pendingQuestPanel, clearPendingQuestPanel]);

  // Keep cameraFocus aligned with active panel — HUD button or drum click both
  // funnel through here so the cinematic framing applies either way. Reset to
  // 'default' whenever the quest panel is closed.
  //
  // Facility-focus is a SEPARATE driver: object-click sets it via requestFacilityPanel
  // without touching activePanel, and the facility panels' onClose restores it. This
  // effect therefore only owns the quest-board↔default transition.
  useEffect(() => {
    setCameraFocus(activePanel === 'quests' ? 'quest-board' : 'default');
  }, [activePanel, setCameraFocus]);

  // Bridge: room object click → facility function panel. Open the panel keyed by the
  // pending type ONLY when the matching proximity finder is truthy (i.e. the camera is
  // actually in that room), so a stale signal can't open a panel for a room we left.
  // Clear the signal immediately after handling.
  const pendingFacilityFunctionPanel = useGameStore((s) => s.pendingFacilityFunctionPanel);
  const clearPendingFacilityFunctionPanel = useGameStore((s) => s.clearPendingFacilityFunctionPanel);
  const setCameraTarget = useGameStore((s) => s.setCameraTarget);
  useEffect(() => {
    if (!pendingFacilityFunctionPanel) return;
    if (pendingFacilityFunctionPanel === 'workshop' && workshopFacility) setWorkshopPanelOpen(true);
    else if (pendingFacilityFunctionPanel === 'alchemy-lab' && alchemyFacility) setAlchemyPanelOpen(true);
    else if (pendingFacilityFunctionPanel === 'tavern' && tavernFacility) setTavernPanelOpen(true);
    clearPendingFacilityFunctionPanel();
  }, [pendingFacilityFunctionPanel, clearPendingFacilityFunctionPanel, workshopFacility, alchemyFacility, tavernFacility]);

  // Leaving a room (proximity finder goes falsy) closes its open panel and restores
  // default framing — replaces the old auto-open effect's else branch.
  useEffect(() => {
    if (!workshopFacility && workshopPanelOpen) { setWorkshopPanelOpen(false); setCameraFocus('default'); }
  }, [workshopFacility, workshopPanelOpen, setCameraFocus]);
  useEffect(() => {
    if (!alchemyFacility && alchemyPanelOpen) { setAlchemyPanelOpen(false); setCameraFocus('default'); }
  }, [alchemyFacility, alchemyPanelOpen, setCameraFocus]);
  useEffect(() => {
    if (!tavernFacility && tavernPanelOpen) { setTavernPanelOpen(false); setCameraFocus('default'); }
  }, [tavernFacility, tavernPanelOpen, setCameraFocus]);

  // Closing a panel pulls the camera back from the object to the room overview and
  // restores default framing (re-enables orbit). Falls back to leaving the target
  // untouched if the slot is missing. Preserves current eye-height (y).
  const restoreRoomFraming = (placedSlot: number | null) => {
    if (placedSlot !== null) {
      const [fx, , fz] = FACILITY_SLOTS[placedSlot];
      setCameraTarget([fx, cameraTarget[1], fz]);
    }
    setCameraFocus('default');
  };

  // Switch BGM when scene changes
  useEffect(() => {
    playBGM(gameScene === 'combat-arena' ? AUDIO.BGM_COMBAT : AUDIO.BGM_GUILD);
  }, [gameScene]);

  // Detect game over: all guild members are injured
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const allMembers = founder ? [founder, ...roster] : roster;
  const isGameOver = allMembers.length > 0 && allMembers.every((m) => m.status === 'injured');
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  // Gate the opening lore modal on the 3D world being interactive (issue: the WebGPU
  // first-load freeze leaves the Begin button unclickable behind a black scene).
  const worldReady = useUiStore((s) => s.worldReady);

  // Current step's coachmark config (only guild-hall beats carry one).
  const coachConfig = getCurrentStep(tutorialStep)?.coach;

  // Fire the graduation toast only on the live build-tavern → complete transition.
  const prevStepRef = useRef(tutorialStep);
  useEffect(() => {
    if (prevStepRef.current !== 'complete' && tutorialStep === 'complete') {
      setShowGraduation(true);
    }
    prevStepRef.current = tutorialStep;
  }, [tutorialStep]);

  // Start game tick loop (missions, injuries, clock, tavern refresh)
  useGameTickLoop();

  return (
    <>
      {/* Scene switching: guild-hall vs combat-arena.
          World is always mounted — avoids 5-10s WebGPU re-init freeze on
          scene switch. CSS hides the canvas; isActive pauses the render
          loop to save GPU and signals clock drain on re-activation. */}
      <div style={{ display: gameScene === 'guild-hall' || isCombatPanelOpen ? 'block' : 'none' }}>
        <World isActive={gameScene === 'guild-hall' || isCombatPanelOpen} />
      </div>

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
          {activePanel === 'combat' && <CombatView onClose={() => setActivePanel(null)} />}
          {activePanel === 'settings' && (
            <SettingsPanel
              onClose={() => setActivePanel(null)}
              onReturnToTitle={onReturnToTitle}
            />
          )}
          {tutorialStep === 'arrival-alarm' && !loreSeen && worldReady && (
            <WorldBoardModal onBegin={() => setLoreSeen(true)} />
          )}
          {alchemyPanelOpen && alchemyFacility && (
            <AlchemyCraftPanel
              facility={alchemyFacility}
              onClose={() => { setAlchemyPanelOpen(false); restoreRoomFraming(alchemyFacility.placedSlot); }}
            />
          )}
          {workshopPanelOpen && workshopFacility && (
            <WorkshopPanel
              facility={workshopFacility}
              onClose={() => { setWorkshopPanelOpen(false); restoreRoomFraming(workshopFacility.placedSlot); }}
            />
          )}
          {tavernPanelOpen && tavernFacility && (
            <TavernPanel
              facility={tavernFacility}
              onClose={() => { setTavernPanelOpen(false); restoreRoomFraming(tavernFacility.placedSlot); }}
            />
          )}
          <FacilityHintCoachmark
            activeType={
              workshopFacility ? 'workshop'
                : alchemyFacility ? 'alchemy-lab'
                  : tavernFacility ? 'tavern'
                    : null
            }
            roomCenter={
              workshopFacility?.placedSlot != null ? FACILITY_SLOTS[workshopFacility.placedSlot]
                : alchemyFacility?.placedSlot != null ? FACILITY_SLOTS[alchemyFacility.placedSlot]
                  : tavernFacility?.placedSlot != null ? FACILITY_SLOTS[tavernFacility.placedSlot]
                    : null
            }
            settled={cameraSettled}
            panelOpen={workshopPanelOpen || alchemyPanelOpen || tavernPanelOpen}
          />
          <HomeButton />
          <KeyboardShortcuts activePanel={activePanel} setActivePanel={setActivePanel} />
          <DrumTooltipArrow activePanel={activePanel} />
        </>
      )}

      {/* Tutorial overlays — step-keyed; shown over any scene. */}
      {tutorialStep === 'arrival-alarm' && loreSeen && (
        <NpcAlarm onComplete={() => setTutorialStep('open-quest-board')} />
      )}
      {/* Rescue dialogue waits until the combat victory screen is dismissed, so the
          player sees VICTORY + rewards first, THEN the Kael-rescue payoff. */}
      {tutorialStep === 'kael-rescue' && !isCombatPanelOpen && <KaelRescueDialogue />}
      {tutorialStep === 'reward-splash' && <TutorialRewardSplash />}
      {tutorialStep === 'first-haul-reward' && <TutorialFirstHaulSplash />}
      {showGraduation && <TutorialGraduationToast onClose={() => setShowGraduation(false)} />}

      {/* Step coachmark — only guild-hall beats define a coach config. Hides itself
          when its DOM/world target is absent (e.g. panel closed), so it never traps. */}
      {gameScene === 'guild-hall' && coachConfig && (
        <TutorialCoachmark active {...coachConfig} />
      )}

      {/* Always visible regardless of scene */}
      <ActiveMissionsList />
      <MissionNotification />

      {/* Combat arena UI overlays — legacy path, hidden when the new combat panel is driving combat */}
      {!isCombatPanelOpen && gameScene === 'combat-arena' && arenaPhase === 'prep' && <CombatPrepPanel />}
      {!isCombatPanelOpen && gameScene === 'combat-arena' && arenaPhase === 'fighting' && <CombatTimelineBar />}
      {!isCombatPanelOpen && gameScene === 'combat-arena' && arenaPhase === 'fighting' && <CombatSkillHotbar />}
      {!isCombatPanelOpen && gameScene === 'combat-arena' && arenaPhase === 'result' && <CombatResultOverlay />}

      {/* New idle combat panel (Phase 3+) — single overlay hosts formation/battle/result */}
      <CombatPanel />

      {isGameOver && gameScene === 'guild-hall' && <GameOverOverlay onReturnToTitle={onReturnToTitle} />}

      {DEBUG_MODE && <FacilitySlotDebugPanel />}
    </>
  );
}
