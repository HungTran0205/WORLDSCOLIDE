/**
 * 7×7 facility room — floor, walls, name label, optional forest decor for logging-site.
 * Point light activates when camera navigates into this room.
 */

import { useMemo } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FACILITY_DEFINITIONS, LOGGING_SITE_CONFIG } from '@/game/data/facility-definitions';
import { FACILITY_SLOTS } from '@/game/data/facility-slot-positions';
import { useGameStore } from '@/game/state/store';
import { RoomMemberSprites } from './room-member-sprites';
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
  'logging-site': '#3d6b2a',
  'stone-quarry': '#2a2a2a',
};

/** Per-facility point light config — color + intensity when room is active */
const ROOM_LIGHT: Record<FacilityType, { color: string; intensity: number }> = {
  tavern: { color: '#ffaa44', intensity: 6 },
  'training-yard': { color: '#ff6633', intensity: 5 },
  infirmary: { color: '#88aaff', intensity: 6 },
  workshop: { color: '#ffcc44', intensity: 5 },
  'logging-site': { color: '#fff5cc', intensity: 18 },
  'stone-quarry': { color: '#aaaacc', intensity: 5 },
};

// Preload forest room GLBs
[
  '/arena/forest/3dprops/p_tree_large.glb',
  '/arena/forest/3dprops/p_tree_pine.glb',
  '/arena/forest/3dprops/p_stump.glb',
  '/arena/forest/3dprops/p_log_fallen.glb',
  '/arena/forest/3dprops/p_bush.glb',
].forEach((p) => useGLTF.preload(p));

/** Single GLB model scaled to a target height, placed at world-space position */
function ForestProp({ path, position, targetHeight, rotY = 0 }: {
  path: string;
  position: [number, number, number];
  targetHeight: number;
  rotY?: number;
}) {
  const { scene } = useGLTF(path);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const h = box.getSize(new THREE.Vector3()).y;
    const s = h > 0 ? targetHeight / h : 1;
    clone.scale.setScalar(s);
    clone.position.y = -box.min.y * s;
    return clone;
  }, [scene, targetHeight]);

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <primitive object={model} />
    </group>
  );
}

/** Forest tree decor scattered around the 7×7 logging-site room edges */
function ForestRoomDecor({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      {/* Back cluster */}
      <ForestProp path="/arena/forest/3dprops/p_tree_large.glb" position={[cx - 2.2, 0, cz - 2.5]} targetHeight={4.2} rotY={0.3} />
      <ForestProp path="/arena/forest/3dprops/p_tree_pine.glb"  position={[cx + 1.8, 0, cz - 2.8]} targetHeight={3.8} rotY={-0.5} />
      <ForestProp path="/arena/forest/3dprops/p_tree_pine.glb"  position={[cx - 0.2, 0, cz - 3.0]} targetHeight={3.0} rotY={0.9} />
      {/* Side clusters */}
      <ForestProp path="/arena/forest/3dprops/p_tree_pine.glb"  position={[cx - 2.8, 0, cz + 0.5]} targetHeight={3.5} rotY={1.2} />
      <ForestProp path="/arena/forest/3dprops/p_tree_pine.glb"  position={[cx - 2.6, 0, cz - 1.2]} targetHeight={2.6} rotY={0.6} />
      <ForestProp path="/arena/forest/3dprops/p_tree_pine.glb"  position={[cx + 2.7, 0, cz - 1.5]} targetHeight={2.8} rotY={-1.0} />
      {/* Floor props */}
      <ForestProp path="/arena/forest/3dprops/p_stump.glb"      position={[cx + 1.0, 0, cz - 0.4]} targetHeight={0.6} rotY={0.8} />
      <ForestProp path="/arena/forest/3dprops/p_log_fallen.glb" position={[cx + 0.8, 0, cz + 2.0]} targetHeight={0.5} rotY={0.6} />
    </group>
  );
}

/** Compact floating card — pinned to top-back of room so characters in center stay visible */
function LoggingSiteZoneCard({ facility }: { facility: GuildFacility }) {
  const reserve = facility.woodReserve ?? 0;
  const max = LOGGING_SITE_CONFIG.woodReserve;
  const pct = reserve / max;
  const isDepleted = reserve === 0;

  const barColor = isDepleted ? '#6b7280'
    : pct <= LOGGING_SITE_CONFIG.warningCriticalPct ? '#ef4444'
    : pct <= LOGGING_SITE_CONFIG.warningLowPct ? '#f59e0b'
    : '#4ade80';

  return (
    <div style={{
      background: 'rgba(0,0,0,0.85)',
      border: '1px solid rgba(255,215,0,0.3)',
      borderRadius: 8,
      padding: '8px 12px',
      minWidth: 180,
      fontSize: 12,
      color: '#e0e0e0',
    }}>
      <div style={{ fontWeight: 'bold', color: '#ffd700', marginBottom: 6 }}>
        Logging Site {isDepleted && <span style={{ color: '#6b7280', fontSize: 10 }}>DEPLETED</span>}
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(pct * 100).toFixed(1)}%`, background: barColor, borderRadius: 3 }} />
      </div>
      <div style={{ color: '#aaa', fontSize: 11 }}>
        {Math.floor(reserve)}/{max} wood {isDepleted ? '— tap to remove' : ''}
      </div>
    </div>
  );
}

interface FacilityRoomProps {
  facility: GuildFacility;
}

/** Single 7×7 facility room; point light turns on when camera is inside */
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
  const isLoggingSite = facility.type === 'logging-site';

  return (
    <group>
      {/* Room point light — only on when camera is here */}
      {isActive && (
        <pointLight
          position={[cx, isLoggingSite ? 8 : 2.5, cz]}
          color={light.color}
          intensity={light.intensity}
          distance={isLoggingSite ? 20 : 10}
          decay={isLoggingSite ? 1 : 2}
        />
      )}

      {/* Floor */}
      <mesh position={[cx, 0.01, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>

      {/* Back wall */}
      <mesh position={[cx, WALL_HEIGHT / 2, oz]}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={isLoggingSite ? '#5a4a2a' : '#3d2b1f'} roughness={0.8} />
      </mesh>

      {/* Left wall */}
      <mesh position={[ox, WALL_HEIGHT / 2, cz]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE]} />
        <meshStandardMaterial color={isLoggingSite ? '#5a4a2a' : '#3d2b1f'} roughness={0.8} />
      </mesh>

      {/* Forest props — only for logging-site */}
      {isLoggingSite && <ForestRoomDecor cx={cx} cz={cz} />}

      {/* Assigned members patrolling the room */}
      {facility.assignedMemberIds.length > 0 && (
        <RoomMemberSprites
          assignedMemberIds={facility.assignedMemberIds}
          roomCx={cx}
          roomCz={cz}
        />
      )}

      {/* Info label — logging-site card: top-back shifted left; other rooms centered */}
      {isActive && isLoggingSite && facility.woodReserve != null ? (
        <Html position={[cx - 6.5, 1, oz + 0.8]} center>
          <LoggingSiteZoneCard facility={facility} />
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
