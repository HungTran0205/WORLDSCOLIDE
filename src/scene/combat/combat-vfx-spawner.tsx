/**
 * CombatVfxSpawner — spawn particle effects at entity positions during combat.
 * Uses Three-VFX (r3f-vfx) for GPU particle effects.
 * Exposed via forwardRef + useImperativeHandle for imperative control.
 *
 * Note: This is a lightweight integration point. Effect presets are loaded
 * from VFX playground exports when available.
 *
 * Phase 05 — kept minimal for initial implementation. VFX effects will be
 * expanded as new particles are designed in the VFX playground tool.
 */

import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { Group } from 'three';

/** VFX spawner interface — called imperatively from CombatFightController */
export interface CombatVfxSpawnerHandle {
  spawnHitEffect(position: { x: number; z: number }, isCrit: boolean): void;
  spawnDeathEffect(position: { x: number; z: number }): void;
  spawnSkillEffect(position: { x: number; z: number }, skillId: string): void;
  spawnHealEffect(position: { x: number; z: number }): void;
}

/**
 * Placeholder VFX spawner — Three-VFX integration point.
 * Currently a no-op stub; will be wired to r3f-vfx particle emitters
 * once effect presets are finalized in the VFX playground.
 *
 * The interface is stable — CombatFightController can call these methods
 * immediately; visual effects will appear once particle configs are added.
 */
export const CombatVfxSpawner = forwardRef<CombatVfxSpawnerHandle>(
  function CombatVfxSpawner(_, ref) {
    const groupRef = useRef<Group>(null);

    useImperativeHandle(ref, () => ({
      spawnHitEffect(_position: { x: number; z: number }, _isCrit: boolean): void {
        // TODO: Integrate with Three-VFX hit particle emitter
        // const emitter = hitEmitterRef.current;
        // if (emitter) emitter.emit(position);
      },

      spawnDeathEffect(_position: { x: number; z: number }): void {
        // TODO: Integrate with Three-VFX death particle emitter
      },

      spawnSkillEffect(_position: { x: number; z: number }, _skillId: string): void {
        // TODO: Per-civilization skill effects from VFX playground
      },

      spawnHealEffect(_position: { x: number; z: number }): void {
        // TODO: Green sparkle/glow heal effect
      },
    }));

    return <group ref={groupRef} />;
  },
);
