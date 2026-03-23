/** Small overlay showing build mode controls — 3 modes: floor-tile, erase-tile, furniture */

import { useGameStore } from '@/game/state/store';
import { FURNITURE_DEFINITIONS } from '@/game/data/furniture';

export function BuildModeHint() {
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  const activeItem = useGameStore((s) => s.activeItem);

  if (!isBuildMode) return null;

  let title = 'Build Mode';
  let controls = 'Open Build menu to paint floors or place furniture';

  if (activeItem?.type === 'floor-tile') {
    title = 'Painting Floor';
    controls = 'Click to paint \u2022 Esc to stop';
  } else if (activeItem?.type === 'erase-tile') {
    title = 'Erasing Floor';
    controls = 'Click to erase \u2022 Esc to stop';
  } else if (activeItem?.type === 'furniture') {
    const def = FURNITURE_DEFINITIONS.find((f) => f.type === activeItem.furnitureType);
    title = `Placing: ${def?.name ?? activeItem.furnitureType}`;
    controls = 'Click to place \u2022 R to rotate \u2022 Esc / Right-click to cancel';
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.8)',
      color: '#fff',
      padding: '8px 16px',
      borderRadius: 8,
      fontSize: '0.85rem',
      pointerEvents: 'none',
      zIndex: 100,
      textAlign: 'center',
    }}>
      <strong>{title}</strong>
      <br />
      <span style={{ color: '#aaa' }}>{controls}</span>
    </div>
  );
}
