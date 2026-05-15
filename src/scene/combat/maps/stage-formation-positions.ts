/**
 * Stage spawn-position helper.
 *
 * Translates a (stage, slotIndex, side) tuple into a world position by
 * resolving the SpawnSlot → Platform → world coords. Y comes from platform
 * top surface; X/Z come from `platform.position + localOffset`.
 *
 * Designed to be the spec-driven replacement for `getFormationPosition()` in
 * `combat-arena-types.ts`. Phase 03: dormant. Phase 05: engine wired here.
 */

import type { CombatStageSpec } from './stage-spec-types';

export function getStageSpawnPosition(
  spec: CombatStageSpec,
  slotIndex: number,
  side: 'ally' | 'enemy',
): { x: number; y: number; z: number } {
  const slots = side === 'ally' ? spec.spawnAnchors.ally : spec.spawnAnchors.enemy;
  // Prefer exact formationIndex match; fall back to nearest existing slot
  // so undersized stages (fewer than 6 anchors) still resolve gracefully.
  const slot =
    slots.find((s) => s.formationIndex === slotIndex) ??
    slots[Math.min(slotIndex, slots.length - 1)];
  if (!slot) {
    throw new Error(
      `stage ${spec.id}: no spawn slots defined for side ${side}`,
    );
  }
  const platform = spec.platforms.find((p) => p.id === slot.platformId);
  if (!platform) {
    throw new Error(
      `stage ${spec.id}: slot ${slotIndex} references missing platform ${slot.platformId}`,
    );
  }
  return {
    x: platform.position[0] + slot.localOffset[0],
    y: platform.position[1],
    z: platform.position[2] + slot.localOffset[1],
  };
}
