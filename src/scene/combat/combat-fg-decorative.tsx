/**
 * Foreground decoratives — procedural grass/rock silhouettes scattered along
 * the front edge of the stage (z = +5..+7), outside sprite movement extent
 * (sprites at z ≤ +3, x ≤ ±10).
 *
 * Visual treatment:
 *  - Procedural canvas textures (no asset files): grass tuft + rock blob
 *    silhouettes in dark forest green. Generated once per mount.
 *  - Each instance billboarded to camera tilt so they read as upright objects
 *    rather than ground decals.
 *  - Slight alpha (0.85) — they shouldn't fully block sprites if any sprite
 *    drifts close, and mild blur via slight blur in the canvas paint.
 *  - Positioned ONLY at left/right edges (avoid center where sprites fight)
 *    so they frame the action without obscuring it.
 */

import { useMemo } from 'react';
import { CanvasTexture, NearestFilter } from 'three';
import { useControls } from 'leva';
import { COMBAT_CAM_TILT_RAD } from './combat-camera-config';

interface DecorPlacement {
  x: number;
  z: number;
  scale: number;
  variant: 'grass' | 'rock';
  flip: boolean;
}

// Hand-placed positions — only at the FAR edges of the panel (|x| ≥ 14) so
// they frame the battlefield without occluding sprites at x=-10..+10. Two
// per side, alternating grass + rock for variety.
const PLACEMENTS: DecorPlacement[] = [
  { x: -16, z: 5.5, scale: 1.3, variant: 'grass', flip: false },
  { x: -14, z: 6.5, scale: 0.9, variant: 'rock', flip: false },
  { x: 14, z: 6.5, scale: 0.9, variant: 'rock', flip: true },
  { x: 16, z: 5.5, scale: 1.3, variant: 'grass', flip: true },
];

/** Soft grass tuft silhouette — multi-blade silhouette on transparent bg. */
function createGrassTexture(): CanvasTexture {
  const w = 128;
  const h = 96;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  // Multiple curved blades, dark forest tone with slight golden highlights
  ctx.fillStyle = '#1a2a18';
  // Cluster of triangular blades at the bottom
  const blades = [
    { x: 20, w: 14, h: 70 },
    { x: 35, w: 11, h: 55 },
    { x: 48, w: 16, h: 80 },
    { x: 65, w: 13, h: 62 },
    { x: 78, w: 15, h: 75 },
    { x: 95, w: 12, h: 58 },
    { x: 108, w: 14, h: 70 },
  ];
  for (const b of blades) {
    ctx.beginPath();
    ctx.moveTo(b.x, h);
    ctx.lineTo(b.x + b.w / 2, h - b.h);
    ctx.lineTo(b.x + b.w, h);
    ctx.closePath();
    ctx.fill();
  }
  // Subtle golden top hint
  ctx.fillStyle = '#5e6a25';
  for (const b of blades) {
    ctx.fillRect(b.x + b.w / 2 - 1, h - b.h, 2, 6);
  }
  return finalizeTexture(c);
}

/** Lumpy rock silhouette. */
function createRockTexture(): CanvasTexture {
  const w = 96;
  const h = 64;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#2a2a26';
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.85, w * 0.45, h * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // Highlight on top
  ctx.fillStyle = '#3e3d35';
  ctx.beginPath();
  ctx.ellipse(w * 0.45, h * 0.55, w * 0.18, h * 0.12, -0.2, 0, Math.PI * 2);
  ctx.fill();
  return finalizeTexture(c);
}

function finalizeTexture(c: HTMLCanvasElement): CanvasTexture {
  const tex = new CanvasTexture(c);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  return tex;
}

export function CombatFgDecorative() {
  const { enabled, xScale, zOffset, sizeScale, opacity } = useControls('Combat / Foreground', {
    enabled:   { value: true },
    xScale:    { value: 1.0, min: 0.3, max: 2.0, step: 0.05, label: 'spread X' },
    zOffset:   { value: 0,   min: -3,  max: 5,   step: 0.1,  label: 'z offset' },
    sizeScale: { value: 1.0, min: 0.3, max: 3.0, step: 0.05, label: 'size mult' },
    opacity:   { value: 0.92, min: 0, max: 1, step: 0.01 },
  }, { collapsed: true });

  const grassTex = useMemo(() => createGrassTexture(), []);
  const rockTex = useMemo(() => createRockTexture(), []);

  if (!enabled) return null;

  return (
    <>
      {PLACEMENTS.map((p, i) => {
        const tex = p.variant === 'grass' ? grassTex : rockTex;
        const aspect = p.variant === 'grass' ? 128 / 96 : 96 / 64;
        const height = p.scale * 1.6 * sizeScale;
        const width = height * aspect;
        const px = p.x * xScale;
        const pz = p.z + zOffset;
        return (
          <mesh
            key={i}
            position={[px, height * 0.5, pz]}
            rotation={[-COMBAT_CAM_TILT_RAD, 0, 0]}
            scale={[p.flip ? -width : width, height, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={tex}
              transparent
              alphaTest={0.05}
              opacity={opacity}
            />
          </mesh>
        );
      })}
    </>
  );
}
