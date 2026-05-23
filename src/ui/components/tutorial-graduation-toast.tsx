/**
 * Tutorial graduation toast — beat 14 ('complete').
 *
 * A brief, non-blocking congratulations shown ONCE when the player crosses into
 * the 'complete' step during play (game-screen only mounts it on that transition,
 * not on every load of an already-complete save). Auto-dismisses after a few
 * seconds; the player keeps full control — the Quest Board is already unlocked
 * to every quest (GDD §12.5: free exploration, no forced push).
 */

import { useEffect } from 'react';
import { tContent } from '@/i18n/content-localization';

const AUTO_DISMISS_MS = 6000;

interface TutorialGraduationToastProps {
  onClose: () => void;
}

export function TutorialGraduationToast({ onClose }: TutorialGraduationToastProps) {
  useEffect(() => {
    const id = window.setTimeout(onClose, AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [onClose]);

  const headline = tContent('tutorial', 'graduation-toast', 'headline', "You're ready to lead.");
  const sub      = tContent('tutorial', 'graduation-toast', 'sub',
    'The Quest Board is open — chase any thread that calls to you.');

  return (
    <div
      role="status"
      onClick={onClose}
      style={{
        position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, maxWidth: 460, padding: '14px 22px', cursor: 'pointer',
        background: '#1a1208', border: '2px solid rgba(255,215,0,0.4)', borderRadius: 12,
        color: '#e8d5b0', textAlign: 'center',
        boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
      }}
    >
      <strong style={{ color: '#ffd700' }}>{headline}</strong>
      <div style={{ fontSize: '0.85rem', color: '#c8b080', marginTop: 4 }}>
        {sub}
      </div>
    </div>
  );
}
