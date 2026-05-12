/**
 * 7×7 facility room — floor, walls, name label, per-facility decor.
 * Point light activates when camera navigates into this room.
 */

import { Html } from '@react-three/drei';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { FACILITY_SLOTS } from '@/game/data/facility-slot-positions';
import { useGameStore } from '@/game/state/store';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { RoomMemberSprites } from './room-member-sprites';
import { ForestRoomDecor } from '../logging-site/logging-site-furniture';
import { LoggingSiteZoneCard } from '../logging-site/facility-room-forest-decor';
import { FacilityRoomFurniture } from './facility-room-furniture';
import { QuarryRoomDecor } from '../quarry/quarry-furniture';
import { QuarryZoneCard } from '../quarry/facility-room-quarry-decor';
import { AlchemyZoneCard } from '../alchemy/facility-room-alchemy-decor';
import { AlchemyWalls } from '../alchemy/facility-room-alchemy-walls';
import { TiledFloor, type TileTextureSpec } from '@/scene/sprites/tiled-floor';
import type { GuildFacility, FacilityType } from '@/game/state/game-state';

const ROOM_SIZE = 7;
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.2;

/**
 * 2D tile texture per facility (Phase 03/04/05 — Standard Tile Floor System).
 * Each biome ships 4-5 curated variants (see docs/code-standards.md → Biome
 * palette). Logging-site uses weighted main+variants for natural grass with
 * detail accents. Workshop uses stone-64 (vs quarry's cave) for visual
 * differentiation.
 */
const FACILITY_TILE_PATH: Record<FacilityType, TileTextureSpec> = {
  tavern: '/tiles/2d/32px/paving-stone-32_0001.png',
  'training-yard': '/tiles/2d/32px/paving-stone-32_0002.png',
  infirmary: '/tiles/2d/32px/paving-stone-32_0003.png',
  'logging-site': {
    main: '/tiles/2d/32px/forest-grass-32_0003.png',
    variants: [
      '/tiles/2d/32px/forest-grass-32_0001.png',
      '/tiles/2d/32px/forest-grass-32_0002.png',
      '/tiles/2d/32px/forest-grass-32_0004.png',
      '/tiles/2d/32px/forest-grass-32_0005.png',
    ],
  },
  'stone-quarry': '/tiles/2d/32px/cave_0001.png',
  'alchemy-lab': {
    main: '/tiles/2d/64px/wood-guild-floor_0005.png',
    variants: [
      '/tiles/2d/64px/wood-guild-floor_0004.png'
    ],
    variantChance: 0.05,
  },
  workshop: '/tiles/2d/64px/stone-64_0001.png',
};

/**
 * Per-facility tileWorldSize override (default 1). Larger value = bigger
 * tile cell in world units = fewer repetitions = larger pixel-art elements.
 * Alchemy uses 2 to match the wooden plank scale of the guild hall floor.
 */
const FACILITY_TILE_WORLD_SIZE: Partial<Record<FacilityType, number>> = {
  'alchemy-lab': 2,
};

/**
 * Per-facility emissiveIntensity override (Phase 07 — Floor Atmospheric
 * Lighting). Lower value = floor reacts more to scene lights. Tuning:
 * - Alchemy: many torches/spotlights → 0.55 (warm pool reads strongly)
 * - Standard rooms (tavern, training, infirmary, workshop): default 0.7
 * - Outdoor/cave (logging-site, stone-quarry): default 0.7
 *   (single bright pointLight + ambient — lower would tint too aggressively)
 */
const FACILITY_EMISSIVE_INTENSITY: Partial<Record<FacilityType, number>> = {
  'alchemy-lab': 0.55,
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
  // Hide all <Html> zone/info cards when combat panel is open — drei <Html>
  // portals DOM nodes outside R3F so the world.tsx visibility wrapper does
  // not hide them. See vfx-particles-integration-guide.md for why we use
  // visibility instead of conditional render on the guild-hall side.
  const isCombatOpen = useCombatPanelStore((s) => s.isOpen);

  // placedSlot is guaranteed non-null (FacilityRoomsLayer filters before rendering)
  const [cx, , cz] = FACILITY_SLOTS[facility.placedSlot!];
  const ox = cx - ROOM_SIZE / 2;
  const oz = cz - ROOM_SIZE / 2;

  // Light active when camera target is within this room's 7×7 footprint
  // (target may be offset from exact center for per-facility viewport adjustments)
  const isActive = Math.abs(cameraTarget[0] - cx) <= 3.5 && Math.abs(cameraTarget[2] - cz) <= 3.5;

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

      {/* Floor — every facility uses a 2D tile floor via FACILITY_TILE_PATH
          (Phase 03/04/05 of the Standard Tile Floor System). Walls and decor
          remain per-facility. */}
      <TiledFloor
        width={ROOM_SIZE}
        depth={ROOM_SIZE}
        tileTexture={FACILITY_TILE_PATH[facility.type]}
        tileWorldSize={FACILITY_TILE_WORLD_SIZE[facility.type] ?? 1}
        position={[cx, 0.01, cz]}
        emissiveIntensity={FACILITY_EMISSIVE_INTENSITY[facility.type] ?? 0.7}
      />

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
      {!isCombatOpen && (
        isActive && cameraSettled && isLoggingSite && facility.woodReserve != null ? (
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
        )
      )}
    </group>
  );
}
