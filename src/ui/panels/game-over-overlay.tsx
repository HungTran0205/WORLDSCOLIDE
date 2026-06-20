/**
 * Game over overlay — displayed when all guild members are injured simultaneously.
 * Shows wipe status and offers return to title or wait for recovery.
 */

import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { resolveInjuryQueue } from '@/game/systems/infirmary-recovery';
import '@/ui/styles/panels.css';

interface GameOverOverlayProps {
  onReturnToTitle: () => void;
}

export function GameOverOverlay({ onReturnToTitle }: GameOverOverlayProps) {
  const { t } = useTranslation();
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const facilities = useGameStore((s) => s.facilities);
  const allMembers = founder ? [founder, ...roster] : roster;

  // Recovery is progress-driven now (injuredUntil is no longer the timer). Derive per-member
  // remaining real-ms from the shared queue resolver — this re-derives each tick as progress
  // accrues, so the countdown stays live. No infirmary card is reachable from the wipe screen,
  // so this is the only surface showing recovery ETA on a full wipe.
  const { rows } = resolveInjuryQueue(allMembers, facilities);
  const remainingMsById = new Map(rows.map((r) => [r.member.id, r.remainingMs]));
  const earliestRemainingMs = rows.reduce(
    (min, r) => Math.min(min, r.remainingMs),
    Number.POSITIVE_INFINITY,
  );
  const recoveryInSecs = rows.length > 0 ? Math.ceil(earliestRemainingMs / 1000) : 0;

  return (
    <div className="confirm-dialog-overlay" style={{ zIndex: 9999 }}>
      <div className="confirm-dialog" style={{ textAlign: 'center', maxWidth: 360 }}>
        <h2 style={{ color: '#e74c3c', marginBottom: 8, fontSize: '1.6rem' }}>{t('gameOver.title')}</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: 16 }}>
          {t('gameOver.body')}
        </p>

        <div style={{ marginBottom: 16 }}>
          {allMembers.map((m) => {
            const remainingMs = remainingMsById.get(m.id);
            return (
              <div key={m.id} style={{ fontSize: '0.85rem', color: '#e74c3c', padding: '2px 0' }}>
                {m.name} — {t('gameOver.injured')}
                {remainingMs !== undefined && (
                  <span style={{ color: '#aaa', fontSize: '0.75rem' }}>
                    {' '}({Math.ceil(remainingMs / 1000)}s)
                  </span>
                )}
              </div>
            );
          })}
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
