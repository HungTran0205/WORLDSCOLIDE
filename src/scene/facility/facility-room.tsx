/**
 * 7×7 facility room — floor, walls, name label, per-facility decor.
 * Point light activates when camera navigates into this room.
 */

import { Html } from '@react-three/drei';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { FACILITY_SLOTS } from '@/game/data/facility-slot-positions';
import { useGameStore } from '@/game/state/store';
import { RoomMemberSprites } from './room-member-sprites';
import { ForestRoomDecor } from '../logging-site/logging-site-furniture';
import { LoggingSiteZoneCard } from '../logging-site/facility-room-forest-decor';
import { FacilityRoomFurniture } from './facility-room-furniture';
import { QuarryRoomDecor } from '../quarry/quarry-furniture';
import { QuarryZoneCard } from '../quarry/facility-room-quarry-decor';
import { AlchemyZoneCard } from '../alchemy/facility-room-alchemy-decor';
import { AlchemyWalls } from '../alchemy/facility-room-alchemy-walls';
import type { GuildFacility, FacilityType } from '@/game/state/game-state';

const ROOM_SIZE = 7;
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.2;

const ROOM_FLOOR_COLORS: Record<FacilityType, string> = {
  tavern: '#2a1f10',
  'training-yard': '#1a1010',
  infirmary: '#0f1520',
  workshop: '#1a1508',
  'logging-site': '#3d6b2a',
  'stone-quarry': '#2a2a2a',
  'alchemy-lab': '#1a0f2a',
};

const ROOM_WALL_COLORS: Record<FacilityType, string> = {
  tavern: '#4a2e12',
  'training-yard': '#2a1a1a',
  infirmary: '#1a2030',
  workshop: '#1e1a0a',
  'logging-site': '#5a4a2a',
  'stone-quarry': '#252525',
  'alchemy-lab': '#2a1a3a',
};

/** Per-facility point light config — color + intensity when room is active */
const ROOM_LIGHT: Record<FacilityType, { color: string; intensity: number }> = {
  tavern: { color: '#ffaa44', intensity: 6 },
  'training-yard': { color: '#ff6633', intensity: 5 },
  infirmary: { color: '#88aaff', intensity: 6 },
  workshop: { color: '#ffcc44', intensity: 5 },
  'logging-site': { color: '#fff5cc', intensity: 18 },
  'stone-quarry': { color: '#aaaacc', intensity: 5 },
  'alchemy-lab': { color: '#ffcc44', intensity: 5 },
};

interface FacilityRoomProps {
  facility: GuildFacility;
}

/** Single 7×7 facility room; point light turns on when camera is inside */
export function FacilityRoom({ facility }: FacilityRoomProps) {
  const def = FACILITY_DEFINITIONS[facility.type];
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const cameraSettled = useGameStore((s) => s.cameraSettled);

  // placedSlot is guaranteed non-null (FacilityRoomsLayer filters before rendering)
  const [cx, , cz] = FACILITY_SLOTS[facility.placedSlot!];
  const ox = cx - ROOM_SIZE / 2;
  const oz = cz - ROOM_SIZE / 2;

  // Light active when camera target is within this room's 7×7 footprint
  // (target may be offset from exact center for per-facility viewport adjustments)
  const isActive = Math.abs(cameraTarget[0] - cx) <= 3.5 && Math.abs(cameraTarget[2] - cz) <= 3.5;

  const floorColor = ROOM_FLOOR_COLORS[facility.type];
  const wallColor = ROOM_WALL_COLORS[facility.type];
  const light = ROOM_LIGHT[facility.type];
  const isLoggingSite = facility.type === 'logging-site';
  const isQuarry = facility.type === 'stone-quarry';
  const isAlchemy = facility.type === 'alchemy-lab';
  const isWorkshop = facility.type === 'workshop';

  return (
    <group>
      {/* Room point light — always mounted, intensity toggled to prevent shader recompilation lag */}
      {!isAlchemy && (
        <pointLight
          position={[cx, isLoggingSite ? 8 : 2.5, cz]}
          color={light.color}
          intensity={isActive ? light.intensity : 0}
          distance={isLoggingSite ? 20 : 10}
          decay={isLoggingSite ? 1 : 2}
        />
      )}
      {/* Stone quarry ambient fill */}
      {isQuarry && (
        <ambientLight color="#9999bb" intensity={isActive ? 0.6 : 0} />
      )}
      {/* Workshop ambient fill */}
      {isWorkshop && (
        <ambientLight color="#ffffff" intensity={isActive ? 2 : 0} />
      )}
      {/* Alchemy-lab point lights */}
      {isAlchemy && (
        <>
          <pointLight position={[cx + 0.3, 1.2, cz + 0.5]} color="#ffa060" intensity={isActive ? 5 : 0} distance={9} decay={1} />
        </>
      )}

      {/* Floor — alchemy-lab and workshop use custom GLB floors */}
      {!isAlchemy && !isWorkshop && (
        <mesh position={[cx, 0.01, cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
          <meshStandardMaterial color={floorColor} roughness={0.9} />
        </mesh>
      )}

      {/* Walls — alchemy-lab uses GLB models; all others use procedural geometry */}
      {isAlchemy ? (
        <AlchemyWalls cx={cx} cz={cz} />
      ) : (
        <>
          <mesh position={[cx, WALL_HEIGHT / 2, oz]}>
            <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <meshStandardMaterial color={wallColor} roughness={0.8} />
          </mesh>
          <mesh position={[ox, WALL_HEIGHT / 2, cz]}>
            <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE]} />
            <meshStandardMaterial color={wallColor} roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Per-facility decor / furniture */}
      {isLoggingSite && <ForestRoomDecor cx={cx} cz={cz} />}
      {isQuarry && <QuarryRoomDecor cx={cx} cz={cz} />}
      {!isLoggingSite && !isQuarry && <FacilityRoomFurniture type={facility.type} cx={cx} cz={cz} />}

      {/* Assigned members patrolling the room */}
      {facility.assignedMemberIds.length > 0 && (
        <RoomMemberSprites
          assignedMemberIds={facility.assignedMemberIds}
          roomCx={cx}
          roomCz={cz}
          facilityType={facility.type}
        />
      )}

      {/* Info label — zone cards only render after camera has settled to avoid mid-lerp misplacement */}
      {isActive && cameraSettled && isLoggingSite && facility.woodReserve != null ? (
        <Html position={[cx - 6.5, 1, oz + 0.8]} center>
          <LoggingSiteZoneCard facility={facility} />
        </Html>
      ) : isActive && cameraSettled && isQuarry ? (
        <Html position={[cx - 6.5, 1, cz + 0.5]} center>
          <QuarryZoneCard facility={facility} />
        </Html>
      ) : isActive && cameraSettled && isAlchemy ? (
        <Html position={[cx - 5.0, 1, cz + 0.5]} center>
          <AlchemyZoneCard facility={facility} />
        </Html>
      ) : (
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
      )}
    </group>
  );
}
