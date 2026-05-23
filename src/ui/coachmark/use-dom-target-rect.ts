/**
 * Hook that tracks the bounding rect of a DOM element identified by a CSS selector.
 *
 * Uses a requestAnimationFrame loop for live tracking (handles scroll, resize,
 * layout shifts). Also listens to resize + scroll events for immediate response.
 * Returns null when selector is null, inactive, or element not found.
 */

import { useState, useEffect, useRef } from 'react';

/**
 * @param selector - CSS selector string (e.g. '.drum-brazier', '#quest-board-btn')
 *                   or null to disable tracking
 * @param active   - when false, stops the raf loop and returns null immediately
 * @returns DOMRect of the matched element, or null if not found / inactive
 */
export function useDomTargetRect(
  selector: string | null,
  active: boolean,
): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);
  const lastRectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (!active || !selector) {
      setRect(null);
      lastRectRef.current = null;
      return;
    }

    function readRect() {
      const el = document.querySelector(selector!);
      const next = el ? el.getBoundingClientRect() : null;

      // Only update state if rect actually changed (avoids re-render churn)
      const prev = lastRectRef.current;
      const changed =
        next === null
          ? prev !== null
          : prev === null ||
            prev.x !== next.x ||
            prev.y !== next.y ||
            prev.width !== next.width ||
            prev.height !== next.height;

      if (changed) {
        lastRectRef.current = next;
        setRect(next);
      }
    }

    function loop() {
      readRect();
      rafRef.current = requestAnimationFrame(loop);
    }

    // Immediate read + kick off raf loop
    rafRef.current = requestAnimationFrame(loop);

    // Respond to layout events immediately in addition to raf
    window.addEventListener('resize', readRect);
    window.addEventListener('scroll', readRect, { capture: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', readRect);
      window.removeEventListener('scroll', readRect, { capture: true });
      setRect(null);
      lastRectRef.current = null;
    };
  }, [selector, active]);

  return rect;
}
