/**
 * Reusable icon component — renders pixel-art icons with graceful text fallback.
 * Uses convention-based path resolution from icon-paths.ts.
 */

import { useState, useCallback } from 'react';
import { getIconPath, type IconCategory } from '@/ui/utils/icon-paths';

interface GameIconProps {
  category: IconCategory;
  id: string;
  size?: number;
  fallbackText?: string;
  fallbackColor?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export function GameIcon({
  category, id, size = 24,
  fallbackText, fallbackColor = '#666',
  alt, style,
}: GameIconProps) {
  const [failed, setFailed] = useState(false);
  const src = getIconPath(category, id);
  const handleError = useCallback(() => setFailed(true), []);

  // Icon failed to load — show text fallback or hide entirely
  if (failed) {
    if (!fallbackText) return null;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, fontSize: size * 0.45,
        color: fallbackColor, fontWeight: 'bold', ...style,
      }}>
        {fallbackText}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? id}
      width={size}
      height={size}
      onError={handleError}
      style={{ objectFit: 'contain', imageRendering: 'pixelated', ...style }}
    />
  );
}
