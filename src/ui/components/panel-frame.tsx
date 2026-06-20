/**
 * PanelFrame — reusable bronze × parchment panel shell.
 *
 * Presentational only: owns no open/close state. The parent (ui-store panel
 * slice) owns visibility state and passes onClose.
 *
 * Exit animation contract (host-driven):
 *   The host (game-screen) pipes its store value through useDelayedUnmount and
 *   wraps the panel render in PanelClosingContext.Provider. When closing flips
 *   true, PanelFrame plays close SFX once and applies the pf-close animation.
 *   This means every close path — ✕ button, Esc, proximity, mutual-exclusion —
 *   animates identically without any per-panel wiring.
 *   Reduced-motion: the host unmounts immediately (delay 0), so neither the
 *   exit animation nor the close SFX fires on that path.
 */

import React, { useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { playSFX } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
import { PanelClosingContext } from './use-delayed-unmount';
import './panel-frame.css';

export type PanelVariant = 'panel' | 'modal' | 'side';
export type PanelSize = 'sm' | 'md' | 'lg' | 'full';

interface PanelFrameProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  variant?: PanelVariant;
  size?: PanelSize;
  className?: string;
  /** Suppress the visible close button (quest-board diegetic case).
   *  onClose remains wired — click-outside / Esc paths still call it. */
  hideClose?: boolean;
  /** Override open SFX key (default: AUDIO.SFX_CLICK). */
  sfxOpen?: string;
  /** Override close SFX key (default: AUDIO.SFX_DISPATCH). */
  sfxClose?: string;
}

/**
 * Map variant → z-index CSS variable. Using the token string avoids duplicating
 * the numeric values already defined in ui-tokens-v2.css §10.
 */
const VARIANT_Z: Record<PanelVariant, string> = {
  panel: 'var(--bp-z-panel)',
  side:  'var(--bp-z-panel-elevated)',
  modal: 'var(--bp-z-modal)',
};

export function PanelFrame({
  title,
  onClose,
  children,
  variant = 'panel',
  size,
  className,
  hideClose = false,
  sfxOpen,
  sfxClose,
}: PanelFrameProps) {
  const { t } = useTranslation();
  const closing = useContext(PanelClosingContext);
  const rootRef = useRef<HTMLDivElement>(null);
  const sfxFiredRef = useRef(false);

  // Play open SFX on mount.
  useEffect(() => {
    playSFX(sfxOpen ?? AUDIO.SFX_CLICK);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Play close SFX exactly once when the host signals closing. The context flag
  // drives both the animation class (via data-state) and the SFX — every close
  // path (✕, Esc, proximity, axis-switch) triggers this identically.
  useEffect(() => {
    if (closing && !sfxFiredRef.current) {
      sfxFiredRef.current = true;
      playSFX(sfxClose ?? AUDIO.SFX_DISPATCH);
    }
    if (!closing) {
      sfxFiredRef.current = false;
    }
  }, [closing, sfxClose]);

  // Size → max-width mapping. ONLY applied when the size prop is explicitly
  // given: an inline default would override every panel's own CSS dimensions
  // (inline style always beats stylesheets — combat's 1536px rule was once
  // silently clamped to 560px this way).
  const sizeStyle: React.CSSProperties = size === 'sm'   ? { maxWidth: 320 }
                                        : size === 'md'   ? { maxWidth: 560 }
                                        : size === 'lg'   ? { maxWidth: 860 }
                                        : size === 'full' ? { maxWidth: '100%' }
                                        :                   {}; // no prop → parent CSS owns size

  return (
    <div
      ref={rootRef}
      className={['pf-root', className].filter(Boolean).join(' ')}
      data-state={closing ? 'closing' : 'open'}
      data-variant={variant}
      style={{ zIndex: VARIANT_Z[variant], ...sizeStyle }}
      role={variant === 'modal' ? 'dialog' : 'region'}
      aria-label={title}
      aria-modal={variant === 'modal' ? true : undefined}
    >
      {/* Absolute chrome overlay — renders rivets + border on top of content */}
      <div className="pf-frame" aria-hidden="true" />

      {/* Header band — SOLID --bp-header-fill, high contrast per bible §5 */}
      <header className="pf-header">
        <h2 className="pf-title">{title}</h2>
        {!hideClose && (
          <button
            className="pf-close"
            onClick={onClose}
            aria-label={t('panelFrame.closePanel')}
            type="button"
          >
            ✕
          </button>
        )}
      </header>

      {/* Parchment content field */}
      <div className="pf-content">
        {children}
      </div>
    </div>
  );
}
