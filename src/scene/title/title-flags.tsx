/**
 * Title-scene flanking flags — two "Golden Phoenix Over" banners standing
 * behind the masked figures, framing the back wall medallion. Both render
 * from the same GLB (clone the loaded scene per instance so transforms
 * don't conflict) and run through applyLitMaterial for consistent
 * firelight response. Mirror the symmetry by flipping the right flag on X
 * so the phoenix iconography reads the same on both sides of the throne.
 */

import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { applyLitMaterial } from '@/scene/guild-hall/apply-lit-material';

const FLAG_GLB = '/models/furnitures/Flag_Golden_Phoenix_Over.glb';
/** Target world-space height of each flag in units. ~2.8 reads as a tall
 *  ceremonial banner against the 4-unit back wall. */
const FLAG_HEIGHT = 1.6;

/** Returns a scaled clone of the flag scene that sits on y=0 in local space.
 *  Hook is called once per instance so each flag has its own transform. */
function useScaledFlag(scene: THREE.Group, mirrorX: boolean) {
  return useMemo(() => {
    const clone = scene.clone(true);
    applyLitMaterial(clone);
    const box = new THREE.Box3().setFromObject(clone);
    const h = box.getSize(new THREE.Vector3()).y;
    const s = h > 0 ? FLAG_HEIGHT / h : 1;
    clone.scale.setScalar(s);
    // Mirror the right banner so phoenix iconography reads symmetrically.
    if (mirrorX) clone.scale.x = -s;
    clone.position.y = -box.min.y * s;
    return clone;
  }, [scene, mirrorX]);
}

export function TitleFlags() {
  const { scene } = useGLTF(FLAG_GLB);
  const leftFlag = useScaledFlag(scene, false);
  const rightFlag = useScaledFlag(scene, true);

  return (
    <>
      {/* Left banner — sits just inside the back wall, flanking the medallion */}
      <group position={[-2, 0.7, -4]}>
        <primitive object={leftFlag} />
      </group>
      {/* Right banner — mirrored on X for symmetric phoenix silhouette */}
      <group position={[2, 0.7, -4]}>
        <primitive object={rightFlag} />
      </group>
    </>
  );
}

useGLTF.preload(FLAG_GLB);
