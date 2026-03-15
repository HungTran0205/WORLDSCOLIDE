/**
 * Progress bar for active missions — shows fill percentage based on elapsed time.
 */

interface MissionProgressBarProps {
  startTime: number;
  endTime: number;
  now: number;
}

export function MissionProgressBar({ startTime, endTime, now }: MissionProgressBarProps) {
  const total = endTime - startTime;
  const elapsed = Math.min(now - startTime, total);
  const pct = total > 0 ? Math.floor((elapsed / total) * 100) : 0;

  return (
    <div className="mission-progress-bar">
      <div className="mission-progress-bar__fill" style={{ width: `${pct}%` }} />
      <span className="mission-progress-bar__label">{pct}%</span>
    </div>
  );
}
