/** Small overlay showing build mode controls — 3 modes: new-room, new-furniture, move-room */

import { useGameStore } from '@/game/state/store';
import { ROOM_DEFINITIONS } from '@/game/data/buildings';
import { FURNITURE_DEFINITIONS } from '@/game/data/furniture';

export function BuildModeHint() {
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  const activeItem = useGameStore((s) => s.activeItem);

  if (!isBuildMode) return null;

  let title = 'Build Mode';
  let controls = 'Click a room to move it \u2022 Open Build menu for new rooms';

  if (activeItem?.type === 'new-room') {
    const def = ROOM_DEFINITIONS.find((r) => r.type === activeItem.roomType);
    title = `Placing: ${def?.name ?? activeItem.roomType}`;
    controls = `Click to place \u2022 R to rotate \u2022 Esc / Right-click to cancel`;
  } else if (activeItem?.type === 'move-room') {
    const def = ROOM_DEFINITIONS.find((r) => r.type === activeItem.roomType);
    title = `Moving: ${def?.name ?? activeItem.roomType}`;
    controls = `Click to drop \u2022 Esc / Right-click to cancel`;
  } else if (activeItem?.type === 'new-furniture') {
    const def = FURNITURE_DEFINITIONS.find((f) => f.type === activeItem.furnitureType);
    title = `Placing: ${def?.name ?? activeItem.furnitureType}`;
    controls = `Click to place \u2022 R to rotate \u2022 Esc / Right-click to cancel`;
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
