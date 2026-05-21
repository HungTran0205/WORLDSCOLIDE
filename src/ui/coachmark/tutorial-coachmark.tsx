/**
 * TutorialCoachmark — orchestrator for the coachmark guidance overlay.
 *
 * Resolves the target rect from either:
 *   - 'world': reads projected screen coords from coachmark-target-store
 *     (written by <CoachmarkWorldProjector> inside the Canvas each frame),
 *     synthesises a small DOMRect around that point.
 *   - 'dom': uses useDomTargetRect() raf loop on the given CSS selector.
 *
 * Composes <CoachmarkSpotlight>, <CoachmarkArrow>, and a pulse ring based on
 * the CoachConfig flags. Hidden gracefully when rect is unavailable or the
 * world target is behind the camera.
 *
 * onAdvance is exposed for Phase 06 wiring — default no-op here.
 */

import { useEffect } from 'react';
import type { CoachConfig } from './coachmark-config';
import { useCoachmarkTargetStore } from './coachmark-target-store';
import { useDomTargetRect } from './use-dom-target-rect';
import { CoachmarkSpotlight } from './coachmark-spotlight';
import { CoachmarkArrow } from './coachmark-arrow';
import './tutorial-coachmark.css';

// Synthesised rect half-size for a projected world point (px).
// Kept small — CoachmarkSpotlight applies PADDING_WORLD on top for the actual cutout.
const WORLD_POINT_HALF = 20;

interface TutorialCoachmarkProps extends CoachConfig {
  active: boolean;
  /** Called by Phase 06 state machine when the advanceOn event fires. No-op here. */
  onAdvance?: () => void;
}

export function TutorialCoachmark({
  active,
  targetType,
  target,
  caption,
  spotlight = false,
  arrow = true,
  pulse = false,
  blockOutside = false,
  // advanceOn consumed by Phase 06 — not used here
}: TutorialCoachmarkProps) {

  // ── World target: register / clear in coachmark-target-store ─────────────
  const setWorldTarget = useCoachmarkTargetStore((s) => s.setWorldTarget);
  const screen = useCoachmarkTargetStore((s) => s.screen);

  useEffect(() => {
    if (!active || targetType !== 'world') return;
    const pos = target as [number, number, number];
    setWorldTarget(pos);
    return () => setWorldTarget(null);
  }, [active, targetType, target, setWorldTarget]);

  // ── DOM target: track selector rect via raf loop ──────────────────────────
  const domSelector = targetType === 'dom' ? (target as string) : null;
  const domRect = useDomTargetRect(domSelector, active && targetType === 'dom');

  // ── Resolve final DOMRect ─────────────────────────────────────────────────
  let rect: DOMRect | null = null;

  if (!active) {
    // Nothing to render
  } else if (targetType === 'world') {
    if (screen && screen.visible) {
      // Synthesise a small square rect centred on the projected screen point.
      // CoachmarkSpotlight will apply PADDING_WORLD around this for the actual
      // cutout, ensuring the drum's R3F raycast hitbox is fully unobstructed.
      rect = new DOMRect(
        screen.x - WORLD_POINT_HALF,
        screen.y - WORLD_POINT_HALF,
        WORLD_POINT_HALF * 2,
        WORLD_POINT_HALF * 2,
      );
    }
  } else {
    rect = domRect;
  }

  // Hide when no valid rect (target off-screen, element not found, etc.)
  if (!rect) return null;

  const isWorld = targetType === 'world';

  return (
    <>
      {spotlight && (
        // worldTarget=true → uses PADDING_WORLD (48px) so the 4-panel cutout
        // leaves ample room for the R3F Canvas drum raycast to register
        <CoachmarkSpotlight rect={rect} blockOutside={blockOutside} worldTarget={isWorld} />
      )}

      {arrow && (
        <CoachmarkArrow rect={rect} caption={caption} />
      )}

      {/* Pulse ring — rendered when pulse is on, regardless of arrow flag.
          Arrow glyph does NOT carry tutorialPulse (box-shadow invisible on inline span). */}
      {pulse && (
        <div
          aria-hidden="true"
          className="coachmark-pulse-ring tutorialPulse"
          style={{
            left: rect.left + rect.width  / 2,
            top:  rect.top  + rect.height / 2,
          }}
        />
      )}
    </>
  );
}
