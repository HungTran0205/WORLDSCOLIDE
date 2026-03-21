import { useGameStore } from '@/game/state/store';
import { RankBadge } from '@/ui/components/rank-badge';
import { CivBadge } from '@/ui/components/civ-badge';
import { GameIcon } from '@/ui/components/game-icon';
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
              <RankBadge rank={merc.rank} />
            </strong>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#aaa' }}>
              Lv.{merc.level} | <CivBadge civilization={merc.civilization} />
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: '#aaa', marginBottom: 8, alignItems: 'center' }}>
            {(['STR', 'END', 'INT', 'DEX', 'AGI'] as const).map((stat) => (
              <span key={stat} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                <GameIcon category="stat" id={stat} size={12} fallbackText={stat} />
                {merc.stats[stat]}
              </span>
            ))}
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
