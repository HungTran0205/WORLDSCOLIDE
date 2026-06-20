/**
 * Combat panel — single overlay that hosts formation / battle / result
 * sub-phases. Mounts when combatPanelStore.isOpen, dims the guild scene, and
 * routes between sub-panels based on combatPanelStore.phase.
 *
 * Shell chrome (header, border, close button, open animation) is owned by
 * PanelFrame. This file contains only the phase-routing logic and the body.
 *
 * Note: combat is mounted outside the mainPanel/facilityPanel
 * PanelClosingContext.Provider axes in game-screen, so PanelClosingContext
 * stays false here → no exit animation (instant unmount). Deferred: wire a
 * dedicated delayed-unmount for the combat store once full exit-anim polish
 * is scheduled.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { tContent } from '@/i18n/content-localization';
import { PanelFrame } from '@/ui/components/panel-frame';
import { CombatPanelFormation } from '@/ui/panels/combat-panel-formation';
import { CombatPanelBattle } from '@/ui/panels/combat-panel-battle';
import { CombatPanelResult } from '@/ui/panels/combat-panel-result';
import { StoryDialogOverlay } from '@/ui/components/story-dialog-overlay';
import '@/ui/styles/combat-panel.css';

export function CombatPanel() {
  const { t } = useTranslation();
  const isOpen = useCombatPanelStore((s) => s.isOpen);
  const phase = useCombatPanelStore((s) => s.phase);
  const missionId = useCombatPanelStore((s) => s.missionId);
  const dialogLines = useCombatPanelStore((s) => s.dialogLines);
  const confirmStoryDialog = useCombatPanelStore((s) => s.confirmStoryDialog);
  const closeCombatPanel = useCombatPanelStore((s) => s.closeCombatPanel);
  const exitArena = useGameStore((s) => s.exitArena);

  const missionData = MISSIONS.find((m) => m.id === missionId);

  /** Close handler — also unwinds legacy arena-slice state until Phase 7 cleanup */
  const handleClose = useCallback(() => {
    // Guard: if a close is triggered while the post-combat dialog is up, the
    // earned result is still held in the store. Reveal it instead of silently
    // discarding the reward splash the player already won.
    if (useCombatPanelStore.getState().phase === 'story-dialog') {
      confirmStoryDialog();
      return;
    }
    closeCombatPanel();
    exitArena();
  }, [closeCombatPanel, exitArena, confirmStoryDialog]);

  if (!isOpen) return null;

  const isBattlePhase = phase === 'battle';
  const missionName = missionData
    ? tContent('missions', missionData.id, 'name', missionData.name)
    : t('combatPanel.fallbackName');
  const title = missionData?.zone
    ? t('combatPanel.titleWithZone', { name: missionName, zone: missionData.zone })
    : missionName;

  // combat-panel--phase-battle must stay on the body element so combat-scissor.tsx
  // can query it via document.querySelector to compute the scissor rect.
  const bodyClass = 'combat-panel-body' + (isBattlePhase ? ' combat-panel--phase-battle' : '');
  // combat-pf--battle suppresses pf-content's parchment background so the
  // world canvas shows through during the battle sub-phase.
  const pfClass = isBattlePhase ? 'combat-pf combat-pf--battle' : 'combat-pf';
  // Battle phase hardens the positioner scrim to near-opaque: the battle
  // scene's full-frustum background planes extend past the panel rect and
  // bleed through a light scrim.
  const positionerClass =
    'combat-pf-positioner' + (isBattlePhase ? ' combat-pf-positioner--battle' : '');

  return (
    <div className={positionerClass}>
      <PanelFrame
        title={title}
        onClose={handleClose}
        variant="panel"
        className={pfClass}
      >
        <div className={bodyClass}>
          {phase === 'formation' && <CombatPanelFormation />}
          {phase === 'battle' && <CombatPanelBattle />}
          {phase === 'story-dialog' && dialogLines && (
            <StoryDialogOverlay lines={dialogLines} onDone={confirmStoryDialog} />
          )}
          {phase === 'result' && <CombatPanelResult onClose={handleClose} />}
        </div>
      </PanelFrame>
    </div>
  );
}
