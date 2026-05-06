/**
 * Far background — sky/mountain layer of the HD-2D depth scene.
 *
 * Single large plane positioned far behind the battlefield (z = -22), tilted
 * to face the down-tilted ortho camera. Texture is the Mountain Village
 * forest art `/arena/background/fbg_forest.png` (1672×941, ~1.78:1).
 *
 * Visual treatment:
 *  - Dimmed via a cool-grey tint (color multiply) so foreground sprites pop.
 *  - LinearFilter (photographic art, not pixel art) — keeps mountains soft.
 *  - meshBasicMaterial — unlit, depth-respecting; sits behind everything else
 *    naturally because of its z position, no manual depthTest tweaks needed.
 */

import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { useControls } from 'leva';
import { COMBAT_CAM_TILT_RAD } from './combat-camera-config';

export function CombatBgFar() {
  const { width, height, x, y, z, tint } = useControls('Combat / Far BG', {
    // Defaults sized to fully cover a wide panel viewport; scissor + CSS
    // box-shadow clip the rest. Better to oversize and let clipping handle
    // the edges than under-cover and reveal the body/guild bg behind.
    width:  { value: 25.5, min: 5, max: 120, step: 0.5 },
    height: { value: 15.0, min: 3, max: 60, step: 0.5 },
    x:      { value: 0.0, min: -20, max: 20, step: 0.1 },
    y:      { value: -2.6, min: -10, max: 20, step: 0.1 },
    z:      { value: -22.0, min: -50, max: -2, step: 0.5 },
    tint:   { value: '#e0e3c0' },
  }, { collapsed: true });

  const tex = useLoader(TextureLoader, '/arena/background/fbg_forest.png');

  return (
    <mesh
      position={[x, y, z]}
      rotation={[-COMBAT_CAM_TILT_RAD, 0, 0]}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} color={tint} />
    </mesh>
  );
}
