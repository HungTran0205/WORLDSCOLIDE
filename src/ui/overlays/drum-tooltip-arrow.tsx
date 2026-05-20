/**
 * Drum tooltip arrow — thin wrapper over TutorialCoachmark.
 *
 * Refactored from a fixed viewport-relative hint to a world-projected coachmark
 * that tracks the drum's 3D position ([5,1.2,3.5]) each frame via the Canvas
 * projector → coachmark-target-store bridge.
 *
 * Gating is preserved:
 *   - hidden once questBoardTutorialSeen flips true
 *   - hidden whenever any panel is open (activePanel !== null)
 *
 * aria-hidden kept — purely visual cue; keyboard/screen-reader users have the
 * HUD "Quests" button and Q shortcut.
 */

import { useUiStore } from '@/game/state/ui-store';
import { useGameStore } from '@/game/state/store';
import type { PanelId } from '@/ui/hud/panel-toggle';
import { TutorialCoachmark } from '@/ui/coachmark/tutorial-coachmark';

// World-space position of the drum's tip — group at [5,0,3.5], coach target 1.2u up
const DRUM_WORLD_TARGET: [number, number, number] = [5, 1.2, 3.5];

interface DrumTooltipArrowProps {
  activePanel: PanelId;
}

export function DrumTooltipArrow({ activePanel }: DrumTooltipArrowProps) {
  const seen = useUiStore((s) => s.questBoardTutorialSeen);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  // Only at the drum beat (or, post-tutorial, as a one-time first-visit nudge). Scoping
  // to the step keeps it off during 'arrival-alarm', where the NPC alarm owns the single
  // shared world-target slot (see coachmark-target-store invariant).
  const active =
    !seen &&
    activePanel === null &&
    (tutorialStep === 'open-quest-board' || tutorialStep === 'complete');

  return (
    <div aria-hidden="true">
      <TutorialCoachmark
        active={active}
        targetType="world"
        target={DRUM_WORLD_TARGET}
        caption="Beat the drum to view quests"
        arrow
        pulse
      />
    </div>
  );
}
