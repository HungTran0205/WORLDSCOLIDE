/**
 * Game screen — renders 3D world, HUD, panels, and runs the game tick loop.
 * Extracted from App to allow hook usage (useGameTickLoop) only when game is active.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { PanelClosingContext, useDelayedUnmount } from '@/ui/components/use-delayed-unmount';
import type { FacilityFunctionType } from '@/game/state/panel-slice';
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
import { TrainingYardPanel } from '@/ui/panels/training-yard-panel';
import { CombatSkillHotbar } from '@/ui/panels/combat-skill-hotbar';
import { CombatTimelineBar } from '@/ui/panels/combat-timeline-bar';
import { CombatResultOverlay } from '@/ui/panels/combat-result-overlay';
import { useGameTickLoop } from '@/ui/hooks/use-game-tick-loop';
import { useGameStore } from '@/game/state/store';
import { useUiStore } from '@/game/state/ui-store';
import { GUILD_HALL_CAMERA_TARGET } from '@/game/state/camera-slice';
import { playBGM } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
import { KeyboardShortcuts } from '@/ui/hud/keyboard-shortcuts';
import { DrumTooltipArrow } from '@/ui/overlays/drum-tooltip-arrow';
import { FacilityHintCoachmark } from '@/ui/overlays/facility-hint-coachmark';
import { DEBUG_MODE } from '@/debug';
import { TutorialCoachmark } from '@/ui/coachmark/tutorial-coachmark';
import { getCurrentStep } from '@/game/systems/tutorial-manager';
import { tContent } from '@/i18n/content-localization';
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
  // Panel state lives in ui-store (two independent axes: mainPanel + facilityPanel).
  // game-screen effects call store actions; proximity math stays here (render-coupled).
  const mainPanel = useUiStore((s) => s.mainPanel);
  const facilityPanel = useUiStore((s) => s.facilityPanel);
  const openPanel = useUiStore((s) => s.openPanel);
  const closePanel = useUiStore((s) => s.closePanel);
  const openFacilityPanel = useUiStore((s) => s.openFacilityPanel);
  const closeFacilityPanel = useUiStore((s) => s.closeFacilityPanel);

  // Delayed-unmount wrappers: keep panels mounted for exit animation grace period
  // (150ms close anim + a little headroom). Camera-restore effects below key off
  // the REAL store values (mainPanel / facilityPanel), not the delayed rendered
  // values — camera should move immediately when the store clears, not after the
  // animation finishes.
  const PANEL_CLOSE_DELAY_MS = 200;
  const mainPanelDU = useDelayedUnmount(mainPanel, PANEL_CLOSE_DELAY_MS);
  const facilityPanelDU = useDelayedUnmount(facilityPanel, PANEL_CLOSE_DELAY_MS);
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

  const trainingFacility = useMemo(() => allFacilities.find((f) => {
    if (f.type !== 'training-yard' || f.level === 0 || f.placedSlot === null) return false;
    const [fx, , fz] = FACILITY_SLOTS[f.placedSlot];
    return Math.abs(cameraTarget[0] - fx) <= 3.5 && Math.abs(cameraTarget[2] - fz) <= 3.5;
  }), [allFacilities, cameraTarget]);

  const currentCombatReplay = useGameStore((s) => s.currentCombatReplay);
  const gameScene = useGameStore((s) => s.gameScene);
  const arenaPhase = useGameStore((s) => s.arenaPhase);
  const isCombatPanelOpen = useCombatPanelStore((s) => s.isOpen);
  const offlineReport = useGameStore((s) => s.offlineReport);
  const clearOfflineReport = useGameStore((s) => s.clearOfflineReport);
  const pendingFacilityPanel = useGameStore((s) => s.pendingFacilityPanel);
  const clearPendingFacilityPanel = useGameStore((s) => s.clearPendingFacilityPanel);

  // Auto-open combat panel when manual combat replay is set
  useEffect(() => {
    if (currentCombatReplay) {
      openPanel('combat');
    }
  }, [currentCombatReplay, openPanel]);

  // Bridge: R3F zone click → React panel state (Canvas cannot call store actions directly)
  useEffect(() => {
    if (pendingFacilityPanel) {
      openPanel('facilities');
      clearPendingFacilityPanel();
    }
  }, [pendingFacilityPanel, clearPendingFacilityPanel, openPanel]);

  // Bridge: drum mesh click → quest panel (sets cameraFocus='quest-board' via slice action)
  const pendingQuestPanel = useGameStore((s) => s.pendingQuestPanel);
  const clearPendingQuestPanel = useGameStore((s) => s.clearPendingQuestPanel);
  const setCameraFocus = useGameStore((s) => s.setCameraFocus);
  useEffect(() => {
    if (pendingQuestPanel) {
      openPanel('quests');
      clearPendingQuestPanel();
    }
  }, [pendingQuestPanel, clearPendingQuestPanel, openPanel]);

  // Keep cameraFocus aligned with active main panel — HUD button or drum click both
  // funnel through here so the cinematic framing applies either way. Reset to
  // 'default' whenever the quest panel is closed.
  //
  // Facility-focus is a SEPARATE driver: object-click sets it via requestFacilityPanel
  // without touching mainPanel, and the facility panels' onClose restores it. This
  // effect therefore only owns the quest-board↔default transition.
  useEffect(() => {
    setCameraFocus(mainPanel === 'quests' ? 'quest-board' : 'default');
  }, [mainPanel, setCameraFocus]);

  // Bridge: room object click → facility function panel. Open the panel keyed by the
  // pending type ONLY when the matching proximity finder is truthy (i.e. the camera is
  // actually in that room), so a stale signal can't open a panel for a room we left.
  // Clear the signal immediately after handling.
  const pendingFacilityFunctionPanel = useGameStore((s) => s.pendingFacilityFunctionPanel);
  const clearPendingFacilityFunctionPanel = useGameStore((s) => s.clearPendingFacilityFunctionPanel);
  const setCameraTarget = useGameStore((s) => s.setCameraTarget);
  useEffect(() => {
    if (!pendingFacilityFunctionPanel) return;
    // Open only when the matching proximity finder is truthy — guards against stale
    // signals from rooms the camera has already left.
    if (pendingFacilityFunctionPanel === 'workshop' && workshopFacility) openFacilityPanel('workshop');
    else if (pendingFacilityFunctionPanel === 'alchemy-lab' && alchemyFacility) openFacilityPanel('alchemy-lab');
    else if (pendingFacilityFunctionPanel === 'tavern' && tavernFacility) openFacilityPanel('tavern');
    else if (pendingFacilityFunctionPanel === 'training-yard' && trainingFacility) openFacilityPanel('training-yard');
    clearPendingFacilityFunctionPanel();
  }, [pendingFacilityFunctionPanel, clearPendingFacilityFunctionPanel, workshopFacility, alchemyFacility, tavernFacility, trainingFacility, openFacilityPanel]);

  // Leaving a room (proximity finder goes falsy) closes the facility panel when it
  // matches the room we just left. Uses a single facilityPanel enum slot — safe because
  // proximity finders are mutually exclusive by camera position (camera points at one
  // cameraTarget at a time, and each facility occupies a distinct world slot).
  // Proximity auto-close: camera left the room. Sets cameraFocus to 'default'
  // BEFORE closeFacilityPanel() fires, so the centralized restore effect (above)
  // sees cameraFocus !== 'facility-focus' and skips the camera snap — the player
  // already navigated away voluntarily.
  useEffect(() => {
    if (!workshopFacility && facilityPanel === 'workshop') { setCameraFocus('default'); closeFacilityPanel(); }
  }, [workshopFacility, facilityPanel, closeFacilityPanel, setCameraFocus]);
  useEffect(() => {
    if (!alchemyFacility && facilityPanel === 'alchemy-lab') { setCameraFocus('default'); closeFacilityPanel(); }
  }, [alchemyFacility, facilityPanel, closeFacilityPanel, setCameraFocus]);
  useEffect(() => {
    if (!tavernFacility && facilityPanel === 'tavern') { setCameraFocus('default'); closeFacilityPanel(); }
  }, [tavernFacility, facilityPanel, closeFacilityPanel, setCameraFocus]);
  useEffect(() => {
    if (!trainingFacility && facilityPanel === 'training-yard') { setCameraFocus('default'); closeFacilityPanel(); }
  }, [trainingFacility, facilityPanel, closeFacilityPanel, setCameraFocus]);

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

  // Track the previous facility panel value so we know which slot to restore
  // when the panel closes (facilityPanel flips null before we can read the old value).
  const prevFacilityRef = useRef<{ type: FacilityFunctionType; slot: number | null } | null>(null);

  // Centralized facility-panel camera restore. Keys off the REAL store value
  // (facilityPanel), not the delayed rendered value — camera moves immediately on
  // close, before the exit animation finishes.
  //
  // Guard: only restore when cameraFocus is still 'facility-focus' (i.e. the camera
  // was parked at the object by this panel's open). Proximity auto-close fires
  // AFTER the camera has already left the room (cameraFocus already reset to
  // 'default' by the proximity effects below), so the guard prevents a spurious
  // camera snap back when the player walks away.
  useEffect(() => {
    if (prevFacilityRef.current !== null && facilityPanel === null) {
      // Fresh read via getState(): a render-time subscription would capture a
      // stale 'facility-focus' on the facility→main mutual-exclusion switch and
      // clobber the focus the main-panel effect just set in this same commit.
      if (useGameStore.getState().cameraFocus === 'facility-focus') {
        restoreRoomFraming(prevFacilityRef.current.slot);
      }
    }
    // Update ref to track the latest open panel's slot for the next close.
    if (facilityPanel !== null) {
      const matchingFacility = allFacilities.find(
        (f) => f.type === facilityPanel && f.level > 0 && f.placedSlot !== null,
      );
      prevFacilityRef.current = {
        type: facilityPanel,
        slot: matchingFacility?.placedSlot ?? null,
      };
    } else {
      prevFacilityRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityPanel]);

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

  // Current step's coachmark config (only guild-hall beats carry one). Caption is
  // resolved against the active language here (step known); the config's English
  // caption is the fallback, so EN players are unaffected.
  const coachConfig = getCurrentStep(tutorialStep)?.coach;
  const localizedCoachConfig = coachConfig
    ? { ...coachConfig, caption: tContent('tutorial', tutorialStep, 'coachCaption', coachConfig.caption) }
    : undefined;

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
          <HUD />

          {/* Main panels — rendered from delayed value so exit animation plays on
              every close path (✕, Esc, mutual-exclusion). PanelClosingContext tells
              PanelFrame to play close SFX + animation when the grace period starts. */}
          <PanelClosingContext.Provider value={mainPanelDU.closing}>
            {mainPanelDU.rendered === 'quests' && <QuestBoard onClose={closePanel} />}
            {mainPanelDU.rendered === 'roster' && <GuildRoster onClose={closePanel} />}
            {mainPanelDU.rendered === 'facilities' && <FacilitiesPanel onClose={closePanel} />}
            {mainPanelDU.rendered === 'combat' && <CombatView onClose={closePanel} />}
            {mainPanelDU.rendered === 'settings' && (
              <SettingsPanel
                onClose={closePanel}
                onReturnToTitle={onReturnToTitle}
              />
            )}
          </PanelClosingContext.Provider>

          {offlineReport && (
            <OfflineFacilityPopup
              report={offlineReport}
              onDismiss={clearOfflineReport}
            />
          )}
          {tutorialStep === 'arrival-alarm' && !loreSeen && worldReady && (
            <WorldBoardModal onBegin={() => setLoreSeen(true)} />
          )}

          {/* Facility panels — camera restore is centralized in the facilityPanel
              effect above; onClose only needs to close the store value. */}
          <PanelClosingContext.Provider value={facilityPanelDU.closing}>
            {facilityPanelDU.rendered === 'alchemy-lab' && alchemyFacility && (
              <AlchemyCraftPanel
                facility={alchemyFacility}
                onClose={closeFacilityPanel}
              />
            )}
            {facilityPanelDU.rendered === 'workshop' && workshopFacility && (
              <WorkshopPanel
                facility={workshopFacility}
                onClose={closeFacilityPanel}
              />
            )}
            {facilityPanelDU.rendered === 'tavern' && tavernFacility && (
              <TavernPanel
                facility={tavernFacility}
                onClose={closeFacilityPanel}
              />
            )}
            {facilityPanelDU.rendered === 'training-yard' && trainingFacility && (
              <TrainingYardPanel
                facility={trainingFacility}
                onClose={closeFacilityPanel}
              />
            )}
          </PanelClosingContext.Provider>
          <FacilityHintCoachmark
            activeType={
              workshopFacility ? 'workshop'
                : alchemyFacility ? 'alchemy-lab'
                  : tavernFacility ? 'tavern'
                    : trainingFacility ? 'training-yard'
                      : null
            }
            roomCenter={
              workshopFacility?.placedSlot != null ? FACILITY_SLOTS[workshopFacility.placedSlot]
                : alchemyFacility?.placedSlot != null ? FACILITY_SLOTS[alchemyFacility.placedSlot]
                  : tavernFacility?.placedSlot != null ? FACILITY_SLOTS[tavernFacility.placedSlot]
                    : trainingFacility?.placedSlot != null ? FACILITY_SLOTS[trainingFacility.placedSlot]
                      : null
            }
            settled={cameraSettled}
            panelOpen={facilityPanel !== null}
            // Re-point at the tavern counter during the recruit beat: the keeper
            // assignment already clicked the counter, which would otherwise leave
            // the player with no hint on where to open the recruitment panel.
            forceShow={tutorialStep === 'recruit-first-member'}
          />
          <HomeButton />
          <KeyboardShortcuts />
          <DrumTooltipArrow />
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
      {gameScene === 'guild-hall' && localizedCoachConfig && (
        <TutorialCoachmark active {...localizedCoachConfig} />
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
