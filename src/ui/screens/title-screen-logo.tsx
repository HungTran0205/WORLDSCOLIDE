/**
 * "2000s A.C" wordmark — split-collision design.
 *
 * Left half "2000s"  = industrial mono (Share Tech Mono) → Republic Empire era,
 *                      the dying steampunk world.
 * Divider          = vertical bronze line broken by an Đông Sơn drum-sun
 *                    medallion → the literal "collision point".
 * Right half "A.C" = Cinzel serif uppercase → Linh Sơn / post-collapse ritual
 *                    civilisation.
 * Tagline (splash) = "AFTER THE COLLAPSE" in tracking-wide small caps.
 *
 * Monochrome gold (#d4af37) — themable via `currentColor` on the SVG divider.
 * Reusable across splash (large) and title menu (smaller, no tagline).
 */

/**
 * size variants:
 *   'splash' — full-screen splash, largest type, includes tagline
 *   'brand'  — standalone top-center of title screen, mid-size, includes tagline
 *   'menu'   — inline panel header (legacy), no tagline, smallest
 */
interface TitleScreenLogoProps {
  size?: 'splash' | 'brand' | 'menu';
  animate?: boolean;
}

/** 8-ray sun emblem (Đông Sơn drum face) inside a vertical bronze divider.
 *  Rays are tiny ticks around the inner disc — keeps the icon legible even
 *  at the menu-size 1.5em SVG height. */
function LogoDivider() {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg
      className="ts-logo__divider"
      viewBox="0 0 24 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      {/* Top vertical line */}
      <line x1="12" y1="2" x2="12" y2="38" strokeWidth="1.4" strokeLinecap="round" />
      {/* Outer ring of drum medallion */}
      <circle cx="12" cy="50" r="9" strokeWidth="1.2" />
      {/* Inner solid disc — the sun core */}
      <circle cx="12" cy="50" r="3.2" fill="currentColor" stroke="none" />
      {/* 8 sun rays */}
      {rays.map((deg) => (
        <line
          key={deg}
          x1="12"
          y1="41"
          x2="12"
          y2="43.5"
          strokeWidth="1.3"
          strokeLinecap="round"
          transform={`rotate(${deg} 12 50)`}
        />
      ))}
      {/* Bottom vertical line */}
      <line x1="12" y1="62" x2="12" y2="98" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function TitleScreenLogo({ size = 'splash', animate = true }: TitleScreenLogoProps) {
  const classes = [
    'ts-logo',
    `ts-logo--${size}`,
    animate ? 'ts-logo--animate' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="heading" aria-level={1}>
      <div className="ts-logo__wordmark">
        <span className="ts-logo__year">2000s</span>
        <LogoDivider />
        <span className="ts-logo__suffix">A.C</span>
      </div>
      {(size === 'splash' || size === 'brand') && (
        <span className="ts-logo__tagline" aria-hidden="true">
          After the Collapse
        </span>
      )}
    </div>
  );
}
