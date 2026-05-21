/**
 * Room-volume Box3 helpers for ambient particle systems.
 *
 * Each room is a ~7×3×7 box centered on its canonical position (facility
 * slot or guild-hall pivot). Particle components use these bounds to seed
 * initial positions and wrap on exit. Phase 04 may extend per-preset bounds
 * overrides; for now a flat lookup keeps the system stateless.
 */

import * as THREE from 'three';
import { FACILITY_SLOTS, FACILITY_DEFAULT_SLOTS } from '@/game/data/facility-slot-positions';
import { GUILD_HALL_CAMERA_TARGET } from '@/game/state/camera-slice';
import type { RoomId } from '../atmosphere-types';

/** Caller-supplied PRNG ( `() => number` in [0, 1) ) — keeps particle bounds pure. */
type Prng = () => number;

/** XZ half-extent of a facility room footprint (matches use-active-room-id). */
const ROOM_HALF = 3.5;
/** Vertical span used for ambient volume — floor to ceiling-ish. Assumes
 *  every room's floor sits at Y=0 (true for all current FACILITY_SLOTS and
 *  GUILD_HALL_CAMERA_TARGET). Revisit if multi-storey rooms land. */
const ROOM_HEIGHT = 3;

/** Generic 7×3×7 box centered on world origin. Useful as last-resort fallback. */
export const DEFAULT_BOUNDS: THREE.Box3 = new THREE.Box3(
  new THREE.Vector3(-ROOM_HALF, 0, -ROOM_HALF),
  new THREE.Vector3(ROOM_HALF, ROOM_HEIGHT, ROOM_HALF),
);

function makeBoxAt(center: [number, number, number]): THREE.Box3 {
  const [cx, , cz] = center;
  return new THREE.Box3(
    new THREE.Vector3(cx - ROOM_HALF, 0, cz - ROOM_HALF),
    new THREE.Vector3(cx + ROOM_HALF, ROOM_HEIGHT, cz + ROOM_HALF),
  );
}

/**
 * Resolve the bounding box for a room.
 *
 * Facility rooms read their default slot position (matches save-migration
 * defaults). Guild hall uses its camera-target pivot. Falls back to
 * `DEFAULT_BOUNDS` when the room id isn't mapped.
 */
export function getRoomBounds(roomId: RoomId): THREE.Box3 {
  if (roomId === 'guild-hall' || roomId === 'main-hall') {
    return makeBoxAt(GUILD_HALL_CAMERA_TARGET);
  }
  const slotIdx = FACILITY_DEFAULT_SLOTS[roomId];
  if (slotIdx == null) return DEFAULT_BOUNDS;
  return makeBoxAt(FACILITY_SLOTS[slotIdx]);
}

/** Write a uniformly-random point inside `bounds` to `target` (XYZ). Uses
 *  a caller-supplied PRNG so callers stay pure under React's render rules. */
export function randomInBounds(
  bounds: THREE.Box3,
  target: THREE.Vector3,
  rng: Prng,
): THREE.Vector3 {
  target.x = THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, rng());
  target.y = THREE.MathUtils.lerp(bounds.min.y, bounds.max.y, rng());
  target.z = THREE.MathUtils.lerp(bounds.min.z, bounds.max.z, rng());
  return target;
}
