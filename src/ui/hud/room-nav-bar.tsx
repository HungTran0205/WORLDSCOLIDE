/**
 * RoomNavBar — icon buttons for quick camera travel between rooms.
 * Sits above the panel-toggle bar in the HUD.
 * Only shows built facilities (level > 0) plus Guild Hall.
 */

import { useGameStore } from '@/game/state/store';
import { GUILD_HALL_CAMERA_TARGET } from '@/game/state/camera-slice';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { FACILITY_SLOTS, FACILITY_CAMERA_OFFSETS } from '@/game/data/facility-slot-positions';
import type { FacilityType } from '@/game/state/game-state';

interface RoomEntry {
  id: string;
  label: string;
  icon: string;
  target: [number, number, number];
}

// Icon slug overrides for facilities whose type slug differs from filename
const ICON_SLUG: Partial<Record<FacilityType, string>> = {
  'training-yard': 'training',
};

const FACILITY_ROOM_ORDER: FacilityType[] = [
  'tavern', 'infirmary', 'training-yard', 'workshop', 'logging-site', 'stone-quarry', 'alchemy-lab',
];

export function RoomNavBar() {
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const setCameraTarget = useGameStore((s) => s.setCameraTarget);
  const facilities = useGameStore((s) => s.facilities);

  const isActive = (target: [number, number, number]) =>
    cameraTarget[0] === target[0] && cameraTarget[2] === target[2];

  // Build room entries dynamically: only show placed facilities (level > 0 && slot assigned)
  const visibleRooms: RoomEntry[] = [
    {
      id: 'guild-hall',
      label: 'Guild Hall',
      icon: '/sprites/icons/icon-room-guild-hall.png',
      target: GUILD_HALL_CAMERA_TARGET,
    },
    ...FACILITY_ROOM_ORDER
      .map((type) => {
        const f = facilities.find((fac) => fac.type === type);
        if (!f || f.level === 0 || f.placedSlot === null) return null;
        const def = FACILITY_DEFINITIONS[type];
        const slug = ICON_SLUG[type] ?? type;
        const [sx, sy, sz] = FACILITY_SLOTS[f.placedSlot];
        const off = FACILITY_CAMERA_OFFSETS[type] ?? [0, 0, 0];
        return {
          id: type,
          label: def.name,
          icon: `/sprites/icons/icon-room-${slug}.png`,
          target: [sx + off[0], sy + off[1], sz + off[2]] as [number, number, number],
        };
      })
      .filter((r) => r !== null) as RoomEntry[],
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 72,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 6,
      zIndex: 50,
      pointerEvents: 'auto',
    }}>
      {visibleRooms.map((room) => (
        <button
          key={room.id}
          onClick={() => setCameraTarget(room.target)}
          title={room.label}
          style={{
            width: 52,
            height: 52,
            padding: 0,
            background: isActive(room.target)
              ? 'rgba(255,215,0,0.25)'
              : 'rgba(20,15,5,0.75)',
            border: isActive(room.target)
              ? '2px solid rgba(255,215,0,0.8)'
              : '1px solid rgba(255,215,0,0.25)',
            borderRadius: 8,
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <img
            src={room.icon}
            alt={room.label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
          />
        </button>
      ))}
    </div>
  );
}
