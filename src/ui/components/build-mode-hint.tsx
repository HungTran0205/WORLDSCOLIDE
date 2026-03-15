import { useGameStore } from '@/game/state/store';
import { ROOM_DEFINITIONS } from '@/game/data/buildings';

/** Small overlay showing build mode controls */
export function BuildModeHint() {
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  const activeBuildType = useGameStore((s) => s.activeBuildType);
  const buildRotation = useGameStore((s) => s.buildRotation);
  const activeItem = useGameStore((s) => s.activeItem);

  if (!isBuildMode) return null;

  const isMoving = activeItem?.type === 'existing';
  const def = activeBuildType ? ROOM_DEFINITIONS.find((r) => r.type === activeBuildType) : null;
  const name = def?.name ?? activeBuildType;

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
      {activeBuildType ? (
        <>
          <strong>{isMoving ? 'Moving' : 'Placing'}: {name}</strong> ({buildRotation}&deg;)
          <br />
          <span style={{ color: '#aaa' }}>
            Click to {isMoving ? 'drop' : 'place'} &bull; R to rotate &bull; Esc / Right-click to cancel
          </span>
        </>
      ) : (
        <>
          <strong>Build Mode</strong>
          <br />
          <span style={{ color: '#aaa' }}>Click a room to move it &bull; Open Build menu for new rooms</span>
        </>
      )}
    </div>
  );
}
