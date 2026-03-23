/** Guild hall 3D scene — per-cell floor tiles + furniture meshes (no walls) */

import { useGameStore } from '@/game/state/store';
import { ROOM_DEFINITIONS } from '@/game/data/buildings';
import { BuildOverlay } from './build-overlay';
import { FurnitureModel } from './furniture-model';
import type { Room, RoomType } from '@/game/state/game-state';

/** Room types that open a panel when clicked outside build mode */
const CLICKABLE_ROOM_TYPES: RoomType[] = ['guild-hall', 'tavern'];

function FloorTile({ x, z, color, onClick }: {
  x: number; z: number; color: string; onClick?: (e: { stopPropagation: () => void }) => void;
}) {
  return (
    <mesh position={[x + 0.5, 0, z + 0.5]} onClick={onClick}>
      <boxGeometry args={[0.98, 0.1, 0.98]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}


function RoomFloor({ room, onRoomClick }: {
  room: Room; onRoomClick?: (roomType: RoomType) => void;
}) {
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  const activeItem = useGameStore((s) => s.activeItem);
  const startMovingRoom = useGameStore((s) => s.startMovingRoom);

  const def = ROOM_DEFINITIONS.find((r) => r.type === room.type);
  const color = def?.floorColor ?? '#8B7355';

  // Hide this room's floor if it's being moved
  if (activeItem?.type === 'move-room' && activeItem.roomId === room.id) return null;

  const handleClick = (e: { stopPropagation: () => void }) => {
    if (isBuildMode && !activeItem) {
      e.stopPropagation();
      startMovingRoom(room.id, room.type, room.cells);
    } else if (!isBuildMode && CLICKABLE_ROOM_TYPES.includes(room.type)) {
      e.stopPropagation();
      onRoomClick?.(room.type);
    }
  };

  return (
    <group>
      {room.cells.map((cell) => (
        <FloorTile
          key={`${cell.x},${cell.z}`}
          x={cell.x} z={cell.z}
          color={color}
          onClick={handleClick}
        />
      ))}
      {room.furniture.map((f) => (
        <FurnitureModel key={f.id} furniture={f} />
      ))}
    </group>
  );
}

interface GuildHallProps {
  onRoomClick?: (roomType: RoomType) => void;
}

/** Guild hall floor + rooms + build overlay */
export function GuildHall({ onRoomClick }: GuildHallProps) {
  const rooms = useGameStore((s) => s.guildHall.rooms);
  const isBuildMode = useGameStore((s) => s.isBuildMode);

  return (
    <group>
      {rooms.map((room) => (
        <RoomFloor key={room.id} room={room} onRoomClick={onRoomClick} />
      ))}
      {isBuildMode && <BuildOverlay />}
    </group>
  );
}
