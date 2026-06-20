import { useGLTF } from '@react-three/drei';
import { RoomProp } from '../facility/room-prop';
import { InteractiveFacilityObject } from '../facility/interactive-facility-object';
import { assetUrl } from '@/lib/asset-url';

useGLTF.preload(assetUrl('/models/furnitures/LinhSonTavernBackground.glb'));

export function TavernFurniture({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      {/* Apothecary counter — click to open the recruitment panel for this tavern */}
      <InteractiveFacilityObject
        glbPath="/models/furnitures/LinhSonTavernBackground.glb"
        position={[cx - 2.8, 0, cz + 1.2]}
        targetHeight={3}
        rotY={1.55}
        hitboxSize={[2.4, 3.2, 2.4]}
        facilityType="tavern"
      />
      <RoomProp path="/models/furnitures/Tavern_Rusty_Steamworks_Fact.glb" position={[cx - 1.2, 0, cz+1.2]} targetHeight={1.8} rotY={1.55} />
      <RoomProp path="/models/furnitures/Tavern_Emerald_Bamboo_Table.glb" position={[cx + 1.5, 0, cz - 1.2]} targetHeight={0.7} rotY={0} />
      <RoomProp path="/models/furnitures/Tavern_Emerald_Cottage.glb" position={[cx + 0.5, 0, cz + 0.8]} targetHeight={0.5} rotY={1.5} />
      <RoomProp path="/models/furnitures/Tavern_Emerald_Bamboo_Table.glb" position={[cx + 2, 0, cz+ 2]} targetHeight={0.7} rotY={1.5} />
      <RoomProp path="/models/furnitures/Tavern_Emerald_Cottage.glb" position={[cx + 2, 0, cz+ 0.5]} targetHeight={0.5} rotY={1.5} />
      <RoomProp path="/models/furnitures/GateTavern.glb" position={[cx + 0, 0, cz - 3.2]} targetHeight={2.8} rotY={0} />
      <RoomProp path="/models/furnitures/CooperDrumhanger.glb" position={[cx - 2.5 , 0, cz - 2.2]} targetHeight={1.3} rotY={1} />
    </group>
  );
}
