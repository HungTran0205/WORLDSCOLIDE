/** Popup shown on login when facilities produced resources while the player was away. */

import type { FacilityProductionResult } from '@/game/systems/facility-production-system';
import '@/ui/styles/panels.css';

interface OfflineFacilityPopupProps {
  results: FacilityProductionResult[];
  elapsedHours: number;
  onDismiss: () => void;
}

const FACILITY_ICONS: Record<string, string> = {
  tavern: '🍺',
  'training-yard': '🏋',
  infirmary: '⚕️',
  workshop: '🔨',
};

export function OfflineFacilityPopup({ results, elapsedHours, onDismiss }: OfflineFacilityPopupProps) {
  // Only show facilities with actual production
  const activeResults = results.filter((r) =>
    Object.keys(r.expGains).length > 0 ||
    Object.keys(r.itemGains).length > 0 ||
    r.upkeepSaved > 0,
  );

  if (activeResults.length === 0) return null;

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog" style={{ maxWidth: 420, textAlign: 'left' }}>
        <h3 style={{ color: '#ffd700', margin: '0 0 4px', fontSize: '1rem' }}>
          Facilities produced while away
        </h3>
        <p style={{ color: '#aaa', fontSize: '0.8rem', margin: '0 0 16px' }}>
          Offline {elapsedHours.toFixed(1)} hours
        </p>

        {activeResults.map((r) => (
          <div key={r.facilityType} style={{ marginBottom: 12 }}>
            <div style={{ color: '#87ceeb', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 4 }}>
              {FACILITY_ICONS[r.facilityType] ?? '🏛'} {r.facilityName}
            </div>

            {/* EXP gains (Training Yard) */}
            {Object.entries(r.expGains).map(([memberId, exp]) => (
              <div key={memberId} style={{ fontSize: '0.8rem', color: '#ccc', paddingLeft: 16 }}>
                • Member +{exp} EXP
              </div>
            ))}

            {/* Item gains (Workshop) */}
            {Object.entries(r.itemGains).map(([itemId, qty]) => (
              <div key={itemId} style={{ fontSize: '0.8rem', color: '#ccc', paddingLeft: 16 }}>
                • +{qty} {itemId.replace('_', ' ')}
              </div>
            ))}

            {/* Upkeep saved (Tavern) */}
            {r.upkeepSaved > 0 && (
              <div style={{ fontSize: '0.8rem', color: '#2ecc71', paddingLeft: 16 }}>
                • Upkeep saved: {r.upkeepSaved}g
              </div>
            )}
          </div>
        ))}

        <button className="panel-btn" onClick={onDismiss} style={{ marginTop: 8 }}>
          Collect
        </button>
      </div>
    </div>
  );
}
