/**
 * Full-screen dim overlay with a passthrough cutout around the target rect.
 *
 * Implementation: 4-panel layout (top / bottom / left / right divs surrounding
 * the cutout rect). This is CRITICAL for correct pointer-event behaviour:
 *
 *   SVG <mask> is visual-only — the masked-out (transparent) region still
 *   receives pointer events from the SVG element. That means with the old
 *   single-SVG approach, clicks inside the "hole" were swallowed by the
 *   overlay and never reached the DOM target or the R3F Canvas beneath it.
 *
 *   4-panel layout leaves the centre rectangle completely empty — no DOM
 *   element covers it — so pointer events fall through naturally to whatever
 *   is underneath (DOM element or the R3F Canvas for world targets like the drum).
 *
 * blockOutside=true  → panels are `pointer-events:auto`, swallowing off-target clicks
 * blockOutside=false → panels are `pointer-events:none` (visual dim only)
 *
 * A purely-visual SVG vignette layer (pointer-events:none) is stacked on top
 * of the 4 panels to round the corners of the cutout for aesthetics.
 *
 * Cutout padding:
 *   PADDING_DOM   — tighter padding for UI element targets
 *   PADDING_WORLD — generously wide for the drum's R3F raycast hitbox
 *   Caller passes `padOverride` to use the larger value when needed.
 */

import type { CSSProperties } from 'react';

const PADDING_DOM   = 12;   // px — tight fit for DOM targets
const PADDING_WORLD = 48;   // px — wide enough for the drum R3F raycast hitbox
const RADIUS        = 10;   // corner radius on the SVG vignette

const DIM = 'rgba(0,0,0,0.55)';
const Z   = 1100;

interface SpotlightProps {
  rect: DOMRect;
  blockOutside: boolean;
  /** Pass true when targetType==='world' to use the wider PADDING_WORLD cutout. */
  worldTarget?: boolean;
}

export function CoachmarkSpotlight({ rect, blockOutside, worldTarget = false }: SpotlightProps) {
  const pad = worldTarget ? PADDING_WORLD : PADDING_DOM;

  // Cutout region boundaries
  const cx = rect.left   - pad;
  const cy = rect.top    - pad;
  const cr = rect.right  + pad;
  const cb = rect.bottom + pad;
  const cw = cr - cx;
  const ch = cb - cy;

  // Pointer events: auto on panels when blockOutside, none when visual-only
  const pe: CSSProperties['pointerEvents'] = blockOutside ? 'auto' : 'none';

  // Shared panel base
  const base: CSSProperties = { position: 'fixed', background: DIM, zIndex: Z, pointerEvents: pe };

  return (
    <>
      {/* ── 4 dim panels surrounding the cutout ──────────────────────────── */}
      {/* Top strip: full width, from top of viewport to top of cutout */}
      <div aria-hidden="true" style={{ ...base, left: 0, right: 0, top: 0, height: cy }} />
      {/* Bottom strip: full width, from bottom of cutout to bottom of viewport */}
      <div aria-hidden="true" style={{ ...base, left: 0, right: 0, top: cb, bottom: 0 }} />
      {/* Left strip: between top and bottom strips, left of cutout */}
      <div aria-hidden="true" style={{ ...base, left: 0, width: cx,       top: cy, height: ch }} />
      {/* Right strip: between top and bottom strips, right of cutout */}
      <div aria-hidden="true" style={{ ...base, left: cr, right: 0,       top: cy, height: ch }} />

      {/* ── Visual-only SVG vignette: rounded corners on the cutout ──────── */}
      {/* pointer-events:none — purely aesthetic, never intercepts clicks */}
      <svg
        aria-hidden="true"
        style={{
          position:      'fixed',
          inset:         0,
          zIndex:        Z + 1,
          pointerEvents: 'none',
          overflow:      'visible',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="coachmark-vignette-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="black" />
            <rect x={cx} y={cy} width={cw} height={ch} rx={RADIUS} ry={RADIUS} fill="white" />
          </mask>
        </defs>
        {/* Subtle inner shadow / soft edge — fills only the band around the cutout */}
        <rect
          x={cx - 6} y={cy - 6}
          width={cw + 12} height={ch + 12}
          rx={RADIUS + 4} ry={RADIUS + 4}
          fill="none"
          stroke="rgba(200,160,80,0.35)"
          strokeWidth="4"
        />
      </svg>
    </>
  );
}
