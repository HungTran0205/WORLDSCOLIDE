import { useGLTF } from '@react-three/drei';
import { RoomProp } from './room-prop';

useGLTF.preload('/models/furnitures/workbench.glb');
useGLTF.preload('/models/furnitures/alchemy-table.glb');

export function WorkshopFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      <RoomProp path="/models/furnitures/workbench.glb" position={[cx, 0, cz - 2.6]} targetHeight={1.0} rotY={0} />
      <RoomProp path="/models/furnitures/alchemy-table.glb" position={[cx - 2.2, 0, cz - 1.0]} targetHeight={1.0} rotY={Math.PI / 2} />
    </group>
  );
}
