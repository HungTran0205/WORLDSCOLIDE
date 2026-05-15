/**
 * Resolves the current active room from camera target position.
 *
 * Reads cameraTarget (the lerp GOAL, not the live camera pos) — so this is
 * naturally hysteresis-free: the goal snaps to a single room when the player
 * navigates, and the lerp hook handles the visual transition between presets.
 *
 * Returns `null` when the camera target sits between rooms (e.g. user dragged
 * the camera off-grid via OrbitControls). Downstream consumers treat null as
 * "use last preset" via the lerp hook.
 */

import { useMemo } from 'react';
import { useGameStore } from '@/game/state/store';
import { FACILITY_SLOTS } from '@/game/data/facility-slot-positions';
import { GUILD_HALL_CAMERA_TARGET } from '@/game/state/camera-slice';
import type { RoomId } from './atmosphere-types';

/** Half-extent of a 7×7 facility room footprint (matches isInAlchemy logic
 *  in world.tsx and the per-room point-light activation check). */
const ROOM_RADIUS = 3.5;

export function useActiveRoomId(): RoomId | null {
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const facilities = useGameStore((s) => s.facilities);

  return useMemo<RoomId | null>(() => {
    const [tx, , tz] = cameraTarget;

    // Facility rooms first — they overlay onto specific slots in the bát quái layout.
    for (const f of facilities) {
      if (f.placedSlot == null || f.level === 0) continue;
      const [fx, , fz] = FACILITY_SLOTS[f.placedSlot];
      if (Math.abs(tx - fx) <= ROOM_RADIUS && Math.abs(tz - fz) <= ROOM_RADIUS) {
        // FacilityType values are a strict subset of RoomId — safe cast.
        return f.type as RoomId;
      }
    }

    // Guild-hall sits at the origin frame; matched last because facilities can
    // legally overlap the central pad in build mode (slots 0..3 are inner cross).
    const [gx, , gz] = GUILD_HALL_CAMERA_TARGET;
    if (Math.abs(tx - gx) <= ROOM_RADIUS && Math.abs(tz - gz) <= ROOM_RADIUS) {
      return 'guild-hall';
    }

    return null;
  }, [cameraTarget, facilities]);
}
