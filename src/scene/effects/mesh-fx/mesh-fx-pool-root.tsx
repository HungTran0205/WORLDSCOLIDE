/**
 * MeshFxPoolRoot — mounts N×kind mesh slots ONCE and warms the pool.
 *
 * Mount this ONCE in combat-scene-shell (alongside the persistent VFX layers).
 * It never unmounts per-cast — slots are hidden via visible=false while free,
 * made visible on acquire(), and hidden again on release(). This matches the
 * persistent-VFX-root rule (world.tsx:190) and avoids per-cast React reconcile.
 *
 * On mount:  register all mesh refs → pool.warm(gl) builds handles + applies materials.
 * Per frame: billboard every busy mesh toward the camera (flat quad always faces viewer).
 * On unmount: pool.dispose() frees handles; warm() rebuilds on next combat open.
 */

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import * as pool from './mesh-fx-pool';
import { MESH_FX_KINDS, MESH_FX_POOL_SIZE } from './mesh-fx-pool';
import type { MeshFxKind } from './mesh-fx-types';

/** World-space plane size [w, h] for each kind's pool slot. */
const SLOT_SIZE: Record<MeshFxKind, [number, number]> = {
  'thrust-lance':   [3.0, 1.5],
  'shockwave-ring': [2.5, 2.5],
  'slash-arc':      [2.0, 2.0],
  'impact-star':    [2.0, 2.0],
};

export function MeshFxPoolRoot() {
  const meshRefs = useRef<Map<string, THREE.Mesh | null>>(new Map());
  const { gl } = useThree();

  useEffect(() => {
    // Register all mesh refs into the pool BEFORE warming so warm() can apply
    // materials to already-mounted meshes in a single async pass.
    for (const kind of MESH_FX_KINDS) {
      for (let i = 0; i < MESH_FX_POOL_SIZE; i++) {
        pool.registerMesh(kind, i, meshRefs.current.get(`${kind}-${i}`) ?? null);
      }
    }
    pool.warm(gl);

    return () => { pool.dispose(); };
  }, [gl]);

  useFrame(({ camera }) => {
    // Billboard each active mesh toward the camera so the flat quad reads head-on.
    pool.forEachBusyMesh((mesh) => { mesh.quaternion.copy(camera.quaternion); });
  });

  return (
    <>
      {MESH_FX_KINDS.flatMap((kind) =>
        Array.from({ length: MESH_FX_POOL_SIZE }, (_, i) => {
          const key     = `${kind}-${i}` as const;
          const [w, h]  = SLOT_SIZE[kind];
          return (
            <mesh
              key={key}
              ref={(el) => { meshRefs.current.set(key, el); }}
              visible={false}
              renderOrder={10}
            >
              <planeGeometry args={[w, h]} />
            </mesh>
          );
        }),
      )}
    </>
  );
}
