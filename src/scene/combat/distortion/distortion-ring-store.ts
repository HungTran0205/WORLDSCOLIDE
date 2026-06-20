/**
 * Distortion ring store — fixed-slot ring impulse buffer for screen-space UV warp.
 *
 * Holds up to MAX_RINGS active rings (module singleton). pushDistortionRing
 * claims a free slot or evicts the oldest; sampleRings projects each ring's
 * world position to screen UV via the combat camera and decays strength over
 * the ring lifetime, writing results into the caller-supplied vec4 slot array.
 * clear() zeros all slots on combat exit.
 *
 * No per-frame allocation: slot array is a fixed pool; projection reuses one
 * Vector3 scratch. The Vec4Slot shape matches TSL's UniformNode .value contract
 * so callers stay decoupled from TSL internals.
 */

import { Vector3 } from 'three';
import type { Camera } from 'three';

const MAX_RINGS = 4;

interface RingSlot {
  active: boolean;
  worldX: number;
  worldY: number;
  worldZ: number;
  durationMs: number;
  maxStrength: number;
  startMs: number;
}

const _slots: RingSlot[] = Array.from({ length: MAX_RINGS }, () => ({
  active: false, worldX: 0, worldY: 0, worldZ: 0,
  durationMs: 1, maxStrength: 0, startMs: 0,
}));

const _scratch = new Vector3();

/** Uniform-compatible vec4 slot — matches TSL UniformNode `.value` contract. */
export interface Vec4Slot {
  value: { x: number; y: number; z: number; w: number };
}

/**
 * Push a ring impulse. Writes [centerU, centerV, radius01, strength] into the
 * sampled output each frame until elapsed >= durationMs.
 *
 * @param worldPos    Impact world position.
 * @param durationMs  Lifetime in milliseconds; radius01 = elapsed/durationMs.
 * @param maxStrength Peak UV displacement (at t=0). Phase 08 owns tuning; ~0.04.
 */
export function pushDistortionRing(params: {
  worldPos: readonly [number, number, number];
  durationMs: number;
  maxStrength: number;
}): void {
  // Find free slot or evict oldest.
  let slotIdx = 0;
  let oldestStart = Infinity;
  for (let i = 0; i < MAX_RINGS; i++) {
    if (!_slots[i].active) { slotIdx = i; break; }
    if (_slots[i].startMs < oldestStart) { oldestStart = _slots[i].startMs; slotIdx = i; }
  }
  const s = _slots[slotIdx];
  s.active = true;
  s.worldX = params.worldPos[0];
  s.worldY = params.worldPos[1];
  s.worldZ = params.worldPos[2];
  s.durationMs = params.durationMs;
  s.maxStrength = params.maxStrength;
  s.startMs = performance.now();
}

/**
 * Project each active ring into vec4 slots: [centerU, centerV, radius01, strength].
 * Expired rings are deactivated and their slot is zeroed. Call every frame from the
 * pass's useFrame before post.render().
 *
 * @param camera  The combat ortho camera used by the post pass.
 * @param nowMs   Current timestamp from performance.now().
 * @param slots   4-element array of Vec4Slot to write into.
 */
export function sampleRings(
  camera: Camera,
  nowMs: number,
  slots: Vec4Slot[],
): void {
  for (let i = 0; i < MAX_RINGS; i++) {
    const s = _slots[i];
    const slot = slots[i];
    if (!s.active) {
      slot.value.x = 0; slot.value.y = 0; slot.value.z = 0; slot.value.w = 0;
      continue;
    }
    const elapsed = nowMs - s.startMs;
    if (elapsed >= s.durationMs) {
      s.active = false;
      slot.value.x = 0; slot.value.y = 0; slot.value.z = 0; slot.value.w = 0;
      continue;
    }
    const t = elapsed / s.durationMs;
    _scratch.set(s.worldX, s.worldY, s.worldZ);
    _scratch.project(camera);
    slot.value.x = _scratch.x * 0.5 + 0.5;   // NDC → UV
    slot.value.y = _scratch.y * 0.5 + 0.5;
    slot.value.z = t;                           // radius01: 0 (center) → 1 (faded)
    slot.value.w = s.maxStrength * (1 - t);     // strength decays to 0
  }
}

/** Zero all active ring slots — call on combat exit to prevent cross-combat bleed. */
export function clear(): void {
  for (const s of _slots) s.active = false;
}
