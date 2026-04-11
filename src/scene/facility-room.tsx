/**
 * Placeholder 7×7 facility room — floor, walls, name label.
 * Point light activates when camera navigates into this room.
 */

import { Html } from '@react-three/drei';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { FACILITY_SLOTS } from '@/game/data/facility-slot-positions';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility } from '@/game/state/game-state';
import type { FacilityType } from '@/game/state/game-state';

const ROOM_SIZE = 7;
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.2;

const ROOM_FLOOR_COLORS: Record<FacilityType, string> = {
  tavern: '#2a1f10',
  'training-yard': '#1a1010',
  infirmary: '#0f1520',
  workshop: '#1a1508',
  'logging-site': '#1a1608',
  'stone-quarry': '#2a2a2a',
};

/** Per-facility point light config — color + intensity when room is active */
const ROOM_LIGHT: Record<FacilityType, { color: string; intensity: number }> = {
  tavern: { color: '#ffaa44', intensity: 6 },
  'training-yard': { color: '#ff6633', intensity: 5 },
  infirmary: { color: '#88aaff', intensity: 6 },
  workshop: { color: '#ffcc44', intensity: 5 },
  'logging-site': { color: '#c5c5c5', intensity: 5 },
  'stone-quarry': { color: '#aaaacc', intensity: 5 },
};

interface FacilityRoomProps {
  facility: GuildFacility;
}

/** Single 7×7 placeholder room; point light turns on when camera is inside */
export function FacilityRoom({ facility }: FacilityRoomProps) {
  const def = FACILITY_DEFINITIONS[facility.type];
  const cameraTarget = useGameStore((s) => s.cameraTarget);

  // placedSlot is guaranteed non-null (FacilityRoomsLayer filters before rendering)
  const [cx, , cz] = FACILITY_SLOTS[facility.placedSlot!];
  const ox = cx - ROOM_SIZE / 2;
  const oz = cz - ROOM_SIZE / 2;

  // Light active when camera target matches this room's center
  const isActive = cameraTarget[0] === cx && cameraTarget[2] === cz;

  const floorColor = ROOM_FLOOR_COLORS[facility.type];
  const light = ROOM_LIGHT[facility.type];

  return (
    <group>
      {/* Room point light — only on when camera is here */}
      {isActive && (
        <pointLight
          position={[cx, 2.5, cz]}
          color={light.color}
          intensity={light.intensity}
          distance={10}
          decay={2}
        />
      )}

      {/* Floor */}
      <mesh position={[cx, 0.01, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>

      {/* Back wall (z = oz) — facing camera from behind, like guild hall */}
      <mesh position={[cx, WALL_HEIGHT / 2, oz]}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.8} />
      </mesh>

      {/* Left wall (x = ox) — side wall visible in isometric view */}
      <mesh position={[ox, WALL_HEIGHT / 2, cz]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.8} />
      </mesh>

      {/* Placeholder label */}
      <Html position={[cx, 1.8, cz]} center>
        <div style={{
          color: '#ffd700',
          background: 'rgba(0,0,0,0.75)',
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          border: '1px solid rgba(255,215,0,0.3)',
        }}>
          {def.name}
          {facility.level > 0 ? ` — Lv.${facility.level}` : ' (Locked)'}
        </div>
      </Html>
    </group>
  );
}
