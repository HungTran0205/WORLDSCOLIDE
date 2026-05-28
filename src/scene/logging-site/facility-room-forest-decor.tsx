/**
 * Status card for the logging-site facility room.
 * Shows wood reserve with depletion warning.
 */

import { LOGGING_SITE_CONFIG } from '@/game/data/facility-definitions';
import type { GuildFacility } from '@/game/state/game-state';
import { useGameStore } from '@/game/state/store';

/** Compact floating card — pinned to top-back of room so characters stay visible */
export function LoggingSiteZoneCard({ facility }: { facility: GuildFacility }) {
  const removeFacility = useGameStore((s) => s.removeFacility);
  const reserve = facility.woodReserve ?? 0;
  const max = LOGGING_SITE_CONFIG.woodReserve;
  const pct = reserve / max;
  const isDepleted = reserve === 0;

  const barColor = isDepleted ? '#6b7280'
    : pct <= LOGGING_SITE_CONFIG.warningCriticalPct ? '#ef4444'
    : pct <= LOGGING_SITE_CONFIG.warningLowPct ? '#f59e0b'
    : '#4ade80';

  return (
    <div style={{
      background: 'rgba(0,0,0,0.85)',
      border: '1px solid rgba(255,215,0,0.3)',
      borderRadius: 8,
      padding: '8px 12px',
      minWidth: 180,
      fontSize: 12,
      color: '#e0e0e0',
    }}>
      <div style={{ fontWeight: 'bold', color: '#ffd700', marginBottom: 6 }}>
        Logging Site {isDepleted && <span style={{ color: '#6b7280', fontSize: 10 }}>DEPLETED</span>}
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(pct * 100).toFixed(1)}%`, background: barColor, borderRadius: 3 }} />
      </div>
      <div
        style={{ color: isDepleted ? '#ef4444' : '#aaa', fontSize: 11, cursor: isDepleted ? 'pointer' : 'default' }}
        onClick={isDepleted ? () => removeFacility(facility.id) : undefined}
      >
        {Math.floor(reserve)}/{max} wood {isDepleted ? '— tap to remove' : ''}
      </div>
    </div>
  );
}
