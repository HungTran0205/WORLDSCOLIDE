/**
 * Renders one soft oval drop shadow per living combat entity.
 * Single InstancedMesh → 1 draw call regardless of entity count.
 * Shadow texture is a radial gradient generated at runtime — no asset file needed.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';
import { COMBAT_SPRITE_FORESHORTEN_PER_Z } from './combat-camera-config';

/** Max entities the shadow layer can handle — increase if combat scales up */
const MAX_SHADOWS = 32;

/** Soft radial gradient circle used as shadow decal texture (128×128, black → transparent) */
function createShadowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const half = size / 2;
  const g = ctx.createRadialGradient(half, half, 0, half, half, half);
  g.addColorStop(0,    'rgba(0,0,0,0.55)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.22)');
  g.addColorStop(1,    'rgba(0,0,0,0)');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  return new CanvasTexture(canvas);
}

// Pre-computed rotation: flat on the XZ ground plane
const GROUND_QUAT = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));

// Oval shape: wider on X (0.55), squashed on depth axis (0.35) for HD-2D perspective feel
const OVAL_BASE_X = 0.55;
const OVAL_BASE_Z = 0.35;

// Reusable temporaries — avoid per-frame allocation
const _pos = new Vector3();
const _mat = new Matrix4();
const _ovalScale = new Vector3();

interface CombatShadowLayerProps {
  entities: ArenaEntitySnapshot[];
}

export function CombatShadowLayer({ entities }: CombatShadowLayerProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const texture = useMemo(() => createShadowTexture(), []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < MAX_SHADOWS; i++) {
      const e = entities[i];
      const alive = e && e.animState !== 'dead' && e.currentHp > 0;

      // Dead/empty slots are sunk 10 000 units below — culled by camera far plane
      _pos.set(
        alive ? e.position.x : 0,
        alive ? 0.01 : -10000,
        alive ? e.position.z : 0,
      );
      // Match sprite foreshortening so front-row shadows are larger than
      // back-row shadows, reinforcing the depth illusion.
      const fz = alive ? 1 + e.position.z * COMBAT_SPRITE_FORESHORTEN_PER_Z : 1;
      _ovalScale.set(OVAL_BASE_X * fz, OVAL_BASE_Z * fz, 1);
      _mat.compose(_pos, GROUND_QUAT, _ovalScale);
      mesh.setMatrixAt(i, _mat);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_SHADOWS]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} onUpdate={(g) => g.index && g.setDrawRange(0, g.index.count)} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </instancedMesh>
  );
}
