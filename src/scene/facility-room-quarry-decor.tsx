/**
 * Rocky cave decor for the 7×7 stone-quarry facility room.
 * Uses cave arena GLBs — same pattern as ForestRoomDecor.
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Preload cave props
useGLTF.preload('/arena/cave/3dprops/p_stonepilla.glb');
useGLTF.preload('/arena/cave/3dprops/p_stone_pillar_falling.glb');
useGLTF.preload('/arena/cave/3dprops/p_standing_torch.glb');

/** Scaled GLB placed at world-space position */
function CaveProp({ path, position, targetHeight, rotY = 0 }: {
  path: string;
  position: [number, number, number];
  targetHeight: number;
  rotY?: number;
}) {
  const { scene } = useGLTF(path);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const h = box.getSize(new THREE.Vector3()).y;
    const s = h > 0 ? targetHeight / h : 1;
    clone.scale.setScalar(s);
    clone.position.y = -box.min.y * s;
    return clone;
  }, [scene, targetHeight]);

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <primitive object={model} />
    </group>
  );
}

/** Stone pillar clusters and torches for the stone-quarry room */
export function QuarryRoomDecor({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      {/* Pillar clusters at back corners */}
      <CaveProp path="/arena/cave/3dprops/p_stonepilla.glb"          position={[cx - 2.6, 0, cz - 2.5]} targetHeight={3.5} rotY={0.2} />
      <CaveProp path="/arena/cave/3dprops/p_stonepilla.glb"          position={[cx + 2.5, 0, cz - 2.4]} targetHeight={2.8} rotY={-0.4} />
      {/* Smaller pillar mid-left */}
      <CaveProp path="/arena/cave/3dprops/p_stonepilla.glb"          position={[cx - 2.4, 0, cz + 0.5]} targetHeight={1.8} rotY={0.8} />
      {/* Fallen pillar mid-back */}
      <CaveProp path="/arena/cave/3dprops/p_stone_pillar_falling.glb" position={[cx + 0.6, 0, cz - 1.8]} targetHeight={1.0} rotY={0.3} />
      {/* Standing torches on side walls */}
      <CaveProp path="/arena/cave/3dprops/p_standing_torch.glb"       position={[cx - 2.8, 0, cz - 0.5]} targetHeight={1.6} rotY={0} />
      <CaveProp path="/arena/cave/3dprops/p_standing_torch.glb"       position={[cx + 2.8, 0, cz - 0.5]} targetHeight={1.6} rotY={0} />
    </group>
  );
}
