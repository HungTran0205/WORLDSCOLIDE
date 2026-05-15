/**
 * Drum tooltip arrow — DOM overlay nudging the player to click the drum
 * on first visit. Hides itself once the tutorial flag flips or any panel is
 * already open. Position is a viewport-relative approximation — good enough
 * for the diegetic hint without needing world→screen projection.
 */

import { useUiStore } from '@/game/state/ui-store';
import type { PanelId } from '@/ui/hud/panel-toggle';
import './drum-tooltip-arrow.css';

interface DrumTooltipArrowProps {
  activePanel: PanelId;
}

export function DrumTooltipArrow({ activePanel }: DrumTooltipArrowProps) {
  const seen = useUiStore((s) => s.questBoardTutorialSeen);
  if (seen || activePanel !== null) return null;

  // Purely visual cue — keyboard / screen-reader users have the HUD "Quests"
  // button and the Q shortcut. Marking aria-hidden avoids noisy re-announces
  // on every panel close.
  return (
    <div className="drum-tooltip-arrow" aria-hidden="true">
      <span className="drum-tooltip-arrow__arrow">↓</span>
      <span className="drum-tooltip-arrow__text">Click the brazier to view quests</span>
    </div>
  );
}
