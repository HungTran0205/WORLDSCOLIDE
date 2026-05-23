import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { applyLitMaterial } from '../guild-hall/apply-lit-material';
import { assetUrl } from '@/lib/asset-url';

/** Scaled GLB prop placed at world-space position inside a room */
export function RoomProp({ path, position, targetHeight, rotY = 0, castShadow = false }: {
  path: string;
  position: [number, number, number];
  targetHeight: number;
  rotY?: number;
  /** Convert materials to MeshStandard and enable castShadow + receiveShadow */
  castShadow?: boolean;
}) {
  const { scene } = useGLTF(assetUrl(path));
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const h = box.getSize(new THREE.Vector3()).y;
    const s = h > 0 ? targetHeight / h : 1;
    clone.scale.setScalar(s);
    clone.position.y = -box.min.y * s;
    if (castShadow) applyLitMaterial(clone);
    return clone;
  }, [scene, targetHeight, castShadow]);

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <primitive object={model} />
    </group>
  );
}
