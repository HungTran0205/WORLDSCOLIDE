import '@/ui/styles/grade-badge.css';
import type { Grade } from '@/game/data/grades';
import { GRADE_META } from '@/game/data/grades';

interface GradeBadgeProps {
  grade: Grade;
  isMercenary?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function GradeBadge({ grade, isMercenary = false, size = 'sm' }: GradeBadgeProps) {
  const meta = GRADE_META[grade];
  return (
    <span
      className={`grade-badge grade-badge--${grade.toLowerCase()} grade-badge--${size}`}
      style={{ '--grade-color': meta.color } as React.CSSProperties}
    >
      {meta.label}
      {isMercenary && <span className="grade-badge__merc-tag">MERC</span>}
    </span>
  );
}
