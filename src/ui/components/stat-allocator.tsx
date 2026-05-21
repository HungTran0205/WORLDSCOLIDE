/**
 * Talent-point allocation grid for char-creation (Identity step).
 * Extracted from char-creation.tsx — same 50-point mechanic (INITIAL_STAT_POINTS),
 * relabeled "Talent Points" for player-facing copy. Pure presentational:
 * parent owns the stats/remaining state and applies deltas via onAllocate.
 */

import { useTranslation } from 'react-i18next';
import { STAT_KEYS } from '@/game/systems/stat-allocation';
import type { Stats, StatKey } from '@/game/state/game-state';

interface StatAllocatorProps {
  stats: Stats;
  remaining: number;
  onAllocate: (stat: StatKey, delta: number) => void;
}

export function StatAllocator({ stats, remaining, onAllocate }: StatAllocatorProps) {
  const { t } = useTranslation();
  return (
    <div className="stat-allocator">
      <div className="stat-allocator-header">
        <span className="stat-allocator-title">{t('statAllocator.title')}</span>
        <span className={`stat-allocator-remaining${remaining > 0 ? ' stat-allocator-remaining--pending' : ''}`}>
          {t('statAllocator.remaining', { count: remaining })}
        </span>
      </div>
      <div className="stat-allocation-grid">
        {STAT_KEYS.map((stat) => (
          <StatRow
            key={stat}
            stat={stat}
            value={stats[stat]}
            canAdd={remaining > 0}
            canAdd5={remaining >= 5}
            onAdd={() => onAllocate(stat, 1)}
            onAdd5={() => onAllocate(stat, 5)}
            onRemove={() => onAllocate(stat, -1)}
          />
        ))}
      </div>
    </div>
  );
}

function StatRow({ stat, value, canAdd, canAdd5, onAdd, onAdd5, onRemove }: {
  stat: StatKey; value: number;
  canAdd: boolean; canAdd5: boolean;
  onAdd: () => void; onAdd5: () => void; onRemove: () => void;
}) {
  return (
    <>
      <span>{stat}</span>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
        <div style={{ width: `${Math.min(100, value)}%`, height: '100%', background: '#ffd700', borderRadius: 3 }} />
      </div>
      <span style={{ textAlign: 'center' }}>{value}</span>
      <div style={{ display: 'flex', gap: 2 }}>
        <button type="button" disabled={value <= 0} onClick={onRemove}>-</button>
        <button type="button" disabled={!canAdd} onClick={onAdd}>+</button>
        <button type="button" disabled={!canAdd5} onClick={onAdd5}>+5</button>
      </div>
    </>
  );
}
