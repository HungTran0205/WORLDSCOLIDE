import { useGLTF } from '@react-three/drei';
import { RoomProp } from '../facility/room-prop';

useGLTF.preload('/models/furnitures/workbench.glb');
useGLTF.preload('/models/furnitures/alchemy-table.glb');

export function WorkshopFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      <RoomProp path="/models/furnitures/workbench.glb" position={[cx + 2.2, 0, cz - 2.6]} targetHeight={1.0} rotY={-0.2} />
       <RoomProp path="/models/furnitures/Hammer_on_a_Wooden_Bl.glb" position={[cx + 0.8, 0, cz - 0.5]} targetHeight={1.0} rotY={-2} />
      <RoomProp path="/models/furnitures/bamboopanel.glb" position={[cx - 1, 0, cz - 2]} targetHeight={3.1} rotY={0} />
      <RoomProp path="/models/furnitures/Red_Woodworking_Workbench.glb" position={[cx - 2.7, 0, cz + 0.5]} targetHeight={1.7} rotY={1.5} />
      <RoomProp path="/models/furnitures/red_workbend_2.glb" position={[cx - 1, 0, cz + 3]} targetHeight={1.4} rotY={3.15} />
      <RoomProp path="/models/furnitures/Cozy_Brick_Fireplace.glb" position={[cx - 0.5, 0, cz - 2.55]} targetHeight={3.5} rotY={0} />
      <RoomProp path="/models/furnitures/Wooden_Crates_and_Bar.glb" position={[cx - 2.4, 0, cz - 2.6]} targetHeight={1} rotY={0} />
      <RoomProp path="/models/furnitures/Barrels_and_Crates.glb" position={[cx + 2.7, 0, cz + 2.5]} targetHeight={1} rotY={1.5} />
      <RoomProp path="/models/furnitures/Crimson_Ember_Flask.glb" position={[cx + 3, 2.5, cz - 3]} targetHeight={1} rotY={1.5} />
      <RoomProp path="/models/furnitures/Crimson_Ember_Flask.glb" position={[cx + 3, 2.5, cz + 2.5]} targetHeight={1} rotY={1.5} />
    </group>
  );
}
