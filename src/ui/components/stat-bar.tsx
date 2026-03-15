import type { StatKey } from '@/game/state/game-state';

const STAT_COLORS: Record<StatKey, string> = {
  STR: '#e74c3c',
  END: '#27ae60',
  INT: '#3498db',
  DEX: '#f39c12',
  CHA: '#e91e9c',
  LCK: '#9b59b6',
  AGI: '#1abc9c',
};

interface StatBarProps {
  stat: StatKey;
  value: number;
  max?: number;
}

export function StatBar({ stat, value, max = 100 }: StatBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ width: 32, fontSize: '0.75rem', color: STAT_COLORS[stat] }}>{stat}</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: STAT_COLORS[stat],
            borderRadius: 3,
          }}
        />
      </div>
      <span style={{ width: 28, fontSize: '0.75rem', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
