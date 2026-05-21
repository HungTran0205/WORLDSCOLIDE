/**
 * Game over overlay — displayed when all guild members are injured simultaneously.
 * Shows wipe status and offers return to title or wait for recovery.
 */

import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import '@/ui/styles/panels.css';

interface GameOverOverlayProps {
  onReturnToTitle: () => void;
}

export function GameOverOverlay({ onReturnToTitle }: GameOverOverlayProps) {
  const { t } = useTranslation();
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const allMembers = founder ? [founder, ...roster] : roster;

  // Find earliest recovery time
  const earliestRecovery = allMembers.reduce((earliest, m) => {
    if (m.injuredUntil && (earliest === null || m.injuredUntil < earliest)) return m.injuredUntil;
    return earliest;
  }, null as number | null);

  const recoveryInSecs = earliestRecovery
    ? Math.max(0, Math.ceil((earliestRecovery - Date.now()) / 1000))
    : 0;

  return (
    <div className="confirm-dialog-overlay" style={{ zIndex: 9999 }}>
      <div className="confirm-dialog" style={{ textAlign: 'center', maxWidth: 360 }}>
        <h2 style={{ color: '#e74c3c', marginBottom: 8, fontSize: '1.6rem' }}>{t('gameOver.title')}</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: 16 }}>
          {t('gameOver.body')}
        </p>

        <div style={{ marginBottom: 16 }}>
          {allMembers.map((m) => (
            <div key={m.id} style={{ fontSize: '0.85rem', color: '#e74c3c', padding: '2px 0' }}>
              {m.name} — {t('gameOver.injured')}
              {m.injuredUntil && (
                <span style={{ color: '#aaa', fontSize: '0.75rem' }}>
                  {' '}({Math.max(0, Math.ceil((m.injuredUntil - Date.now()) / 1000))}s)
                </span>
              )}
            </div>
          ))}
        </div>

        {recoveryInSecs > 0 && (
          <p style={{ color: '#f39c12', fontSize: '0.85rem', marginBottom: 16 }}>
            {t('gameOver.recoveryIn', { secs: recoveryInSecs })}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="panel-btn" onClick={onReturnToTitle}>
            {t('gameOver.returnToTitle')}
          </button>
        </div>
      </div>
    </div>
  );
}
