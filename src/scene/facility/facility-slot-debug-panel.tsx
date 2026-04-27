/**
 * Dev-only Leva panel for tuning per-slot camera offsets.
 * Live-updates the camera target when the active slot's values change.
 */

import { useEffect } from 'react';
import { useControls, folder, button } from 'leva';
import { useGameStore } from '@/game/state/store';
import {
  FACILITY_SLOTS,
  FACILITY_SLOT_CAMERA_OFFSETS,
  FACILITY_CAMERA_DEFAULT_OFFSET,
  _debugSlotOffsets,
} from '@/game/data/facility-slot-positions';

const SLOT_LABELS = [
  'A0 (x=-6.5, z=-8.5)',   'A1 (x=-6.5, z=-20.5)', 'A2 (x=-6.5, z=-32.5)', 'A3 (x=-6.5, z=-44.5)',
  'B4 (x=3.5, z=-8.5)',    'B5 (x=3.5, z=-20.5)',  'B6 (x=3.5, z=-32.5)',  'B7 (x=3.5, z=-44.5)',
  'C8 (x=13.5, z=-8.5)',   'C9 (x=13.5, z=-20.5)', 'C10 (x=13.5, z=-32.5)', 'C11 (x=13.5, z=-44.5)',
];

function initVal(slot: number, axis: 0 | 2): number {
  return (FACILITY_SLOT_CAMERA_OFFSETS[slot] ?? FACILITY_CAMERA_DEFAULT_OFFSET)[axis];
}

/** Returns the slot index whose center is closest to the current cameraTarget, or null if at guild hall. */
function getActiveSlotIndex(cameraTarget: [number, number, number]): number | null {
  let best: number | null = null;
  let bestDist = 5; // threshold: must be within 5 world units of a slot center
  for (let i = 0; i < FACILITY_SLOTS.length; i++) {
    const [sx, , sz] = FACILITY_SLOTS[i];
    const dist = Math.sqrt(
      Math.pow(cameraTarget[0] - sx, 2) + Math.pow(cameraTarget[2] - sz, 2),
    );
    if (dist < bestDist) { bestDist = dist; best = i; }
  }
  return best;
}

export function FacilitySlotDebugPanel() {
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const setCameraTarget = useGameStore((s) => s.setCameraTarget);

  const schema: Record<string, ReturnType<typeof folder>> = {};
  for (let i = 0; i < 12; i++) {
    schema[SLOT_LABELS[i]] = folder(
      {
        [`s${i}x`]: { value: initVal(i, 0), min: -8, max: 8, step: 0.5, label: 'X (right)' },
        [`s${i}z`]: { value: initVal(i, 2), min: -8, max: 8, step: 0.5, label: 'Z (up)' },
      },
      { collapsed: true },
    );
  }

  const ctrl = useControls('Facility Slots', schema);

  useEffect(() => {
    const cv = ctrl as Record<string, number>;
    for (let i = 0; i < 12; i++) {
      const x = cv[`s${i}x`] ?? 0;
      const z = cv[`s${i}z`] ?? 0;
      _debugSlotOffsets[i] = [x, 0, z];
    }

    // If camera is currently at a slot, move it live to reflect new offset
    const activeSlot = getActiveSlotIndex(cameraTarget);
    if (activeSlot !== null) {
      const [sx, sy, sz] = FACILITY_SLOTS[activeSlot];
      const x = cv[`s${activeSlot}x`] ?? 0;
      const z = cv[`s${activeSlot}z`] ?? 0;
      setCameraTarget([sx + x, sy, sz + z]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctrl]);

  useControls('Facility Slots', {
    'Export to console': button(() => {
      const cv = ctrl as Record<string, number>;
      const result = Array.from({ length: 12 }, (_, i) => {
        const x = cv[`s${i}x`] ?? 0;
        const z = cv[`s${i}z`] ?? 0;
        return `  [${x}, 0, ${z}],   // slot ${i} — ${SLOT_LABELS[i]}`;
      }).join('\n');
      console.log(`FACILITY_SLOT_CAMERA_OFFSETS:\n[\n${result}\n]`);
    }),
  });

  return null;
}
