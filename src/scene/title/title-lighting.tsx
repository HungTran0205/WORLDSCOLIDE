/**
 * Title-scene lighting — dark ritualistic preset.
 * Drum is hearth-lit (warm orange flicker); back wall picks up subtle patina
 * cyan rim from the imagined Linh Son crystal veins. DrumFireVfx (mounted by
 * TitleDrum in Phase 3) already provides its own spotlight, so this layer is
 * purely environmental fill.
 */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { PointLight } from 'three';

const FIRE_BASE_INTENSITY = 2.4;
const FIRE_FLICKER_AMPLITUDE = 0.45;

export function TitleLighting() {
  const fireFillRef = useRef<PointLight>(null);

  useFrame((state) => {
    const light = fireFillRef.current;
    if (!light) return;
    // Layered sines — no Math.random — so flicker reads as warm hearth, not strobe.
    const t = state.clock.elapsedTime;
    const flicker =
      FIRE_BASE_INTENSITY +
      (Math.sin(t * 12.3) + Math.sin(t * 7.7)) * 0.5 * FIRE_FLICKER_AMPLITUDE;
    light.intensity = flicker;
  });

  return (
    <>
      <ambientLight color="#993e3e" intensity={0.55} />
      <pointLight
        ref={fireFillRef}
        position={[0, 0.6, 1.0]}
        color="#ff6b1a"
        intensity={FIRE_BASE_INTENSITY}
        distance={12}
        decay={1.2}
      />
      {/* Center-character uplight — low orange rim from below at the cult
       *  leader's feet. Reads as flame-cast underlight on the central figure,
       *  separating their silhouette from the equally-lit flanking NPCs. */}
      <pointLight
        position={[0, 0.15, -0.4]}
        color="#ff8533"
        intensity={1.4}
        distance={3.5}
        decay={2.0}
      />
      {/* Back-door copper accents — two warm lines hinting at a corridor
       *  behind the wall. Keeps the background dark but adds depth. */}
      <pointLight
        position={[-0.9, 1.2, -3.2]}
        color="#b04020"
        intensity={0.55}
        distance={4.5}
        decay={1.8}
      />
      <pointLight
        position={[0.9, 1.2, -3.2]}
        color="#c66020"
        intensity={0.55}
        distance={4.5}
        decay={1.8}
      />
      {/* Back-wall warm wash — pulls the medallion + door panel out of the
       *  dead-black zone since the wall got pushed to z=-8. Amber/gold so it
       *  reads as firelight bouncing off the lacquered surface, not flat fill. */}
      <pointLight
        position={[0, 1.8, -6.5]}
        color="#c87a30"
        intensity={1.4}
        distance={7}
        decay={1.4}
      />
      {/* Back-wall patina cyan rim — Linh Son crystal-vein glow.
       *  Bumped intensity + pushed deeper so it lights the wall texture
       *  itself rather than dying mid-room. */}
      <pointLight
        position={[0, 1.6, -6]}
        color="#3aa0a0"
        intensity={0.7}
        distance={9}
        decay={1.5}
      />
    </>
  );
}
