/**
 * Linh Son guild hall floor — tiles the GLB floor piece across a 5×4 grid
 * to cover the 10×7 world-unit floor area.
 *
 * GLB natural size (GLTF Y-up): X≈1.9 wide, Y≈1.9 tall (vertical slab),
 * Z≈0.35 thick. The wooden face normals point toward local -Z.
 *
 * Rotation [+PI/2, 0, 0] maps local -Z → world +Y, so the wood face looks UP.
 * After this rotation: local-X → world-X, local-Y → world-Z (depth).
 */

import { Clone, useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { applyLitMaterial } from './apply-lit-material';

const FLOOR_GLB = '/GuildHall/LinhSon/optimized/p_floortilset.glb';
useGLTF.preload(FLOOR_GLB);

/** Number of tile columns and rows across the floor grid */
const COLS = 5;
const ROWS = 4;

interface LinhSonFloorProps {
  gridWidth?: number;
  gridDepth?: number;
}

export function LinhSonFloor({ gridWidth = 10, gridDepth = 7 }: LinhSonFloorProps) {
  const { scene } = useGLTF(FLOOR_GLB);

  const litScene = useMemo(() => {
    const clone = scene.clone(true);
    applyLitMaterial(clone);
    return clone;
  }, [scene]);

  const { tileScaleX, tileScaleZ, tileW, tileD } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());

    // World-space dimensions per tile cell
    const cellW = gridWidth / COLS;  // 10 / 5 = 2.0 world units
    const cellD = gridDepth / ROWS;  // 7  / 4 = 1.75 world units

    // Scale each instance so it fills its cell
    // After Rx(-PI/2): local-X → world-X, local-Y → world-Z
    return {
      tileScaleX: cellW / size.x,
      tileScaleZ: cellD / size.y,
      tileW: cellW,
      tileD: cellD,
    };
  }, [scene, gridWidth, gridDepth]);

  const tiles = useMemo(() => {
    const result: { x: number; z: number }[] = [];
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        result.push({
          x: col * tileW + tileW / 2,
          z: row * tileD + tileD / 2,
        });
      }
    }
    return result;
  }, [tileW, tileD]);

  return (
    <group>
      {tiles.map(({ x, z }) => (
        <group
          key={`${x},${z}`}
          position={[x, 0 -0.13, z]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[tileScaleX, tileScaleZ, 1]}
        >
          <Clone object={litScene} />
        </group>
      ))}
    </group>
  );
}
