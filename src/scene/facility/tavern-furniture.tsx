import { useGLTF } from '@react-three/drei';
import { RoomProp } from './room-prop';

useGLTF.preload('/models/furnitures/bar-counter.glb');
useGLTF.preload('/models/furnitures/wine-barrel.glb');

export function TavernFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      <RoomProp path="/models/furnitures/bar-counter.glb" position={[cx, 0, cz - 2.6]} targetHeight={0.9} rotY={0} />
      <RoomProp path="/models/furnitures/wine-barrel.glb" position={[cx - 2.2, 0, cz - 2.4]} targetHeight={0.75} rotY={0.4} />
      <RoomProp path="/models/furnitures/wine-barrel.glb" position={[cx + 2.2, 0, cz - 2.4]} targetHeight={0.75} rotY={-0.3} />
    </group>
  );
}
