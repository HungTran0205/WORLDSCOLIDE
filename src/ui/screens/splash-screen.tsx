/**
 * Splash screen — renders immediately on app mount.
 * Shows "2000s A.C" logo + loading dots while title assets preload.
 * Auto-advances to title when (elapsed ≥ minDurationMs) AND (assets ready).
 * Pure CSS — no R3F — so first paint stays <100ms.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TitleScreenLogo } from './title-screen-logo';
import { useTitlePreloader } from '@/ui/hooks/use-title-preloader';
import '@/ui/styles/title-screen.css';

interface SplashScreenProps {
  onReady: () => void;
  minDurationMs?: number;
}

const FADE_OUT_MS = 500;

export function SplashScreen({ onReady, minDurationMs = 2000 }: SplashScreenProps) {
  const { t } = useTranslation();
  const { ready, progress } = useTitlePreloader();
  const [minElapsed, setMinElapsed] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  // TEMP debug
  console.log('[Splash] render ready=', ready, 'progress=', progress, 'minElapsed=', minElapsed, 'fadingOut=', fadingOut);

  // Minimum display duration so splash never flashes <2s even on cached loads.
  useEffect(() => {
    const t = setTimeout(() => {
      console.log('[Splash] minDuration elapsed');
      setMinElapsed(true);
    }, minDurationMs);
    return () => clearTimeout(t);
  }, [minDurationMs]);

  // Trigger fade-out once both gates pass. Split from the onReady scheduler
  // below so the cleanup of fadingOut transitions never cancels onReady's timer.
  useEffect(() => {
    if (!ready || !minElapsed || fadingOut) return;
    console.log('[Splash] advancing — both gates pass');
    setFadingOut(true);
  }, [ready, minElapsed, fadingOut]);

  // Schedule onReady once fade-out begins. fadingOut only flips false→true once
  // (no toggle back), so this effect runs exactly once and the timer fires.
  useEffect(() => {
    if (!fadingOut) return;
    const t = setTimeout(onReady, FADE_OUT_MS);
    return () => clearTimeout(t);
  }, [fadingOut, onReady]);

  return (
    <div className={`splash-screen ${fadingOut ? 'splash-screen--fade-out' : ''}`}>
      <TitleScreenLogo size="splash" animate />
      <div className="splash-loading" aria-label={t('splashScreen.loadingAria')}>
        <span className="splash-loading__dot" />
        <span className="splash-loading__dot" />
        <span className="splash-loading__dot" />
      </div>
    </div>
  );
}
