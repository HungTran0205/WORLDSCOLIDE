/**
 * use-delayed-unmount — keeps a panel mounted for an exit-animation grace period
 * after the store value flips to null.
 *
 * WHY host-delayed unmount:
 *   React unmounts a component the moment its conditional render goes false.
 *   By deferring the unmount on the host side, every close path — ✕ button,
 *   Esc key, proximity auto-close, axis mutual-exclusion — produces the same
 *   exit animation and SFX without any change in the individual panels.
 *
 * Returns { rendered, closing }:
 *   `rendered` — the last non-null store value; safe to pass as props during
 *                the grace period even after the store has cleared.
 *   `closing`  — true during the grace period (exit animation should play).
 *
 * Edge cases:
 *   A → B switch (null never appears between): switch immediately, no grace.
 *   Reduced-motion (prefers-reduced-motion: reduce): grace period collapses to 0.
 */

import { createContext, useEffect, useRef, useState } from 'react';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface DelayedUnmountState<T> {
  /** Last non-null value — use this to render the panel. */
  rendered: T | null;
  /** True during the exit-animation grace period. */
  closing: boolean;
}

/**
 * @param value   The nullable store value (e.g. mainPanel, facilityPanel).
 * @param delayMs Exit animation duration in ms. Reduced-motion collapses it to 0.
 */
export function useDelayedUnmount<T>(
  value: T | null,
  delayMs: number,
): DelayedUnmountState<T> {
  const [rendered, setRendered] = useState<T | null>(value);
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (value !== null) {
      // Value appeared or changed to a new non-null — switch immediately,
      // cancel any in-progress close grace (A→B direct switch, no exit anim).
      setRendered(value);
      setClosing(false);
    } else if (rendered !== null) {
      // Value cleared — start exit grace period so the panel can animate out.
      const delay = prefersReducedMotion() ? 0 : delayMs;
      if (delay === 0) {
        setRendered(null);
        setClosing(false);
      } else {
        setClosing(true);
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          setRendered(null);
          setClosing(false);
        }, delay);
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // `rendered` intentionally omitted: react only to external value changes,
    // not to our own state updates, to avoid re-triggering the grace period.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delayMs]);

  return { rendered, closing };
}

/**
 * Context that signals PanelFrame whether the host has entered the exit-animation
 * grace period. PanelFrame consumes this to drive close SFX + animation class
 * without importing the store directly (keeps it presentational).
 * Default false — safe outside a provider (panel renders normally).
 */
export const PanelClosingContext = createContext<boolean>(false);
