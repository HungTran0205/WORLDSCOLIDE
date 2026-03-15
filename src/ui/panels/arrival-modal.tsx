/**
 * Arrival modal — shown when a party reaches their destination.
 * Player chooses Manual or Auto combat within 30s before auto-combat triggers.
 */

import { useState, useEffect } from 'react';
import { ENEMIES } from '@/game/data/enemies';
import '@/ui/styles/panels.css';

interface ArrivalModalProps {
  missionId: string;
  missionName: string;
  zone: string;
  enemyIds: string[];
  arrivalTime: number;
  timeoutMs: number;
  onChooseManual: () => void;
  onChooseAuto: () => void;
  onClose: () => void;
}

export function ArrivalModal({
  missionName,
  zone,
  enemyIds,
  arrivalTime,
  timeoutMs,
  onChooseManual,
  onChooseAuto,
  onClose,
}: ArrivalModalProps) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((arrivalTime + timeoutMs - Date.now()) / 1000)),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const secs = Math.max(0, Math.ceil((arrivalTime + timeoutMs - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(timer);
        onChooseAuto(); // onChooseAuto calls handleCombatChoice which calls closeArrival/onClose
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [arrivalTime, timeoutMs, onChooseAuto, onClose]);

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

        <div style={{ textAlign: 'center', color: '#f39c12', fontSize: '0.85rem', marginBottom: 12 }}>
          Auto-combat in <strong>{remaining}s</strong>
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
