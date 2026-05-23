import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

[
  '/arena/forest/3dprops/optimized/p_tree_large.glb',
  '/arena/forest/3dprops/optimized/p_tree_pine.glb',
  '/arena/forest/3dprops/optimized/p_stump.glb',
  '/arena/forest/3dprops/optimized/p_log_fallen.glb',
  '/arena/forest/3dprops/optimized/p_bush.glb',
].forEach((p) => useGLTF.preload(p));

function ForestProp({ path, position, targetHeight, rotY = 0 }: {
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

/** Forest tree/stump scatter around the 7×7 logging-site room edges */
export function ForestRoomDecor({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      <ForestProp path="/arena/forest/3dprops/optimized/p_tree_large.glb" position={[cx - 2.2, 0, cz - 2.5]} targetHeight={4.2} rotY={0.3} />
      <ForestProp path="/arena/forest/3dprops/optimized/p_tree_pine.glb"  position={[cx + 1.8, 0, cz - 2.8]} targetHeight={3.8} rotY={-0.5} />
      <ForestProp path="/arena/forest/3dprops/optimized/p_tree_pine.glb"  position={[cx - 0.2, 0, cz - 3.0]} targetHeight={3.0} rotY={0.9} />
      <ForestProp path="/arena/forest/3dprops/optimized/p_tree_pine.glb"  position={[cx - 2.8, 0, cz + 0.5]} targetHeight={3.5} rotY={1.2} />
      <ForestProp path="/arena/forest/3dprops/optimized/p_tree_pine.glb"  position={[cx - 2.6, 0, cz - 1.2]} targetHeight={2.6} rotY={0.6} />
      <ForestProp path="/arena/forest/3dprops/optimized/p_tree_pine.glb"  position={[cx + 2.7, 0, cz - 1.5]} targetHeight={2.8} rotY={-1.0} />
      <ForestProp path="/arena/forest/3dprops/optimized/p_stump.glb"      position={[cx + 1.3, -0.2, cz - 0.1]} targetHeight={0.6} rotY={0.8} />
      <ForestProp path="/arena/forest/3dprops/optimized/p_log_fallen.glb" position={[cx + 0.8, 0, cz + 2.0]}  targetHeight={0.5} rotY={0.6} />
    </group>
  );
}
