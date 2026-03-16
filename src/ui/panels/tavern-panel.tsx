import { useGameStore } from '@/game/state/store';
import '@/ui/styles/panels.css';

interface TavernPanelProps {
  onClose: () => void;
}

export function TavernPanel({ onClose }: TavernPanelProps) {
  const tavern = useGameStore((s) => s.tavern);
  const hireMercenary = useGameStore((s) => s.hireMercenary);

  const nextRefreshMs = Math.max(
    0,
    tavern.lastRefreshTime + 4 * 60 * 60 * 1000 - Date.now(),
  );
  const nextRefreshHrs = (nextRefreshMs / (60 * 60 * 1000)).toFixed(1);

  return (
    <div className="panel-overlay">
      <h2>
        Tavern
        <button className="panel-close-btn" onClick={onClose}>Close</button>
      </h2>
      <p style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: 12 }}>
        {tavern.availableMercenaries.length > 0
          ? `${tavern.availableMercenaries.length} mercenaries available`
          : 'No mercenaries available'}
        {' — '}Next refresh in {nextRefreshHrs}h
      </p>

      {tavern.availableMercenaries.map((merc) => (
        <div key={merc.id} className="panel-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <strong>
              {merc.name}
              <span style={{ fontSize: '0.7rem', color: '#f0a500', marginLeft: 6, border: '1px solid #f0a500', padding: '1px 4px', borderRadius: 3 }}>
                MERC
              </span>
            </strong>
            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Lv.{merc.level} | {merc.civilization}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: 8 }}>
            STR {merc.stats.STR} | END {merc.stats.END} | INT {merc.stats.INT} | DEX {merc.stats.DEX} | AGI {merc.stats.AGI}
          </div>
          <button
            className="panel-btn"
            onClick={() => hireMercenary(merc.id)}
          >
            Hire
          </button>
        </div>
      ))}

      {tavern.availableMercenaries.length === 0 && (
        <p style={{ color: '#888', marginTop: 16 }}>
          Come back later — mercenaries refresh every 4 hours.
        </p>
      )}
    </div>
  );
}
