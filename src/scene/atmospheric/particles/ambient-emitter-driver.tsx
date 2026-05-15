/**
 * Drives emission for the persistent `AmbientVfxRoot` systems based on the
 * active room atmosphere preset.
 *
 * Reads `useAtmosphere()` → picks the matching VFX emitter (`useVFXEmitter`)
 * → calls `emit(pos, 1)` at random points inside the current room's bounds
 * at a rate tuned to maintain visible density.
 *
 * Combat gate: skips emission when the combat panel is open (the
 * `AmbientVfxRoot` lives at scene root and would otherwise leak ambient
 * particles into the combat camera frustum).
 *
 * Stays a pure consumer — no VFXParticles mounted here, so this component
 * can mount/unmount freely without touching the compute pipelines.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVFXEmitter } from 'r3f-vfx';
import { useAtmosphere } from '../use-atmosphere';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { getRoomBounds } from './particle-bounds';
import {
  AMBIENT_PARTICLE_NAMES,
  AMBIENT_EMIT_RATES,
  type AmbientParticleKind,
} from './ambient-vfx-root';

function isAmbientKind(k: string): k is AmbientParticleKind {
  return k === 'dust' || k === 'embers' || k === 'magic-motes' || k === 'pollen';
}

export function AmbientEmitterDriver() {
  const preset = useAtmosphere();
  const isCombatOpen = useCombatPanelStore((s) => s.isOpen);

  // Hooks must be called unconditionally. Resolve all four emitters up front;
  // the active one is picked per frame based on preset.particles.
  const dustEmitter = useVFXEmitter(AMBIENT_PARTICLE_NAMES.dust);
  const embersEmitter = useVFXEmitter(AMBIENT_PARTICLE_NAMES.embers);
  const motesEmitter = useVFXEmitter(AMBIENT_PARTICLE_NAMES['magic-motes']);
  const pollenEmitter = useVFXEmitter(AMBIENT_PARTICLE_NAMES.pollen);

  // Fractional-particle accumulator. emit rates aren't whole-particle-per-
  // frame, so we accumulate `rate × delta` and emit when the whole-number
  // count exceeds 0 — guarantees the long-run rate matches AMBIENT_EMIT_RATES.
  const accumRef = useRef(0);

  // Pipeline pre-warm: VFXParticles builds its WebGPU compute pipeline on
  // first emit (lazy). Without warm-up the first room-transition that picks
  // a new archetype stutters 100-500ms while the shader compiles. Emit one
  // particle of every kind on the first frame at y=-100 (well below any
  // camera frustum) to force all four pipelines to compile up-front.
  const warmedUpRef = useRef(false);

  useFrame((_, delta) => {
    if (!warmedUpRef.current) {
      warmedUpRef.current = true;
      const off: [number, number, number] = [0, -100, 0];
      dustEmitter.emit(off, 1);
      embersEmitter.emit(off, 1);
      motesEmitter.emit(off, 1);
      pollenEmitter.emit(off, 1);
    }

    if (isCombatOpen) return;
    if (!preset) return;
    const kind = preset.particles;
    if (!isAmbientKind(kind)) return;

    const emitter =
      kind === 'dust' ? dustEmitter
      : kind === 'embers' ? embersEmitter
      : kind === 'magic-motes' ? motesEmitter
      : pollenEmitter;

    const bounds = getRoomBounds(preset.id);
    const { min, max } = bounds;

    accumRef.current += delta * AMBIENT_EMIT_RATES[kind];
    let toEmit = Math.floor(accumRef.current);
    accumRef.current -= toEmit;

    while (toEmit-- > 0) {
      const x = THREE.MathUtils.lerp(min.x, max.x, Math.random());
      const y = THREE.MathUtils.lerp(min.y, max.y, Math.random());
      const z = THREE.MathUtils.lerp(min.z, max.z, Math.random());
      emitter.emit([x, y, z], 1);
    }
  });

  return null;
}
