/**
 * Arrival modal — shown when a party reaches their destination.
 * "Enter Battle" opens the new combat panel overlay (Phase 3 redesign).
 * Parent (active-missions-list) wires onStartCombat to combat-panel-store.
 */

import { useTranslation } from 'react-i18next';
import { ENEMIES } from '@/game/data/enemies';
import '@/ui/styles/panels.css';

interface ArrivalModalProps {
  missionId: string;
  missionName: string;
  zone: string;
  enemyIds: string[];
  onStartCombat: () => void;
  onClose: () => void;
}

export function ArrivalModal({
  missionName,
  zone,
  enemyIds,
  onStartCombat,
  onClose,
}: ArrivalModalProps) {
  const { t } = useTranslation();
  // Deduplicate enemy names with counts
  const enemyCounts = enemyIds.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="confirm-dialog-overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#ffd700', marginBottom: 4 }}>{t('arrivalModal.title')}</h3>
        <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: 12 }}>
          {missionName} — <span style={{ color: '#67b8e3' }}>{zone}</span>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: 6 }}>{t('arrivalModal.enemiesLabel')}</div>
          {Object.entries(enemyCounts).map(([id, count]) => {
            const enemy = ENEMIES[id];
            return (
              <div key={id} style={{ fontSize: '0.85rem', color: '#e0e0e0', padding: '2px 0' }}>
                {count}× {enemy?.name ?? id}
                {enemy && <span style={{ color: '#aaa', fontSize: '0.75rem' }}> (Lv.{enemy.level})</span>}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="panel-btn"
            style={{ flex: 1 }}
            onClick={() => { onStartCombat(); onClose(); }}
          >
            {t('arrivalModal.enterBattle')}
          </button>
        </div>
      </div>
    </div>
  );
}
