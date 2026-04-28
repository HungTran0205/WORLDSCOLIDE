import { useGLTF } from '@react-three/drei';
import { RoomProp } from '../facility/room-prop';

useGLTF.preload('/models/furnitures/training-dummy.glb');

export function TrainingYardFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      <RoomProp path="/models/furnitures/training-dummy.glb" position={[cx, 0, cz - 1.8]} targetHeight={1.6} rotY={Math.PI} />
    </group>
  );
}
