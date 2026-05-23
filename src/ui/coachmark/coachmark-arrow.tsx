/**
 * Bouncing arrow pointing at the target rect, with caption text.
 *
 * Placement logic:
 *   - Default: arrow renders ABOVE the rect, pointing down (↓)
 *   - Flips to BELOW (pointing up ↑) when the rect top is within 120px of
 *     viewport top — avoids clipping near the top edge.
 *
 * The bobbing animation is driven by the CSS class .coachmark-arrow-bob
 * defined in tutorial-coachmark.css.
 *
 * The pulse ring reuses the existing .tutorialPulse keyframe from hud.css
 * (already loaded globally) — no duplication.
 */

import type { CSSProperties } from 'react';
import './tutorial-coachmark.css';

const ARROW_OFFSET = 8;   // gap between arrow tip and cutout edge
const EDGE_THRESHOLD = 120; // px from top before we flip to below

interface ArrowProps {
  rect: DOMRect;
  caption: string;
}

export function CoachmarkArrow({ rect, caption }: ArrowProps) {
  const flipToBelow = rect.top < EDGE_THRESHOLD;

  // Position arrow horizontally centred on target, vertically above or below
  const centerX = rect.left + rect.width / 2;

  const containerStyle: CSSProperties = {
    position:        'fixed',
    left:            centerX,
    top:             flipToBelow
                       ? rect.bottom + ARROW_OFFSET
                       : rect.top - ARROW_OFFSET,
    transform:       flipToBelow
                       ? 'translateX(-50%)'
                       : 'translateX(-50%) translateY(-100%)',
    zIndex:          1102,
    pointerEvents:   'none',
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    gap:             4,
  };

  // When flipped below, caption is on top and arrow is on bottom
  const arrowChar = flipToBelow ? '↑' : '↓';

  return (
    <div style={containerStyle} aria-hidden="true">
      {flipToBelow ? (
        <>
          <span className="coachmark-caption">{caption}</span>
          {/* tutorialPulse intentionally omitted: box-shadow on inline span is invisible.
              Pulse ring is rendered separately in tutorial-coachmark.tsx via .coachmark-pulse-ring */}
          <span className="coachmark-arrow-glyph coachmark-arrow-bob">
            {arrowChar}
          </span>
        </>
      ) : (
        <>
          <span className="coachmark-arrow-glyph coachmark-arrow-bob">
            {arrowChar}
          </span>
          <span className="coachmark-caption">{caption}</span>
        </>
      )}
    </div>
  );
}
