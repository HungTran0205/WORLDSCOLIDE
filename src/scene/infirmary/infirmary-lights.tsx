/**
 * Infirmary lighting — the golden ether crystal (Infrimary_Ember_Engine) is the
 * sole light source. A bright key light sits in the crystal core, four fill
 * lights radiate the glow outward (N/S/E/W), and each recovery pod emits a
 * channelled glow. EVERY light flickers (incl. ambient) so the whole room
 * reads as living ether energy — each runs a distinct seed/frequency so the
 * flickers never sync up (synced flicker looks fake).
 *
 * All lights stay mounted; intensity is gated by `isActive` (toggling mount
 * triggers shader recompilation lag — see facility-room.tsx).
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

/** Crystal core — matches Infrimary_Ember_Engine at [cx, 0, cz-0.1] (height
 *  2.2). Key light originates from the glowing core mid-height. */
const CRYSTAL_OFFSET = { x: 0, y: 1.4, z: -0.1 } as const;

/** Two-sine flicker in [1-amp, 1+amp]. Different freq/seed per light keeps the
 *  room's flickers desynchronized. */
function flickerFactor(t: number, speed: number, seed: number, amp: number): number {
  return 1 + amp * Math.sin(t * speed + seed) * Math.sin(t * speed * 1.7 + seed * 2);
}

interface FlickerSpec {
  pos: [number, number, number];
  color: string;
  base: number;
  distance: number;
  amp: number;
  speed: number;
  seed: number;
}

/** Crystal key + 4 radiate fill — built as one list so they share the flicker
 *  path. Offsets are relative to room center (cx, cz). */
const POINT_LIGHTS: ReadonlyArray<FlickerSpec> = [
  // Central ether key — slow, gentle flicker (energy core breathing).
  { pos: [CRYSTAL_OFFSET.x, CRYSTAL_OFFSET.y, CRYSTAL_OFFSET.z], color: '#ffc864', base: 6, distance: 11, amp: 0.12, speed: 2.2, seed: 0 },
  // Radiate fill N/S/E/W — medium flicker, staggered seeds.
  { pos: [0, 0.9, -2.4], color: '#ffb84d', base: 1.8, distance: 5, amp: 0.2, speed: 5.5, seed: 1.3 },
  { pos: [0, 0.9, 2.4], color: '#ffb84d', base: 1.8, distance: 5, amp: 0.2, speed: 5.0, seed: 2.7 },
  { pos: [2.6, 0.9, 0], color: '#ffb84d', base: 1.8, distance: 5, amp: 0.2, speed: 6.1, seed: 4.1 },
  { pos: [-2.6, 0.9, 0], color: '#ffb84d', base: 1.8, distance: 5, amp: 0.2, speed: 5.8, seed: 5.6 },
];

/** Recovery pod glow — MUST match the Infrimary_Brassbound_Treasure positions
 *  in infirmary-furniture.tsx. Faster, higher-amplitude flicker so pods read as
 *  channelling the ether rather than being a source. */
const POD_LIGHTS: ReadonlyArray<FlickerSpec> = [
  { pos: [-2.5, 0.7, -2.5], color: '#ffd27a', base: 1.3, distance: 3.2, amp: 0.25, speed: 6.5, seed: 0.5 },
  { pos: [2.5, 0.7, - 2], color: '#ffd27a', base: 1.3, distance: 3.2, amp: 0.25, speed: 7.8, seed: 2.2 },
  { pos: [0.8, 0.7, -2.5], color: '#ffd27a', base: 1.3, distance: 3.2, amp: 0.25, speed: 7.1, seed: 3.9 },
];

function FlickerLight({ cx, cz, spec, isActive }: {
  cx: number; cz: number; spec: FlickerSpec; isActive: boolean;
}) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (!ref.current) return;
    if (!isActive) { ref.current.intensity = 0; return; }
    ref.current.intensity = spec.base * flickerFactor(state.clock.elapsedTime, spec.speed, spec.seed, spec.amp);
  });
  return (
    <pointLight
      ref={ref}
      position={[cx + spec.pos[0], spec.pos[1], cz + spec.pos[2]]}
      color={spec.color}
      distance={spec.distance}
      decay={2}
    />
  );
}

/** Warm fill so cavern walls lift out of black — flickers too (very low amp /
 *  slow) so the whole room subtly breathes without jittering. */
function FlickerAmbient({ isActive }: { isActive: boolean }) {
  const ref = useRef<THREE.AmbientLight>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.intensity = isActive ? 0.3 * flickerFactor(state.clock.elapsedTime, 1.8, 7.3, 0.1) : 0;
  });
  return <ambientLight ref={ref} color="#3a2e1e" />;
}

export function InfirmaryLights({ cx, cz, isActive }: {
  cx: number; cz: number; isActive: boolean;
}) {
  return (
    <group>
      {POINT_LIGHTS.map((spec, i) => (
        <FlickerLight key={`pt-${i}`} cx={cx} cz={cz} spec={spec} isActive={isActive} />
      ))}
      {POD_LIGHTS.map((spec, i) => (
        <FlickerLight key={`pod-${i}`} cx={cx} cz={cz} spec={spec} isActive={isActive} />
      ))}
      <FlickerAmbient isActive={isActive} />
    </group>
  );
}
