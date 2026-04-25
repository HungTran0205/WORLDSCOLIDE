/**
 * Arrival modal — shown when a party reaches their destination.
 * Player chooses Manual or Auto combat (no timeout).
 */

import { ENEMIES } from '@/game/data/enemies';
import '@/ui/styles/panels.css';

interface ArrivalModalProps {
  missionId: string;
  missionName: string;
  zone: string;
  enemyIds: string[];
  onChooseManual: () => void;
  onChooseAuto: () => void;
  onClose: () => void;
}

export function ArrivalModal({
  missionName,
  zone,
  enemyIds,
  onChooseManual,
  onChooseAuto,
  onClose,
}: ArrivalModalProps) {
  // Deduplicate enemy names with counts
  const enemyCounts = enemyIds.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="confirm-dialog-overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#ffd700', marginBottom: 4 }}>⚔️ Party Arrived!</h3>
        <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: 12 }}>
          {missionName} — <span style={{ color: '#67b8e3' }}>{zone}</span>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: 6 }}>Enemies encountered:</div>
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
            onClick={() => { onChooseManual(); onClose(); }}
          >
            ⚔️ Manual
          </button>
          <button
            className="panel-btn"
            style={{ flex: 1 }}
            onClick={() => { onChooseAuto(); onClose(); }}
          >
            🤖 Auto
          </button>
        </div>
      </div>
    </div>
  );
}
