import { useGLTF } from '@react-three/drei';
import { InteractiveFacilityObject } from '../facility/interactive-facility-object';
import { assetUrl } from '@/lib/asset-url';

useGLTF.preload(assetUrl('/models/furnitures/training-dummy.glb'));

const DUMMY = '/models/furnitures/training-dummy.glb';

/**
 * Training Yard props. The central dummy is the diegetic trigger: clicking it
 * opens the Training Yard function panel (assign member + pick a skill to rank).
 */
export function TrainingYardFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      <InteractiveFacilityObject
        glbPath={DUMMY}
        position={[cx, 0, cz - 1.8]}
        targetHeight={1.6}
        rotY={Math.PI}
        facilityType="training-yard"
      />
    </group>
  );
}
