/**
 * Save status badge — shows saving/saved/error in HUD top bar.
 * Hidden when idle. Auto-dismisses "saved" after 2s.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';

export function SaveStatusBadge() {
  const { t } = useTranslation();
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
    return <span className={className}>{t('saveStatus.saving')}</span>;
  }

  if (saveStatus === 'saved') {
    return <span className={className}>{t('saveStatus.saved')}</span>;
  }

  // error state
  return (
    <span
      className={className}
      title={saveError ?? t('saveStatus.failed')}
      onClick={() => setSaveStatus('idle')}
    >
      {t('saveStatus.failed')}
    </span>
  );
}
