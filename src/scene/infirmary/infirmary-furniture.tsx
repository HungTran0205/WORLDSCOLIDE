import { useGLTF } from '@react-three/drei';
import { RoomProp } from '../facility/room-prop';
import { assetUrl } from '@/lib/asset-url';

useGLTF.preload(assetUrl('/models/furnitures/medical-bed.glb'));
useGLTF.preload(assetUrl('/models/furnitures/alchemy-table.glb'));

export function InfirmaryFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      <RoomProp path="/models/furnitures/medical-bed.glb" position={[cx - 2.0, 0, cz - 0.5]} targetHeight={0.7} rotY={Math.PI / 2} />
      <RoomProp path="/models/furnitures/medical-bed.glb" position={[cx + 2.0, 0, cz - 0.5]} targetHeight={0.7} rotY={-Math.PI / 2} />
      <RoomProp path="/models/furnitures/alchemy-table.glb" position={[cx, 0, cz - 2.6]} targetHeight={1.0} rotY={0} />
    </group>
  );
}
