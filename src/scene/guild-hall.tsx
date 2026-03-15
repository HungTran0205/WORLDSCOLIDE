import { useGameStore } from '@/game/state/store';
import { ROOM_DEFINITIONS } from '@/game/data/buildings';
import { getRotatedSize, HALL_WIDTH, HALL_DEPTH } from '@/game/systems/building-system';
import { BuildOverlay } from './build-overlay';
import type { Room, RoomType } from '@/game/state/game-state';

const ROOM_COLORS: Record<RoomType, string> = {
  'quest-board': '#DAA520',
  'tavern': '#8B4513',
  'training-room': '#4682B4',
  'workshop': '#708090',
  'infirmary': '#FF6347',
};

function RoomMesh({ room }: { room: Room }) {
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  const activeItem = useGameStore((s) => s.activeItem);
  const startMovingRoom = useGameStore((s) => s.startMovingRoom);

  const def = ROOM_DEFINITIONS.find((r) => r.type === room.type);
  const { w, h } = def
    ? getRotatedSize(def.width, def.depth, room.rotation)
    : { w: 1, h: 1 };

  // Hide this room if it's currently being moved
  if (activeItem?.type === 'existing' && activeItem.roomId === room.id) return null;

  const handleClick = (e: { stopPropagation: () => void }) => {
    // Only pick up rooms when in build mode and nothing else is being placed
    if (isBuildMode && !activeItem) {
      e.stopPropagation();
      startMovingRoom(room.id, room.type, room.position, room.rotation);
    }
  };

  return (
    <mesh
      position={[room.position.x + w / 2, 0.75, room.position.z + h / 2]}
      castShadow
      onClick={handleClick}
    >
      <boxGeometry args={[w, 1.5, h]} />
      <meshStandardMaterial color={ROOM_COLORS[room.type] ?? '#888'} />
    </mesh>
  );
}

/** Guild hall floor + rooms + build overlay */
export function GuildHall() {
  const rooms = useGameStore((s) => s.guildHall.rooms);
  const isBuildMode = useGameStore((s) => s.isBuildMode);

  return (
    <group>
      {/* Base floor aligned to grid origin (0,0) → (HALL_WIDTH, HALL_DEPTH) */}
      <mesh position={[HALL_WIDTH / 2, -0.1, HALL_DEPTH / 2]} receiveShadow>
        <boxGeometry args={[HALL_WIDTH, 0.2, HALL_DEPTH]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>

      {rooms.map((room) => (
        <RoomMesh key={room.id} room={room} />
      ))}

      {isBuildMode && <BuildOverlay />}
    </group>
  );
}
