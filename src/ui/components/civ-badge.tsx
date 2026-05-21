/**
 * Reusable civilization badge — shows emblem icon with optional text label.
 * Falls back to colored text abbreviation if icon fails.
 */

import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { civName } from '@/i18n/content-wrappers';
import { GameIcon } from './game-icon';

interface CivBadgeProps {
  civilization: string;
  size?: 'sm' | 'md';
}

export function CivBadge({ civilization, size = 'sm' }: CivBadgeProps) {
  const config = CIV_CONFIG[civilization as Civilization];
  if (!config) {
    return <span style={{ color: '#666', fontSize: '0.65rem' }}>{civilization.slice(0, 2)}</span>;
  }

  const iconSize = size === 'sm' ? 16 : 20;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <GameIcon
        category="emblem"
        id={civilization}
        size={iconSize}
        fallbackText={config.shortName}
        fallbackColor={config.colors.text}
        alt={civName(civilization as Civilization)}
      />
      {size === 'md' && (
        <span style={{ fontSize: '0.8rem', color: config.colors.text, fontWeight: 'bold' }}>
          {config.shortName}
        </span>
      )}
    </span>
  );
}
