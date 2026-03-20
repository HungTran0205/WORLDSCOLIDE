/**
 * Reusable civilization badge — shows short name on colored background.
 */

import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';

interface CivBadgeProps {
  civilization: string;
  size?: 'sm' | 'md';
}

export function CivBadge({ civilization, size = 'sm' }: CivBadgeProps) {
  const config = CIV_CONFIG[civilization as Civilization];
  if (!config) {
    return <span style={{ color: '#666', fontSize: '0.65rem' }}>{civilization.slice(0, 2)}</span>;
  }

  const px = size === 'sm' ? '0.65rem' : '0.8rem';
  return (
    <span style={{
      background: config.colors.secondary,
      color: config.colors.text,
      padding: '1px 4px',
      borderRadius: 3,
      fontSize: px,
      fontWeight: 'bold',
    }}>
      {config.shortName}
    </span>
  );
}
