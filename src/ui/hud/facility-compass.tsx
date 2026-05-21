/**
 * FacilityCompass — mini Bát Quái navigation widget at bottom-right.
 * Mirrors the 5×5 cross layout of FacilitiesPanel.
 * Filled slots: clickable → fly camera to room.
 * Empty slots: faded, non-interactive.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility, FacilityType } from '@/game/state/game-state';
import { FACILITY_SLOTS, getSlotCameraOffset } from '@/game/data/facility-slot-positions';
import { GUILD_HALL_CAMERA_TARGET } from '@/game/state/camera-slice';

const FACILITY_ICONS: Partial<Record<FacilityType, string>> = {
  'tavern':        '♦',
  'training-yard': '⚔',
  'infirmary':     '✚',
  'workshop':      '⚙',
  'logging-site':  '🌲',
  'stone-quarry':  '⛏',
  'alchemy-lab':   '⚗',
};

// Same cross grid as FacilitiesPanel: null=spacer, -1=Hall, 0–11=slot index
const COMPASS_GRID = [
  [null, null,    6, null, null],
  [null,    5,    0,    7, null],
  [   4,    3,   -1,    1,    8],
  [null,   11,    2,    9, null],
  [null, null,   10, null, null],
] as const;

const CELL = 35;
const GAP  = 2;

const BASE_STYLE: React.CSSProperties = {
  width: CELL,
  height: CELL,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  borderRadius: 4,
  transition: 'border-color 120ms, background 120ms, box-shadow 120ms',
  userSelect: 'none',
};

function camMatch(a: [number, number, number], b: [number, number, number]) {
  return a[0] === b[0] && a[2] === b[2];
}

export function FacilityCompass() {
  const { t } = useTranslation();
  const facilities    = useGameStore(s => s.facilities);
  const cameraTarget  = useGameStore(s => s.cameraTarget);
  const setCameraTarget = useGameStore(s => s.setCameraTarget);

  const slotMap = useMemo(() => {
    const map = new Map<number, GuildFacility>();
    facilities
      .filter(f => f.level > 0 && f.placedSlot !== null)
      .forEach(f => map.set(f.placedSlot!, f));
    return map;
  }, [facilities]);

  function navigateTo(slotIdx: number) {
    const [sx, sy, sz] = FACILITY_SLOTS[slotIdx];
    const off = getSlotCameraOffset(slotIdx);
    setCameraTarget([sx + off[0], sy + off[1], sz + off[2]]);
  }

  const hallActive = camMatch(cameraTarget, GUILD_HALL_CAMERA_TARGET);

  return (
    <div style={{
      position: 'fixed',
      bottom: 72,
      right: 12,
      display: 'grid',
      gridTemplateColumns: `repeat(5, ${CELL}px)`,
      gap: GAP,
      zIndex: 50,
      pointerEvents: 'auto',
    }}>
      {COMPASS_GRID.flat().map((cell, idx) => {

        // Transparent spacer
        if (cell === null) {
          return <div key={idx} style={{ width: CELL, height: CELL }} />;
        }

        // Guild Hall center
        if (cell === -1) {
          return (
            <div
              key={idx}
              title={t('facilityCompass.guildHall')}
              onClick={() => setCameraTarget(GUILD_HALL_CAMERA_TARGET)}
              style={{
                ...BASE_STYLE,
                border: `1px solid ${hallActive ? 'rgba(255,215,0,0.9)' : 'rgba(255,215,0,0.55)'}`,
                background: hallActive ? 'rgba(255,215,0,0.22)' : 'rgba(20,15,5,0.85)',
                boxShadow: hallActive ? '0 0 8px rgba(255,215,0,0.45)' : undefined,
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              ⬡
            </div>
          );
        }

        const facility = slotMap.get(cell);

        // Empty slot — visible but no icon, non-interactive
        if (!facility) {
          return (
            <div
              key={idx}
              style={{
                ...BASE_STYLE,
                border: '1px solid rgba(255,215,0,0.18)',
                background: 'rgba(20,15,5,0.55)',
                opacity: 0.45,
                pointerEvents: 'none',
              }}
            />
          );
        }

        // Filled slot — compute active state
        const [sx, sy, sz] = FACILITY_SLOTS[cell];
        const off = getSlotCameraOffset(cell);
        const target: [number, number, number] = [sx + off[0], sy + off[1], sz + off[2]];
        const isActive = camMatch(cameraTarget, target);
        const icon = FACILITY_ICONS[facility.type] ?? '▣';

        return (
          <div
            key={idx}
            title={facility.type}
            onClick={() => navigateTo(cell)}
            style={{
              ...BASE_STYLE,
              border: `1px solid ${isActive ? 'rgba(255,215,0,0.9)' : 'rgba(255,215,0,0.35)'}`,
              background: isActive ? 'rgba(255,215,0,0.2)' : 'rgba(20,15,5,0.82)',
              boxShadow: isActive ? '0 0 8px rgba(255,215,0,0.4)' : undefined,
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            {icon}
          </div>
        );
      })}
    </div>
  );
}
