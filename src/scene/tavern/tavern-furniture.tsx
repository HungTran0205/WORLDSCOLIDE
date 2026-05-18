import { useGLTF } from '@react-three/drei';
import { RoomProp } from '../facility/room-prop';

useGLTF.preload('/models/furnitures/Tavern_Linh_Son_Tu_Quan_Apot.glb');
useGLTF.preload('/models/furnitures/wine-barrel.glb');

export function TavernFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      <RoomProp path="/models/furnitures/Tavern_Linh_Son_Tu_Quan_Apot.glb" position={[cx - 2.8, 0, cz+1.2]} targetHeight={3} rotY={1.55} />
      <RoomProp path="/models/furnitures/Tavern_Rusty_Steamworks_Fact.glb" position={[cx - 1.7, 0, cz+1.2]} targetHeight={1.8} rotY={1.55} />
      <RoomProp path="/models/furnitures/Tavern_Emerald_Bamboo_Table.glb" position={[cx + 1.5, 0, cz - 1.2]} targetHeight={0.7} rotY={0} />
      <RoomProp path="/models/furnitures/Tavern_Emerald_Cottage.glb" position={[cx + 0.5, 0, cz + 0.8]} targetHeight={0.5} rotY={1.5} />
      <RoomProp path="/models/furnitures/Tavern_Emerald_Bamboo_Table.glb" position={[cx + 2, 0, cz+ 2]} targetHeight={0.7} rotY={1.5} />
      <RoomProp path="/models/furnitures/Tavern_Emerald_Cottage.glb" position={[cx + 2, 0, cz+ 0.5]} targetHeight={0.5} rotY={1.5} />
    </group>
  );
}
