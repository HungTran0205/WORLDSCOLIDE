/**
 * Mid background — silhouette layer (mountain village ruins/trees).
 *
 * Loads a chroma-keyed PNG (sky green removed → transparent). Texture path
 * is map-specific — caller supplies via `texture` prop. Default = Mu Cang
 * Chai mountain silhouette.
 *
 * Sits between far bg (z=-22) and battlefield (z≈0), at z≈-15, slight
 * darken + cool tint to push it visually behind the sprites without losing
 * its silhouette readability.
 *
 * Anchored so its bottom edge sits just below ground line — mid bg appears
 * to grow out of the battlefield's far horizon.
 */

import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { useControls } from 'leva';
import { COMBAT_CAM_TILT_RAD } from './combat-camera-config';

export interface CombatBgMidProps {
  /** Texture path. Default keeps the Mu Cang Chai silhouette for back-compat. */
  texture?: string;
}

const DEFAULT_MID_BG_TEXTURE = '/arena/background/mbg_mucangchai_alpha.png';

export function CombatBgMid({ texture = DEFAULT_MID_BG_TEXTURE }: CombatBgMidProps = {}) {
  const { width, height, x, y, z, tint, alphaTest } = useControls('Combat / Mid BG', {
    // Wider default — same rationale as far bg: oversize and let scissor +
    // CSS box-shadow trim. Mid bg foliage extends below ground so users see
    // silhouette grow from horizon line in the panel.
    width:     { value: 27.0, min: 5, max: 100, step: 0.5 },
    height:    { value: 14.0, min: 3, max: 50, step: 0.5 },
    x:         { value: -0.6, min: -20, max: 20, step: 0.1 },
    y:         { value: 0.9,  min: -10, max: 25, step: 0.1 },
    z:         { value: -15.5, min: -30, max: -2, step: 0.5 },
    // Darker + cooler tint so mid-ground silhouette recedes behind sprites.
    // history: '#9faab0' (too bright) → '#3a3f45' (too dark) → '#4a5058' (gentle lift).
    tint:      { value: '#9ba08e' },
    alphaTest: { value: 0.05, min: 0, max: 1, step: 0.01 },
  }, { collapsed: true });

  const tex = useLoader(TextureLoader, texture);

  return (
    <mesh
      position={[x, y, z]}
      rotation={[-COMBAT_CAM_TILT_RAD, 0, 0]}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} color={tint} transparent alphaTest={alphaTest} />
    </mesh>
  );
}
