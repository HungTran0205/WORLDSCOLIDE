/**
 * Save status badge — shows saving/saved/error in HUD top bar.
 * Hidden when idle. Auto-dismisses "saved" after 2s.
 */

import { useEffect } from 'react';
import { useGameStore } from '@/game/state/store';

export function SaveStatusBadge() {
  const saveStatus = useGameStore((s) => s.saveStatus);
  const saveError = useGameStore((s) => s.saveError);
  const setSaveStatus = useGameStore((s) => s.setSaveStatus);

  // Auto-dismiss "saved" after 2s
  useEffect(() => {
    if (saveStatus !== 'saved') return;
    const timer = setTimeout(() => setSaveStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [saveStatus, setSaveStatus]);

  if (saveStatus === 'idle') return null;

  const className = `save-badge save-badge--${saveStatus}`;

  if (saveStatus === 'saving') {
    return <span className={className}>Saving...</span>;
  }

  if (saveStatus === 'saved') {
    return <span className={className}>Saved</span>;
  }

  // error state
  return (
    <span
      className={className}
      title={saveError ?? 'Save failed'}
      onClick={() => setSaveStatus('idle')}
    >
      Save failed
    </span>
  );
}
