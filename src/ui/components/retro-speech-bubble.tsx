/**
 * RetroSpeechBubble — reusable retro JRPG speech bubble with typewriter reveal.
 *
 * UX (GDD §1 anti-dead-zone, §12.1):
 *   - text crawls in char-by-char (~charsPerSec)
 *   - 1st click/Space = reveal full text instantly (skip crawl)
 *   - 2nd click/Space (once fully revealed) = onComplete
 *   - blinking ▼ caret once fully revealed
 *   - prefers-reduced-motion = render full text immediately
 *
 * Anchoring:
 *   - { worldPos } reuses Phase 01's world→screen bridge (coachmark-target-store +
 *     <CoachmarkWorldProjector> in the Canvas). Falls back to fixed-bottom when the
 *     point is off-screen / not yet projected. NOTE: shares the single worldTarget
 *     slot with TutorialCoachmark — safe because alarm and coachmark steps never run
 *     simultaneously (see coachmark-target-store invariant).
 *   - { fixed: 'bottom' } renders a bottom-centre dialogue box (no projection).
 */

import { useEffect, useRef, useState } from 'react';
import { useCoachmarkTargetStore } from '@/ui/coachmark/coachmark-target-store';
import { playSFX } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
import './retro-speech-bubble.css';

type Anchor = { worldPos: [number, number, number] } | { fixed: 'bottom' };

interface RetroSpeechBubbleProps {
  text: string;
  speaker?: string;
  portraitSrc?: string;
  anchor: Anchor;
  charsPerSec?: number;
  /** Soft blip every few chars while crawling (reuses SFX_CLICK). Default off. */
  sfxPerChar?: boolean;
  onComplete: () => void;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function RetroSpeechBubble({
  text,
  speaker,
  portraitSrc,
  anchor,
  charsPerSec = 40,
  sfxPerChar = false,
  onComplete,
}: RetroSpeechBubbleProps) {
  const isWorld = 'worldPos' in anchor;
  const setWorldTarget = useCoachmarkTargetStore((s) => s.setWorldTarget);
  const screen = useCoachmarkTargetStore((s) => s.screen);

  const reduced = prefersReducedMotion();
  const [revealed, setRevealed] = useState(reduced ? text.length : 0);
  const done = revealed >= text.length;

  // ── World anchor: register / clear the projection target ───────────────────
  useEffect(() => {
    if (!isWorld) return;
    setWorldTarget((anchor as { worldPos: [number, number, number] }).worldPos);
    return () => setWorldTarget(null);
  }, [isWorld, anchor, setWorldTarget]);

  // ── Typewriter crawl (rAF accumulator; cleans up on unmount) ───────────────
  useEffect(() => {
    if (reduced || revealed >= text.length) return;
    let raf = 0;
    let last = performance.now();
    let count = revealed;
    const tick = (now: number) => {
      count += ((now - last) / 1000) * charsPerSec;
      last = now;
      const next = Math.min(text.length, Math.floor(count));
      if (next !== revealed) {
        if (sfxPerChar && next % 3 === 0) playSFX(AUDIO.SFX_CLICK);
        setRevealed(next);
      }
      if (next < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, revealed, text.length, charsPerSec, sfxPerChar]);

  // ── Advance: 1st interaction reveals all, 2nd completes ────────────────────
  // firedRef guards onComplete to fire at most once (a rapid double click/Enter
  // after the text is revealed must not advance the step twice).
  const firedRef = useRef(false);
  const advance = useRef(() => {});
  advance.current = () => {
    if (!done) {
      setRevealed(text.length);
    } else if (!firedRef.current) {
      firedRef.current = true;
      onComplete();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Fixed-bottom when explicitly requested OR world point not yet projectable.
  const useFixed = !isWorld || !screen || !screen.visible;
  const positionStyle: React.CSSProperties = useFixed
    ? {}
    : { left: screen!.x, top: screen!.y };

  return (
    <div className="retro-bubble-overlay" onClick={() => advance.current()}>
      <div
        className={`retro-bubble ${useFixed ? 'retro-bubble--fixed' : 'retro-bubble--world'}`}
        style={positionStyle}
        role="dialog"
        aria-live="polite"
      >
        {portraitSrc && <img className="retro-bubble__portrait" src={portraitSrc} alt="" />}
        {speaker && <span className="retro-bubble__speaker">{speaker}</span>}
        <span className="retro-bubble__text">
          {text.slice(0, revealed)}
          {done && <span className="retro-bubble__caret">▼</span>}
        </span>
        {!useFixed && <span className="retro-bubble__tail" aria-hidden="true" />}
      </div>
    </div>
  );
}
